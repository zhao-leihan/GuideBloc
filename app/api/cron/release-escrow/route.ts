import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/release-escrow
 * 24-hour fallback: auto-releases escrow for bookings where:
 *   - Guide has pressed "Request Completion" (completionRequestedAt is set)
 *   - Tourist has not scanned QR within 24 hours
 *   - Booking is NOT disputed
 * 
 * Register in vercel.json cron jobs or call manually.
 */
export async function GET(req: Request) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find bookings eligible for auto-release
    const eligibleBookings = await prisma.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "PAID"] },
        completionRequestedAt: { lte: twentyFourHoursAgo },
        // Exclude disputed bookings — they need human resolution
        NOT: { status: "DISPUTED" },
      },
      include: {
        gig: {
          include: {
            guide: { select: { id: true, name: true, email: true, walletAddress: true } },
          },
        },
        tourist: { select: { id: true, name: true, email: true } },
      },
    });

    if (eligibleBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No bookings eligible for auto-release.",
        releasedCount: 0,
      });
    }

    let releasedCount = 0;
    const errors: string[] = [];

    for (const booking of eligibleBookings) {
      try {
        const guideAmount = booking.guide_price ?? (booking.totalPriceUSD - (booking.platform_fee ?? booking.totalPriceUSD * 0.1));
        const commissionAmount = booking.platform_fee ?? (booking.totalPriceUSD - guideAmount);
        const guideWallet = booking.guideWalletSnapshot || booking.gig.guide.walletAddress || "unknown";
        let releaseHash = booking.txHash || null;

        if (process.env.RELAYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY) {
          try {
            const { executeGaslessRelease } = await import("@/lib/crypto/gaslessRelayer");
            const relayerResult = await executeGaslessRelease(booking.id);
            if (relayerResult?.txHash) {
              releaseHash = relayerResult.txHash;
            }
          } catch (onChainErr: any) {
            console.warn("[Cron Auto-Release] Gasless on-chain release notice:", onChainErr.message);
          }
        }

        await prisma.$transaction([
          prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: "COMPLETED",
              completionToken: null,
              completionTokenExpiresAt: null,
            },
          }),
          prisma.escrowPayout.upsert({
            where: { bookingId: booking.id },
            update: { status: "COMPLETED", releaseHash },
            create: {
              bookingId: booking.id,
              guideId: booking.gig.guide.id,
              guideWallet,
              guideAmountUSD: guideAmount,
              commissionAmountUSD: commissionAmount,
              releaseHash,
              status: "COMPLETED",
            },
          }),
          prisma.platformRevenue.create({
            data: {
              source: "BOOKING_COMMISSION",
              amountUSDT: commissionAmount,
              txHash: releaseHash,
              referenceId: booking.id,
            },
          }),
          prisma.paymentAuditLog.create({
            data: {
              bookingId: booking.id,
              txHash: releaseHash,
              source: "CRON_AUTO_RELEASE",
              status: "SUCCESS",
              rawPayload: { reason: "Tourist did not scan QR within 24h of completion request. No dispute filed." },
            },
          }),
        ]);

        // XP reward for guide
        const xpEarned = Math.max(100, Math.round(booking.totalPriceUSD * 10));
        const guide = await prisma.user.findUnique({ where: { id: booking.gig.guide.id } });
        if (guide) {
          const newXp = (guide.xp || 0) + xpEarned;
          const newLevel = Math.floor(newXp / 1000) + 1;
          await prisma.user.update({ where: { id: guide.id }, data: { xp: newXp, level: newLevel } });
          await prisma.mail.create({
            data: {
              recipientId: guide.id,
              subject: "Auto-Released: " + guideAmount.toFixed(2) + " USDC Earned for \"" + booking.gig.title + "\"",
              body: "The 24-hour completion window has passed without dispute. Your earnings of " + guideAmount.toFixed(2) + " USDC have been automatically released. You earned +" + xpEarned + " XP.",
            },
          });
        }

        // Notify tourist as well
        await prisma.mail.create({
          data: {
            recipientId: booking.touristId,
            subject: "Tour Completed: \"" + booking.gig.title + "\"",
            body: "Your booking for \"" + booking.gig.title + "\" has been automatically completed after the 24-hour review period. If you experienced any issues, please contact support.",
          },
        });

        releasedCount++;
        console.log("[Cron Auto-Release] Released booking: " + booking.id);
      } catch (err: any) {
        console.error("[Cron Auto-Release] Failed for booking " + booking.id + ":", err.message);
        errors.push(booking.id + ": " + err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Auto-released " + releasedCount + " booking(s).",
      releasedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[Cron Release-Escrow Error]", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
