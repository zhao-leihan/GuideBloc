import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateGuideGigsRanking } from "@/lib/ranking";
import { verifyTreasuryTransfer } from "@/lib/crypto/verifyTreasuryTransfer";

export const dynamic = "force-dynamic";

const PRO_PRICE = 9.99;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "GUIDE") {
      return NextResponse.json(
        { message: "Only guides can purchase subscriptions" },
        { status: 403 }
      );
    }

    const { tier, txHash, network } = await req.json();

    if (tier !== "PRO") {
      return NextResponse.json(
        { message: "Invalid subscription tier. Only PRO is available." },
        { status: 400 }
      );
    }

    if (!txHash) {
      return NextResponse.json(
        { message: "Transaction hash is required" },
        { status: 400 }
      );
    }

    // ── Replay protection ──────────────────────────────────────────────
    const existing = await prisma.userSubscription.findFirst({
      where: { txHash },
    });
    if (existing) {
      return NextResponse.json(
        { message: "This transaction has already been used to activate a subscription." },
        { status: 400 }
      );
    }

    // ── On-chain verification ──────────────────────────────────────────
    // Confirm that txHash is a real USDC/USDT transfer to our treasury
    // of at least $9.99 before granting any access.
    const verification = await verifyTreasuryTransfer(
      txHash,
      PRO_PRICE,
      network || "avalanche"
    );

    if (!verification.ok) {
      // Log the failed attempt for audit
      await prisma.paymentAuditLog.create({
        data: {
          txHash,
          source: "SUBSCRIPTION_FEE",
          status: "REJECTED",
          errorMessage: verification.error,
          rawPayload: { userId: user.id, tier, network },
        },
      });
      return NextResponse.json(
        { message: verification.error || "On-chain verification failed." },
        { status: 400 }
      );
    }

    // ── Activate subscription ──────────────────────────────────────────
    const now = new Date();
    const currentExpiry = user.subscription_expiry
      ? new Date(user.subscription_expiry)
      : null;

    // Stack on top of existing active subscription if any
    const newExpiry = new Date(
      (currentExpiry && currentExpiry > now ? currentExpiry : now).getTime() +
        30 * 24 * 60 * 60 * 1000
    );

    // 1. Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { subscription_type: tier, subscription_expiry: newExpiry },
    });

    // 2. Ensure SubscriptionPlan record exists
    let plan = await prisma.subscriptionPlan.findFirst({
      where: { name: tier, role: "GUIDE" },
    });
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: tier,
          role: "GUIDE",
          priceMonthly: PRO_PRICE,
          priceYearly: PRO_PRICE * 10,
          commissionRate: 5.0,
          features: [
            "Priority ranking boost",
            "Featured badge on all listings",
            "High-visibility profile placement",
            "Advanced discoverability score boost",
            "Priority support channel",
          ],
        },
      });
    }

    // 3. Record subscription history
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

    // 4. Record platform revenue
    await prisma.platformRevenue.create({
      data: {
        source: "SUBSCRIPTION_FEE",
        amountUSDT: verification.transferredUSD,
        txHash,
        referenceId: user.id,
      },
    });

    // 5. Audit log — success
    await prisma.paymentAuditLog.create({
      data: {
        txHash,
        source: "SUBSCRIPTION_FEE",
        status: "SUCCESS",
        rawPayload: {
          userId: user.id,
          tier,
          amountUSD: verification.transferredUSD,
          network: verification.network,
          blockNumber: verification.blockNumber,
        },
      },
    });

    // 6. Recalculate ranking for all guide gigs
    await recalculateGuideGigsRanking(user.id);

    return NextResponse.json({
      message: "Pro subscription activated successfully.",
      subscription_type: tier,
      subscription_expiry: newExpiry,
    });
  } catch (error) {
    console.error("[Subscribe API Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
