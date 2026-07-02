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

    const breakdown = revenueGroup.map((item) => ({
      source: item.source.replace("_", " ").toLowerCase(),
      amount: item._sum.amountUSDT || 0,
    }));

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

    return NextResponse.json({
      kpis: {
        totalUsers,
        activeGigs,
        totalBookings,
        platformRevenue,
      },
      breakdown,
      health: {
        activeGuides,
        pendingApprovals,
        openDisputes,
        flaggedChats,
        platformWallet: platformRevenue,
      },
      recentActivity: recentActivity.slice(0, 5),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
