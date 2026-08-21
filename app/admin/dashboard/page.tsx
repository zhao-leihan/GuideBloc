import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users, FileText, Calendar, DollarSign, ShieldAlert, Activity, CreditCard, ExternalLink, ArrowRightLeft, Star } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/auth/login");
  }

  // 1. Core KPIs
  const totalUsers = await prisma.user.count();
  const activeGigs = await prisma.gig.count({ where: { isActive: true } });
  const totalBookings = await prisma.booking.count();

  const revenueSum = await prisma.platformRevenue.aggregate({
    _sum: { amountUSDT: true },
  });
  const platformRevenue = revenueSum._sum.amountUSDT || 0;

  // 2. Escrow & Daily Volume Logic
  const escrowBookings = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "PAID", "DISPUTED"] },
    },
    select: { totalPriceUSD: true },
  });
  const totalEscrowLocked = escrowBookings.reduce((sum, b) => sum + b.totalPriceUSD, 0);

  const dailyVolumeAggregate = await prisma.booking.aggregate({
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      status: { in: ["CONFIRMED", "PAID", "COMPLETED"] },
    },
    _sum: { totalPriceUSD: true },
  });
  const dailyVolume = dailyVolumeAggregate._sum.totalPriceUSD || 0;

  // 3. Platform Disputes Feed
  const openDisputesCount = await prisma.booking.count({
    where: { status: "DISPUTED" },
  });

  const disputedBookingsList = await prisma.booking.findMany({
    where: { status: "DISPUTED" },
    include: {
      gig: {
        select: {
          title: true,
          guide: { select: { name: true, email: true } },
        },
      },
      tourist: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // 4. Fetch Platform Reviews
  const platformReviewsList = await prisma.platformReview.findMany({
    include: {
      reviewer: { select: { name: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // 4. Platform Treasury Wallet Monitoring (Base L2 RPC)
  const treasuryAddress = process.env.TREASURY_ADDRESS || process.env.NEXT_PUBLIC_PLATFORM_TREASURY || "0x079D9c349741C27565ee04e31E4174F640F512aE";
  let treasuryBalance = "0.0000";
  let treasuryTransactions: any[] = [];

  try {
    const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
    const rpcUrl = isBaseMainnet ? "https://mainnet.base.org" : "https://sepolia.base.org";
    const rpcResponse = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [treasuryAddress, "latest"],
        id: 1,
      }),
      cache: "no-store",
    });
    if (rpcResponse.ok) {
      const rpcData = await rpcResponse.json();
      if (rpcData.result) {
        const balanceWei = BigInt(rpcData.result);
        treasuryBalance = (Number(balanceWei) / 1e18).toFixed(4);
      }
    }
  } catch (err) {
    console.error("Treasury balance fetch error:", err);
  }

  try {
    const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
    const scanUrl = isBaseMainnet
      ? `https://api.basescan.org/api?module=account&action=txlist&address=${treasuryAddress}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc`
      : `https://api-sepolia.basescan.org/api?module=account&action=txlist&address=${treasuryAddress}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc`;

    const scanResponse = await fetch(scanUrl, { cache: "no-store" });
    if (scanResponse.ok) {
      const scanData = await scanResponse.json();
      if (scanData.status === "1" && Array.isArray(scanData.result)) {
        treasuryTransactions = scanData.result.map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: (Number(tx.value) / 1e18).toFixed(4),
          timeStamp: new Date(Number(tx.timeStamp) * 1000).toLocaleDateString(),
        }));
      }
    }
  } catch (err) {
    console.error("Treasury transaction list fetch error:", err);
  }



  // 5. Revenue Source Breakdown
  const revenueGroup = await prisma.platformRevenue.groupBy({
    by: ["source"],
    _sum: { amountUSDT: true },
  });

  const breakdownMap: Record<string, { label: string; color: string }> = {
    BOOKING_COMMISSION: { label: "Booking Commission (10%)", color: "bg-primary" },
    SUBSCRIPTION_FEE: { label: "Guide Subscriptions", color: "bg-secondary" },
    GIG_BOOST: { label: "Gig Boosts ($1)", color: "bg-accent" },
    TIP_FEE: { label: "Tip Fees", color: "bg-purple-500" },
  };

  const breakdown = Object.keys(breakdownMap).map((key) => {
    const item = revenueGroup.find((g) => g.source === key);
    const amount = item?._sum.amountUSDT || 0;
    const percent = platformRevenue > 0 ? Math.round((amount / platformRevenue) * 100) : 0;
    return {
      source: breakdownMap[key].label,
      amount,
      percent,
      color: breakdownMap[key].color,
    };
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Admin Dashboard</h1>
          <p className="text-dark-500">Platform operational overview, multi-signature, and escrow vault status</p>
        </div>

        {/* 6-Column KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: "Total Users", value: totalUsers.toLocaleString(), change: "Registered accounts", icon: Users, color: "bg-primary/10 text-primary" },
            { label: "Active Gigs", value: activeGigs.toLocaleString(), change: "Live tour listings", icon: FileText, color: "bg-secondary/10 text-secondary" },
            { label: "Total Bookings", value: totalBookings.toLocaleString(), change: "Booked transactions", icon: Calendar, color: "bg-accent/10 text-accent" },
            { label: "Daily Volume", value: `$${dailyVolume.toLocaleString()} USDT`, change: "Last 24h volume", icon: Activity, color: "bg-blue-500/10 text-blue-500" },
            { label: "Locked in Escrow", value: `$${totalEscrowLocked.toLocaleString()} USDT`, change: "Held stablecoins", icon: CreditCard, color: "bg-purple-500/10 text-purple-500" },
            { label: "Platform Revenue", value: `$${platformRevenue.toLocaleString()} USDT`, change: "All operational fees", icon: DollarSign, color: "bg-green-500/10 text-green-500" },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-dark-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-dark-900">{stat.value}</p>
                <p className="text-[10px] text-dark-400 mt-0.5">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Treasury Wallet Monitoring via RPC (2 Cols) */}
          <div className="card p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-dark-900 text-lg">Platform Treasury Monitor</h3>
                <p className="text-xs text-dark-400">Real-time Base RPC & explorer node status (Read-Only)</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" /> RPC Connected
              </span>
            </div>

            <div className="bg-dark-50 p-4 rounded-xl space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-sm font-semibold text-dark-600">Platform Treasury Address:</span>
                <code className="text-xs bg-white border border-dark-200 px-2.5 py-1 rounded text-dark-900 font-mono break-all font-semibold">
                  {treasuryAddress}
                </code>
              </div>
              <div className="flex items-center justify-between border-t border-dark-200/50 pt-2 mt-2">
                <span className="text-sm font-semibold text-dark-600">Dynamic Balance:</span>
                <span className="text-lg font-black text-primary font-mono">{treasuryBalance} ETH</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-dark-500 uppercase tracking-wider flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3" /> Recent Transactions (Base)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-dark-100 text-dark-500">
                      <th className="py-2 font-semibold">Tx Hash</th>
                      <th className="py-2 font-semibold">From</th>
                      <th className="py-2 font-semibold">To</th>
                      <th className="py-2 font-semibold text-right">Value (ETH)</th>
                      <th className="py-2 font-semibold text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treasuryTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-dark-400">
                          No recent transactions found on Base network for this wallet.
                        </td>
                      </tr>
                    ) : (
                      treasuryTransactions.map((tx, idx) => (
                        <tr key={idx} className="border-b border-dark-100/50 hover:bg-dark-50/50 transition-colors">
                          <td className="py-2 font-mono text-primary font-medium">
                            <a href={`https://basescan.org/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                              {tx.hash.substring(0, 10)}... <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </td>
                          <td className="py-2 text-dark-600 font-mono">{tx.from.substring(0, 8)}...</td>
                          <td className="py-2 text-dark-600 font-mono">{tx.to.substring(0, 8)}...</td>
                          <td className="py-2 text-right font-mono font-bold text-dark-900">{tx.value}</td>
                          <td className="py-2 text-right text-dark-400">{tx.timeStamp}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown (1 Col) */}
          <div className="card p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-dark-900 text-lg mb-4">Revenue Breakdown</h3>
              <div className="space-y-4">
                {breakdown.map((item) => (
                  <div key={item.source}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-dark-600">{item.source}</span>
                      <span className="font-semibold text-dark-900">${item.amount.toLocaleString()} ({item.percent}%)</span>
                    </div>
                    <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-dark-100 flex items-center justify-between">
              <span className="font-medium text-dark-700">Total Net Income</span>
              <span className="text-lg font-bold text-dark-900">${platformRevenue.toLocaleString()} USDT</span>
            </div>
          </div>
        </div>

        {/* Disputes & Platform Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispute Center & Platform Feedback Reviews Feed (2 Cols) */}
          <div className="space-y-6 lg:col-span-2">
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-dark-100 pb-3">
                <div>
                  <h3 className="font-display font-bold text-dark-900 text-lg flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-accent" /> Escrow Dispute Resolution Center
                  </h3>
                  <p className="text-xs text-dark-400">Manage locked funds and dispute resolution manually</p>
                </div>
                <span className="px-2 py-1 rounded bg-accent/10 text-accent text-xs font-bold font-mono">
                  {openDisputesCount} Open Disputes
                </span>
              </div>

              {disputedBookingsList.length === 0 ? (
                <div className="text-center py-6 text-dark-400 text-sm">
                  🎉 No open disputes found! All funds are processing normally.
                </div>
              ) : (
                <div className="space-y-3">
                  {disputedBookingsList.map((b) => (
                    <div key={b.id} className="border border-dark-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="font-bold text-dark-900 text-sm">{b.gig.title}</h4>
                        <p className="text-xs text-dark-500 mt-1">
                          Tourist: <strong>{b.tourist.name}</strong> ({b.tourist.email})
                        </p>
                        <p className="text-xs text-dark-500">
                          Guide: <strong>{b.gig.guide.name}</strong> ({b.gig.guide.email})
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-accent font-mono">${b.totalPriceUSD} USDT</span>
                        <a href={`/admin/revenue`} className="btn-secondary px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1">
                          Resolve <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Feedback Reviews Feed */}
            <div className="card p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-dark-100 pb-3">
                <div>
                  <h3 className="font-display font-bold text-dark-900 text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-secondary" /> Explomate Platform Reviews
                  </h3>
                  <p className="text-xs text-dark-400">Direct feedback sent by users about the Explomate.ly platform</p>
                </div>
              </div>

              {platformReviewsList.length === 0 ? (
                <div className="text-center py-6 text-dark-400 text-sm">
                  No platform feedback reviews submitted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {platformReviewsList.map((r) => (
                    <div key={r.id} className="border-b border-dark-100 last:border-b-0 pb-4 last:pb-0 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary text-xs overflow-hidden">
                            {r.reviewer.avatar ? (
                              <img src={r.reviewer.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              r.reviewer.name[0]
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-dark-900">{r.reviewer.name}</span>
                            <span className="text-[10px] text-dark-400 block">{r.reviewer.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < r.rating ? "fill-secondary text-secondary" : "text-dark-200"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-dark-600 leading-relaxed italic">&ldquo;{r.comment}&rdquo;</p>
                      <span className="text-[9px] text-dark-400 block text-right">
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="card p-6 space-y-4">
            <h3 className="font-display font-bold text-dark-900 text-lg">System Health Status</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: "Active Payout Channels", value: "3 Channels (Base Splitter)", status: "good" },
                { label: "Automatic Timelock Release", value: "Active (7 Days)", status: "good" },
                { label: "Paymaster Gas Sponsorship", value: "Active (Base Paymaster)", status: "good" },
                { label: "Brute-force Captcha Shield", value: "Turnstile Active", status: "good" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-dark-600">{item.label}</span>
                  <span className="font-semibold text-secondary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
