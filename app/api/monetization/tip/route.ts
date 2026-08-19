import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyTreasuryTransfer } from "@/lib/crypto/verifyTreasuryTransfer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { txHash, amountUSD, network, bookingId } = await req.json();

    if (!txHash || !amountUSD || Number(amountUSD) <= 0) {
      return NextResponse.json(
        { message: "txHash and a positive amountUSD are required" },
        { status: 400 }
      );
    }

    // ── Replay protection ──────────────────────────────────────────────
    const existing = await prisma.platformRevenue.findFirst({
      where: { txHash, source: "TIP_FEE" },
    });
    if (existing) {
      return NextResponse.json(
        { message: "This transaction has already been recorded as a tip." },
        { status: 400 }
      );
    }

    // ── On-chain verification ──────────────────────────────────────────
    // Tips are free-amount — pass 0 as minAmount so any positive transfer is valid.
    const verification = await verifyTreasuryTransfer(
      txHash,
      0, // no minimum — user decides amount
      network || "avalanche"
    );

    if (!verification.ok) {
      await prisma.paymentAuditLog.create({
        data: {
          txHash,
          source: "TIP_FEE",
          status: "REJECTED",
          errorMessage: verification.error,
          rawPayload: {
            userId: (session.user as any).id,
            claimedAmountUSD: amountUSD,
            network,
          },
        },
      });
      return NextResponse.json(
        { message: verification.error || "On-chain verification failed." },
        { status: 400 }
      );
    }

    // Use actual on-chain amount rather than the amount claimed by the client
    const actualAmountUSD = verification.transferredUSD;

    // ── Record tip ─────────────────────────────────────────────────────
    const revenue = await prisma.platformRevenue.create({
      data: {
        source: "TIP_FEE",
        amountUSDT: actualAmountUSD,
        txHash,
        referenceId: bookingId || (session.user as any).id,
      },
    });

    // Audit log — success
    await prisma.paymentAuditLog.create({
      data: {
        txHash,
        source: "TIP_FEE",
        status: "SUCCESS",
        rawPayload: {
          userId: (session.user as any).id,
          actualAmountUSD,
          claimedAmountUSD: amountUSD,
          network: verification.network,
          blockNumber: verification.blockNumber,
          bookingId: bookingId || null,
        },
      },
    });

    // Send thank-you email to tipper
    try {
      const { triggerTipReceivedEmail } = await import("@/lib/email");
      const tipper = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { email: true, name: true },
      });

      // Try to resolve the gig title from the bookingId
      let gigTitle = "your recent tour";
      if (bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { gig: { select: { title: true } } },
        });
        if (booking?.gig?.title) gigTitle = booking.gig.title;
      }

      if (tipper) {
        await triggerTipReceivedEmail(
          tipper.email,
          tipper.name,
          actualAmountUSD,
          gigTitle
        );
      }
    } catch (emailErr) {
      console.error("[Tip Email] Failed to send thank-you email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your support!",
      revenueId: revenue.id,
      actualAmountUSD,
    });
  } catch (error) {
    console.error("[Tip API Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
