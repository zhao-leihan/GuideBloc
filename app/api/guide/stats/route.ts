import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "GUIDE") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const guideId = (session.user as any).id;

    // 1. Get all gigs of this guide
    const gigs = await prisma.gig.findMany({
      where: { guideId },
      select: { id: true, title: true }
    });
    const gigIds = gigs.map(g => g.id);

    // 2. Fetch bookings for these gigs
    const bookings = await prisma.booking.findMany({
      where: { gigId: { in: gigIds } },
      include: {
        tourist: { select: { name: true } },
        gig: { select: { title: true } }
      },
      orderBy: { bookingDate: "desc" }
    });

    // 3. Calculate statistics
    // Total Earnings: COMPLETED bookings
    const completedBookings = bookings.filter(b => b.status === "COMPLETED");
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.guide_price || (b.totalPriceUSD * 0.90)), 0);

    // Pending Release: CONFIRMED or PENDING bookings
    const pendingBookings = bookings.filter(b => b.status === "CONFIRMED" || b.status === "PENDING");
    const pendingRelease = pendingBookings.reduce((sum, b) => sum + (b.guide_price || (b.totalPriceUSD * 0.90)), 0);

    // Active Bookings count
    const activeBookingsCount = pendingBookings.length;

    // Average Rating: from reviews on this guide's gigs
    const reviews = await prisma.review.findMany({
      where: { gigId: { in: gigIds } },
      select: { rating: true }
    });
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";
    const reviewCount = reviews.length;

    // Upcoming Tours (future date and status CONFIRMED/PENDING)
    const now = new Date();
    const upcomingTours = bookings
      .filter(b => new Date(b.bookingDate) >= now && (b.status === "CONFIRMED" || b.status === "PENDING"))
      .slice(0, 5)
      .map(b => ({
        id: b.id,
        title: b.gig.title,
        date: new Date(b.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        guests: b.groupSize,
        status: b.status,
      }));

    // Recent Transactions
    const recentTransactions = bookings
      .slice(0, 5)
      .map(b => ({
        id: b.id,
        title: b.gig.title,
        amount: `$${b.totalPriceUSD.toFixed(2)} USDT`,
        status: b.status === "COMPLETED" ? "Released" : b.status === "CANCELLED" ? "Cancelled" : "Pending",
        createdAt: b.createdAt
      }));

    return NextResponse.json({
      totalEarnings,
      pendingRelease,
      activeBookingsCount,
      avgRating,
      reviewCount,
      upcomingTours,
      recentTransactions,
    });
  } catch (error) {
    console.error("Guide stats error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
