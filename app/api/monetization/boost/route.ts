import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateGigRankingScore } from "@/lib/ranking";
import { CONFIG } from "@/lib/config";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "GUIDE") {
      return NextResponse.json({ message: "Only guides can boost gigs" }, { status: 403 });
    }

    const { gigId, txHash } = await req.json();
    if (!gigId || !txHash) {
      return NextResponse.json({ message: "Gig ID and transaction hash are required" }, { status: 400 });
    }

    // Verify gig belongs to this guide
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
    });

    if (!gig) {
      return NextResponse.json({ message: "Gig not found" }, { status: 404 });
    }

    if (gig.guideId !== user.id) {
      return NextResponse.json({ message: "Unauthorized to boost this gig" }, { status: 403 });
    }

    const cost = CONFIG.FEATURED_GIG_PRICE;

    // Calculate boost expiry period: 7 days
    const now = new Date();
    let currentExpiry = gig.featured_until ? new Date(gig.featured_until) : null;
    let newExpiry = new Date();

    if (currentExpiry && currentExpiry > now) {
      newExpiry = new Date(currentExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      newExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    // 1. Update Gig model featured expiry property
    await prisma.gig.update({
      where: { id: gigId },
      data: {
        featured_until: newExpiry,
      },
    });

    // 2. Log boost transaction details
    await prisma.gigBoost.create({
      data: {
        gigId,
        guideId: user.id,
        boostType: "TOP_SEARCH",
        priceUSDT: cost, // store USDC cost
        txHash,
        startsAt: now,
        expiresAt: newExpiry,
      },
    });

    // 3. Log platform revenue details
    await prisma.platformRevenue.create({
      data: {
        source: "FEATURED_LISTING",
        amountUSDT: cost,
        txHash,
        referenceId: gigId,
      },
    });

    // 4. Trigger discoverability score update for the gig
    await recalculateGigRankingScore(gigId);

    return NextResponse.json({
      message: "Gig successfully boosted to Featured!",
      featured_until: newExpiry,
    });
  } catch (error) {
    console.error("Monetization boost POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
