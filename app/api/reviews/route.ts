import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gigId = searchParams.get("gigId");
    const bookingId = searchParams.get("bookingId");

    const where: any = {};

    if (gigId) {
      where.booking = { gigId };
    }
    if (bookingId) {
      where.bookingId = bookingId;
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
        guide: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const avgRating = reviews.length
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      total: reviews.length,
    });
  } catch (error) {
    console.error("Reviews GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, rating, comment, images, platformRating, platformComment } = body;

    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "bookingId and rating (1-5) are required" },
        { status: 400 }
      );
    }

    // Verify the booking belongs to this user and is completed
    const userId = (session.user as any).id;
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        status: "COMPLETED",
        OR: [
          { touristId: userId },
          { gig: { guideId: userId } }
        ]
      },
      include: { gig: true },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found, not completed, or you are not authorized to review it" },
        { status: 404 }
      );
    }

    // Check if review already exists
    const existing = await prisma.review.findFirst({
      where: { bookingId, reviewerId: userId },
    });

    if (existing) {
      return NextResponse.json(
        { message: "You have already reviewed this booking" },
        { status: 409 }
      );
    }

    // Determine target recipient (who is being reviewed)
    const isTouristReviewer = booking.touristId === userId;
    const targetUserId = isTouristReviewer ? booking.gig.guideId : booking.touristId;

    const review = await prisma.review.create({
      data: {
        reviewerId: userId,
        guideId: targetUserId,
        bookingId,
        gigId: booking.gigId,
        rating,
        comment: comment || "",
        images: images || [],
      },
    });

    // Save Platform Review if submitted
    if (platformRating && platformRating >= 1 && platformRating <= 5) {
      try {
        await prisma.platformReview.create({
          data: {
            reviewerId: userId,
            bookingId: bookingId,
            rating: platformRating,
            comment: platformComment || "",
          },
        });
      } catch (platErr) {
        console.error("Failed to save PlatformReview:", platErr);
      }
    }

    // Run check for guide anomalies/bad reviews
    try {
      const { detectAndFlagAnomaly } = await import("@/lib/anomaly");
      await detectAndFlagAnomaly(booking.gig.guideId);
    } catch (err) {
      console.error("Anomaly checking error:", err);
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Reviews POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
