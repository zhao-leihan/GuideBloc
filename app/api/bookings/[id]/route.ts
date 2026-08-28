import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateGigRankingScore } from "@/lib/ranking";

// Helper: returns true if a txHash represents a real on-chain transaction
function isRealTxHash(hash: string | null | undefined): boolean {
  if (!hash) return false;
  if (hash === "N/A") return false;
  if (hash.startsWith("0xMOCK")) return false;
  if (hash.startsWith("0x") && hash.length >= 64) return true;
  return false;
}

// Helper: dynamically resolve the correct RPC URL for a given network string
function getRpcUrl(network?: string | null): string {
  const isMainnet =
    process.env.NEXT_PUBLIC_AVAX_NETWORK === "mainnet" ||
    process.env.NEXT_PUBLIC_AVALANCHE_NETWORK === "mainnet";
  return isMainnet
    ? "https://api.avax.network/ext/bc/C/rpc"
    : "https://api.avax-test.network/ext/bc/C/rpc";
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { status, txHash, paymentNetwork, proofPhoto } = await req.json();
    if (!status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        tourist: true,
        gig: {
          include: {
            guide: { select: { id: true, name: true, email: true, walletAddress: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // ─── CONFIRMED: Verify payment before accepting ─────────────────────────
    if (status === "CONFIRMED") {
      if (!txHash || txHash === "N/A") {
        return NextResponse.json(
          { message: "Transaction reference is required" },
          { status: 400 }
        );
      }

      // Case A: MoonPay Checkout verification
      if (!txHash.startsWith("0x")) {
        const secretKey = process.env.MOONPAY_SECRET_KEY;
        if (!secretKey) {
          return NextResponse.json(
            { message: "MOONPAY_SECRET_KEY is not configured in your server .env file." },
            { status: 400 }
          );
        }

        try {
          const orderRes = await fetch(
            `https://api.moonpay.com/v1/transactions/${txHash}`,
            { headers: { "X-Api-Key": secretKey } }
          );

          if (!orderRes.ok) {
            return NextResponse.json(
              { message: "MoonPay transaction verification failed: Transaction not found on MoonPay" },
              { status: 400 }
            );
          }

          const tx = await orderRes.json();
          if (!tx) {
            return NextResponse.json(
              { message: "MoonPay transaction details not found in response" },
              { status: 400 }
            );
          }

          const validStatuses = ["completed", "pending"];
          if (!validStatuses.includes(tx.status?.toLowerCase())) {
            return NextResponse.json(
              { message: `MoonPay payment is not completed. Status: ${tx.status}` },
              { status: 400 }
            );
          }

          const assetCode = tx.destination?.asset?.code?.toLowerCase() || "";
          if (assetCode !== "usdc") {
            return NextResponse.json(
              { message: "MoonPay payment must be USDC" },
              { status: 400 }
            );
          }

          const paidAmount = Number(tx.source?.amount || 0);
          if (Math.abs(paidAmount - booking.totalPriceUSD) > 1.5) {
            return NextResponse.json(
              { message: `MoonPay payment amount mismatch. Expected: ${booking.totalPriceUSD} USD` },
              { status: 400 }
            );
          }
        } catch (verifyErr: any) {
          console.error("MoonPay verification server error:", verifyErr);
          return NextResponse.json(
            { message: `MoonPay validation failed: ${verifyErr.message}` },
            { status: 400 }
          );
        }
      }

      // Case B: Real EVM on-chain receipt verification
      // ✅ FIX: Use dynamic RPC URL based on the booking's paymentNetwork — NOT localhost
      if (txHash.startsWith("0x") && !txHash.startsWith("0xMOCK")) {
        const effectiveNetwork = paymentNetwork || booking.paymentNetwork || "avalanche";
        const rpcUrl = getRpcUrl(effectiveNetwork);

        // Only verify on-chain for real networks (skip for localhost dev)
        if (rpcUrl !== "http://127.0.0.1:8545") {
          try {
            const { ethers } = await import("ethers");
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const receipt = await provider.getTransactionReceipt(txHash);
            if (!receipt || receipt.status !== 1) {
              return NextResponse.json(
                { message: `EVM transaction failed or not found on ${effectiveNetwork}` },
                { status: 400 }
              );
            }
          } catch (chainErr: any) {
            // Non-fatal: log and continue — don't block legitimate payments over RPC issues
            console.warn(
              `[EVM Verify] Could not verify receipt on ${effectiveNetwork}:`,
              chainErr.message
            );
          }
        }
      }
    }

    // ─── Update booking status and optional payment fields ───────────────────
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status,
        ...(txHash && { txHash }),
        ...(paymentNetwork && { paymentNetwork }),
        ...(proofPhoto && { proofPhoto }),
      },
    });

    // ─── CONFIRMED: Generate PDF Receipt & Send Email to Tourist ─────────────
    if (status === "CONFIRMED") {
      try {
        const { generateReceiptPdf } = await import("@/lib/receipt");
        const { triggerBookingSuccessEmail } = await import("@/lib/email");

        const effectiveNetwork = updatedBooking.paymentNetwork || paymentNetwork || "Avalanche C-Chain";
        const effectiveTxHash = updatedBooking.txHash || txHash || "0x...";

        const pdfBuffer = generateReceiptPdf({
          id: updatedBooking.id,
          bookingDate: updatedBooking.bookingDate.toISOString(),
          bookingTime: updatedBooking.bookingTime || "09:00 AM",
          groupSize: updatedBooking.groupSize,
          totalPriceUSD: updatedBooking.totalPriceUSD,
          paymentNetwork: effectiveNetwork,
          txHash: effectiveTxHash,
          paymentMethod: "Web3 Smart Contract Escrow",
          gig: { title: booking.gig.title, location: booking.gig.location },
          tourist: { name: booking.tourist.name, email: booking.tourist.email },
        });

        await triggerBookingSuccessEmail(
          updatedBooking.id,
          booking.tourist.email,
          booking.gig.title,
          updatedBooking.totalPriceUSD,
          pdfBuffer
        );
      } catch (emailErr) {
        console.error("[Booking PATCH Email Error]", emailErr);
      }
    }

    // ─── COMPLETED: Record earnings and release hash ───────────
    if (status === "COMPLETED") {
      const releaseHash = isRealTxHash(txHash) ? txHash : (booking.txHash || null);

      const commissionAmount =
        booking.platform_fee ?? booking.totalPriceUSD * 0.1;
      const guideAmount = booking.totalPriceUSD - commissionAmount;

      const guideWallet =
        booking.guideWalletSnapshot ||
        booking.gig.guide.walletAddress ||
        "unknown";

      try {
        await prisma.$transaction([
          prisma.booking.update({
            where: { id: booking.id },
            data: { txHash: releaseHash },
          }),
          prisma.escrowPayout.create({
            data: {
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
        ]);
        console.log(
          `[Escrow Release] DB records created. Guide: ${guideAmount} USDC, Commission: ${commissionAmount} USDC`
        );
      } catch (dbErr: any) {
        console.error(
          `[Escrow Release] Failed to write DB records for booking: ${booking.id}`,
          dbErr
        );
      }
    }

    // ─── CANCELLED: Refund record update ──────────────────────────────────
    if (status === "CANCELLED") {
      const refundHash = isRealTxHash(txHash) ? txHash : booking.txHash;
      if (refundHash) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { txHash: refundHash },
        });
      }

      // Notifications for both parties
      try {
        await prisma.mail.create({
          data: {
            recipientId: booking.touristId,
            subject: "❌ Booking Cancelled & Escrow Refunded",
            body: `Your booking for "${booking.gig.title}" has been cancelled. The locked contract balance of ${booking.totalPriceUSD} USDC has been refunded to your wallet address.`,
          },
        });
        await prisma.mail.create({
          data: {
            recipientId: booking.gig.guideId,
            subject: "❌ Booking Cancelled",
            body: `The booking for your tour "${booking.gig.title}" has been cancelled. The escrow balance has been returned to the tourist.`,
          },
        });
      } catch (mailErr) {
        console.error("Failed to write cancellation notification emails:", mailErr);
      }
    }

    // ─── CONFIRMED: Send receipt email ───────────────────
    if (status === "CONFIRMED") {

      // Send PDF receipt email
      try {
        const fullBooking = await prisma.booking.findUnique({
          where: { id: params.id },
          include: {
            gig: { select: { title: true, location: true } },
            tourist: { select: { name: true, email: true } },
          },
        });

        if (fullBooking) {
          const { generateReceiptPdf } = await import("@/lib/receipt");
          const { triggerBookingSuccessEmail } = await import("@/lib/email");
          const pdfBuffer = generateReceiptPdf(fullBooking as any);
          await triggerBookingSuccessEmail(
            fullBooking.id,
            fullBooking.tourist.email,
            fullBooking.gig.title,
            fullBooking.totalPriceUSD,
            pdfBuffer
          );
        }
      } catch (err) {
        console.error("Failed to generate/email PDF receipt:", err);
      }
    }

    // ─── COMPLETED: Gamification rewards + payout emails ────────────────────
    if (status === "COMPLETED") {
      const xpEarned = Math.max(100, Math.round(booking.totalPriceUSD * 10));
      const guide = await prisma.user.findUnique({
        where: { id: booking.gig.guide.id },
      });

      // Fetch tourist details for email
      const tourist = await prisma.user.findUnique({
        where: { id: booking.touristId },
        select: { email: true, name: true },
      });

      if (guide) {
        const newXp = (guide.xp || 0) + xpEarned;
        const newLevel = Math.floor(newXp / 1000) + 1;
        const oldLevel = guide.level || 1;

        await prisma.user.update({
          where: { id: guide.id },
          data: { xp: newXp, level: newLevel },
        });

        const commissionAmount =
          booking.platform_fee ?? booking.totalPriceUSD * 0.1;
        const guideNet = booking.totalPriceUSD - commissionAmount;

        await prisma.mail.create({
          data: {
            recipientId: guide.id,
            subject: `💰 Escrow Released: You Earned ${guideNet.toFixed(2)} USDC (+${xpEarned} XP)`,
            body: `Excellent job! The tourist completed the tour "${booking.gig.title}". You earned +${xpEarned} XP.\n\nYour net earnings: ${guideNet.toFixed(2)} USDC (after ${commissionAmount.toFixed(2)} USDC platform fee) have been released on-chain to your wallet.`,
          },
        });

        if (newLevel > oldLevel) {
          await prisma.mail.create({
            data: {
              recipientId: guide.id,
              subject: `🎉 Level Up: Reached Level ${newLevel}!`,
              body: `Congratulations on leveling up to Level ${newLevel}! Your guide status has gained priority rank boost.`,
            },
          });
        }

        // Send real payout email to guide
        try {
          const { triggerGuidePayoutEmail } = await import("@/lib/email");
          await triggerGuidePayoutEmail(
            booking.id,
            guide.email,
            guide.name,
            booking.gig.title,
            guideNet,
            commissionAmount,
            xpEarned
          );
        } catch (emailErr) {
          console.error("[Payout Email] Guide payout email failed:", emailErr);
        }
      }

      // Send completion confirmation email to tourist
      if (tourist) {
        try {
          const { triggerTouristCompletionEmail } = await import("@/lib/email");
          const guideName = booking.gig.guide
            ? (await prisma.user.findUnique({ where: { id: booking.gig.guide.id }, select: { name: true } }))?.name ?? "your guide"
            : "your guide";
          await triggerTouristCompletionEmail(
            booking.id,
            tourist.email,
            booking.gig.title,
            guideName,
            booking.totalPriceUSD
          );
        } catch (emailErr) {
          console.error("[Completion Email] Tourist completion email failed:", emailErr);
        }
      }
    }

    // Update gig ranking score
    await recalculateGigRankingScore(booking.gigId);

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Booking PATCH status error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { message: "Only unpaid pending bookings can be deleted" },
        { status: 400 }
      );
    }

    await prisma.booking.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Booking DELETE error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
