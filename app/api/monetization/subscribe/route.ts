import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateGuideGigsRanking } from "@/lib/ranking";
import { CONFIG } from "@/lib/config";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "GUIDE") {
      return NextResponse.json({ message: "Only guides can purchase subscriptions" }, { status: 403 });
    }

    const { tier, txHash } = await req.json();
    if (tier !== "PRO") {
      return NextResponse.json({ message: "Invalid subscription tier. Only PRO is available." }, { status: 400 });
    }

    if (!txHash) {
      return NextResponse.json({ message: "Transaction hash is required" }, { status: 400 });
    }

    // Fixed $9.99 USDC for the single PRO tier
    const cost = 9.99;

    // Calculate subscription period: 30 days
    const now = new Date();
    let currentExpiry = user.subscription_expiry ? new Date(user.subscription_expiry) : null;
    let newExpiry = new Date();

    if (currentExpiry && currentExpiry > now) {
      newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // 1. Update User model subscription properties
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscription_type: tier,
        subscription_expiry: newExpiry,
      },
    });

    // 2. Fetch or create a SubscriptionPlan matching the tier (for relational integrity)
    let plan = await prisma.subscriptionPlan.findFirst({
      where: { name: tier, role: "GUIDE" }
    });

    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: tier,
          role: "GUIDE",
          priceMonthly: cost,
          priceYearly: cost * 10, // dummy
          commissionRate: 5.0, // flat 5%
          features: tier === "PRO" ? ["Priority ranking boost", "Featured badge"] : ["Strong ranking boost", "Homepage priority"],
        }
      });
    }

    // 3. Log user subscription transaction history
    await prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: newExpiry,
        txHash,
      },
    });

    // 4. Log platform revenue details
    await prisma.platformRevenue.create({
      data: {
        source: "SUBSCRIPTION_FEE",
        amountUSDT: cost, // store USDC payment amount
        txHash,
        referenceId: user.id,
      },
    });

    // 5. Trigger bulk discoverability score update for all this guide's gigs
    await recalculateGuideGigsRanking(user.id);

    return NextResponse.json({
      message: `Successfully upgraded to ${tier}`,
      subscription_type: tier,
      subscription_expiry: newExpiry,
    });
  } catch (error) {
    console.error("Monetization subscribe POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
