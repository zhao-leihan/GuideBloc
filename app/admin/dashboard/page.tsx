import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users, FileText, Calendar, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
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

  // 2. Revenue Breakdown
  const revenueGroup = await prisma.platformRevenue.groupBy({
    by: ["source"],
    _sum: { amountUSDT: true },
  });

  const breakdownMap: Record<string, { label: string; color: string }> = {
    BOOKING_COMMISSION: { label: "Booking Commission", color: "bg-primary" },
    SUBSCRIPTION_FEE: { label: "Guide Subscriptions", color: "bg-secondary" },
    GIG_BOOST: { label: "Gig Boosts", color: "bg-accent" },
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

  // 3. Platform Health
  const activeGuides = await prisma.user.count({ where: { role: "GUIDE" } });
  const pendingApprovals = await prisma.user.count({
    where: { guideStatus: "PENDING" },
  });
  const openDisputes = await prisma.booking.count({
    where: { status: "DISPUTED" },
  });
  const flaggedChats = await prisma.message.count({
    where: { isFlagged: true },
  });

  // 4. Recent Activity Feed
  const latestUsers = await prisma.user.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { name: true, createdAt: true },
  });

  const latestBookings = await prisma.booking.findMany({
    take: 2,
    orderBy: { createdAt: "desc" },
    include: {
      gig: { select: { title: true } },
    },
  });

  const recentActivity = [
    ...latestUsers.map((u) => ({
      text: `New user registered: ${u.name}`,
      createdAt: u.createdAt,
    })),
    ...latestBookings.map((b) => ({
      text: `Booking for gig "${b.gig.title}" - Status: ${b.status}`,
      createdAt: b.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Admin Dashboard</h1>
          <p className="text-dark-500">Platform overview and management</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: totalUsers.toLocaleString(), change: "All registered users", icon: Users, color: "bg-primary/10 text-primary" },
            { label: "Active Gigs", value: activeGigs.toLocaleString(), change: "Available listings", icon: FileText, color: "bg-secondary/10 text-secondary" },
            { label: "Total Bookings", value: totalBookings.toLocaleString(), change: "All time bookings", icon: Calendar, color: "bg-accent/10 text-accent" },
            { label: "Platform Revenue", value: `$${platformRevenue.toLocaleString()} USDT`, change: "Escrow commissions & fees", icon: DollarSign, color: "bg-green-500/10 text-green-500" },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-dark-900">{stat.value}</p>
              <p className="text-xs text-dark-400 mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Revenue Breakdown */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-dark-900 mb-4">Revenue Breakdown — This Month</h3>
          <div className="space-y-3">
            {breakdown.map((item) => (
              <div key={item.source}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-dark-600">{item.source}</span>
                  <span className="font-medium text-dark-900">{item.amount.toLocaleString()} USDT ({item.percent}%)</span>
                </div>
                <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-dark-100 flex items-center justify-between">
            <span className="font-medium text-dark-700">Total Revenue</span>
            <span className="text-xl font-bold text-dark-900">${platformRevenue.toLocaleString()} USDT</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-semibold text-dark-900 mb-3">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-dark-400">No recent activity detected.</p>
              ) : (
                recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-dark-600">{item.text}</span>
                    <span className="text-dark-400 text-xs">{formatTimeAgo(item.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-semibold text-dark-900 mb-3">Platform Health</h3>
            <div className="space-y-3">
              {[
                { label: "Active Guides", value: activeGuides, status: "good" },
                { label: "Pending Approvals", value: pendingApprovals, status: pendingApprovals > 0 ? "warning" : "good" },
                { label: "Open Disputes", value: openDisputes, status: openDisputes > 0 ? "danger" : "good" },
                { label: "Flagged Chats", value: flaggedChats, status: flaggedChats > 0 ? "warning" : "good" },
                { label: "Platform Wallet Balance", value: `${platformRevenue.toLocaleString()} USDT`, status: "good" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-dark-600">{item.label}</span>
                  <span className={`font-medium ${
                    item.status === "good" ? "text-secondary" :
                    item.status === "warning" ? "text-accent" : "text-danger"
                  }`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
