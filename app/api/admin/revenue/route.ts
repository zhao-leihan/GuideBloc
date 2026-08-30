import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all Platform Revenue transactions
    const transactions = await prisma.platformRevenue.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch total sum
    const totalAgg = await prisma.platformRevenue.aggregate({
      _sum: { amountUSDT: true },
    });
    const totalRevenue = totalAgg._sum.amountUSDT || 0;

    // 3. This Month Revenue
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthAgg = await prisma.platformRevenue.aggregate({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: { amountUSDT: true },
    });
    const thisMonthRevenue = monthAgg._sum.amountUSDT || 0;

    // 4. Group by source
    const sourceGroups = await prisma.platformRevenue.groupBy({
      by: ["source"],
      _sum: { amountUSDT: true },
    });

    let topSource = "Booking Commission";
    let topAmount = 0;

    const sources = sourceGroups.map((group) => {
      const amount = group._sum.amountUSDT || 0;
      const percent = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;
      let label = "Other";
      if (group.source === "BOOKING_COMMISSION") label = "Booking Commission";
      if (group.source === "SUBSCRIPTION_FEE") label = "Guide Subscriptions";
      if (group.source === "GIG_BOOST") label = "Gig Boosts";
      if (group.source === "TIP_FEE") label = "Tips & Gratuities";
      if (group.source === "FEATURED_LISTING") label = "Featured Listings";

      if (amount > topAmount) {
        topAmount = amount;
        topSource = label;
      }

      return {
        source: label,
        amount,
        percent,
      };
    });

    // 5. Escrow and Payout Metrics
    const escrowAgg = await prisma.booking.aggregate({
      where: {
        status: { in: ["CONFIRMED", "PAID", "DISPUTED"] },
      },
      _sum: { totalPriceUSD: true },
    });
    const totalEscrowLocked = escrowAgg._sum.totalPriceUSD || 0;

    const payoutAgg = await prisma.escrowPayout.aggregate({
      where: { status: "COMPLETED" },
      _sum: { guideAmountUSD: true },
    });
    const totalGuidePayouts = payoutAgg._sum.guideAmountUSD || 0;

    // 6. Monthly Time-Series Trend (Past 6 Months)
    const monthlyTrendMap = new Map<string, { label: string; commission: number; subscriptions: number; boosts: number; tips: number; total: number }>();
    
    // Seed past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      monthlyTrendMap.set(key, { label, commission: 0, subscriptions: 0, boosts: 0, tips: 0, total: 0 });
    }

    // Populate actual historical data
    for (const tx of transactions) {
      const d = new Date(tx.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyTrendMap.get(key);
      if (entry) {
        const amt = tx.amountUSDT || 0;
        entry.total += amt;
        if (tx.source === "BOOKING_COMMISSION") entry.commission += amt;
        else if (tx.source === "SUBSCRIPTION_FEE") entry.subscriptions += amt;
        else if (tx.source === "GIG_BOOST") entry.boosts += amt;
        else if (tx.source === "TIP_FEE") entry.tips += amt;
      }
    }

    const monthlyTrends = Array.from(monthlyTrendMap.values()).map(m => ({
      ...m,
      commission: Number(m.commission.toFixed(2)),
      subscriptions: Number(m.subscriptions.toFixed(2)),
      boosts: Number(m.boosts.toFixed(2)),
      tips: Number(m.tips.toFixed(2)),
      total: Number(m.total.toFixed(2)),
    }));

    // 7. Plain English Financial Insights for Non-Finance Admin
    const topSourcePercent = totalRevenue > 0 ? Math.round((topAmount / totalRevenue) * 100) : 0;
    const financialInsights = {
      summary: totalRevenue > 0
        ? `Platform cash flow is healthy. Your primary revenue driver is ${topSource}, accounting for ${topSourcePercent}% of all net platform income.`
        : "Platform financial engine is initialized. New commissions and fees will automatically chart here as tours are booked.",
      escrowNote: totalEscrowLocked > 0
        ? `$${totalEscrowLocked.toLocaleString()} USD is currently held safely in decentralized smart contracts awaiting tour completion.`
        : "All past escrow balances have been completely disbursed to tour guides with zero locked funds remaining.",
      payoutNote: `$${totalGuidePayouts.toLocaleString()} USD has been successfully transferred to tour guides' crypto wallets to date.`
    };

    // 8. Mapped Transactions List
    const mappedTransactions = transactions.map((tx) => ({
      date: new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      source: tx.source.replace("_", " ").toLowerCase(),
      amount: tx.amountUSDT,
      hash: tx.txHash ? `${tx.txHash.slice(0, 6)}...${tx.txHash.slice(-4)}` : "N/A",
      fullHash: tx.txHash || "",
      ref: tx.referenceId || "N/A",
    }));

    return NextResponse.json({
      totalRevenue,
      thisMonthRevenue,
      totalEscrowLocked,
      totalGuidePayouts,
      sources,
      monthlyTrends,
      financialInsights,
      transactions: mappedTransactions,
    });
  } catch (error) {
    console.error("Admin revenue error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
