import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateGigRankingScore } from "@/lib/ranking";
import { verifyTreasuryTransfer } from "@/lib/crypto/verifyTreasuryTransfer";
import { CONFIG } from "@/lib/config";

export const dynamic = "force-dynamic";

const BOOST_PRICE = CONFIG.FEATURED_GIG_PRICE; // $1

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "GUIDE") {
      return NextResponse.json(
        { message: "Only guides can boost gigs" },
        { status: 403 }
      );
    }

    const { gigId, txHash, network } = await req.json();

    if (!gigId || !txHash) {
      return NextResponse.json(
        { message: "Gig ID and transaction hash are required" },
        { status: 400 }
      );
    }

    // ── Verify gig ownership ───────────────────────────────────────────
    const gig = await prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) {
      return NextResponse.json({ message: "Gig not found" }, { status: 404 });
    }
    if (gig.guideId !== user.id) {
      return NextResponse.json(
        { message: "Unauthorized to boost this gig" },
        { status: 403 }
      );
    }

    // ── Replay protection ──────────────────────────────────────────────
    const existing = await prisma.gigBoost.findFirst({ where: { txHash } });
    if (existing) {
      return NextResponse.json(
        { message: "This transaction has already been used to boost a gig." },
        { status: 400 }
      );
    }

    // ── On-chain verification ──────────────────────────────────────────
    const verification = await verifyTreasuryTransfer(
      txHash,
      BOOST_PRICE,
      network || "avalanche"
    );

    if (!verification.ok) {
      await prisma.paymentAuditLog.create({
        data: {
          txHash,
          source: "FEATURED_LISTING",
          status: "REJECTED",
          errorMessage: verification.error,
          rawPayload: { userId: user.id, gigId, network },
        },
      });
      return NextResponse.json(
        { message: verification.error || "On-chain verification failed." },
        { status: 400 }
      );
    }

    // ── Apply boost ────────────────────────────────────────────────────
    const now = new Date();
    const currentExpiry =
      gig.featured_until && new Date(gig.featured_until) > now
        ? new Date(gig.featured_until)
        : now;

    // Stack on top of existing boost if still active
    const newExpiry = new Date(
      currentExpiry.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    // 1. Update gig
    await prisma.gig.update({
      where: { id: gigId },
      data: { featured_until: newExpiry },
    });

    // 2. Record boost
    await prisma.gigBoost.create({
      data: {
        gigId,
        guideId: user.id,
        boostType: "TOP_SEARCH",
        priceUSDT: verification.transferredUSD,
        txHash,
        startsAt: now,
        expiresAt: newExpiry,
      },
    });

    // 3. Record platform revenue
    await prisma.platformRevenue.create({
      data: {
        source: "FEATURED_LISTING",
        amountUSDT: verification.transferredUSD,
        txHash,
        referenceId: gigId,
      },
    });

    // 4. Audit log — success
    await prisma.paymentAuditLog.create({
      data: {
        txHash,
        source: "FEATURED_LISTING",
        status: "SUCCESS",
        rawPayload: {
          userId: user.id,
          gigId,
          amountUSD: verification.transferredUSD,
          network: verification.network,
          blockNumber: verification.blockNumber,
          boostedUntil: newExpiry,
        },
      },
    });

    // 5. Recalculate gig ranking score
    await recalculateGigRankingScore(gigId);

    // 6. Send boost confirmation email to guide
    try {
      const { triggerGigBoostEmail } = await import("@/lib/email");
      const guideUser = await import("@/lib/prisma").then(({ prisma }) =>
        prisma.user.findUnique({ where: { id: user.id }, select: { name: true } })
      );
      const boostedUntilFormatted = newExpiry.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      await triggerGigBoostEmail(
        user.email,
        guideUser?.name ?? user.name,
        gig.title,
        boostedUntilFormatted,
        verification.transferredUSD
      );
    } catch (emailErr) {
      console.error("[Boost Email] Failed to send boost email:", emailErr);
    }

    return NextResponse.json({
      message: "Gig boosted to Featured for 7 days.",
      featured_until: newExpiry,
    });
  } catch (error) {
    console.error("[Boost API Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
