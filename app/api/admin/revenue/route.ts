import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

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

    const sources = sourceGroups.map((group) => {
      const amount = group._sum.amountUSDT || 0;
      const percent = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;
      let label = "Other";
      if (group.source === "BOOKING_COMMISSION") label = "Booking Commission";
      if (group.source === "SUBSCRIPTION_FEE") label = "Guide Subscriptions";
      if (group.source === "GIG_BOOST") label = "Gig Boosts";
      if (group.source === "TIP_FEE") label = "Tip Fees";
      if (group.source === "FEATURED_LISTING") label = "Featured Listings";

      return {
        source: label,
        amount,
        percent,
      };
    });

    // 5. Mapped Transactions List
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
      sources,
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
