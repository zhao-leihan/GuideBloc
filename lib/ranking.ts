import { prisma } from "@/lib/prisma";

/**
 * Calculates and updates the ranking score for a specific gig in the database.
 * business formula:
 * ranking_score = (
 *   rating * 0.35 +
 *   review_count_factor * 0.15 +
 *   booking_count_factor * 0.15 +
 *   subscription_factor * 0.20 +
 *   featured_factor * 0.10 +
 *   activity_factor * 0.05
 * )
 */
export async function recalculateGigRankingScore(gigId: string): Promise<number> {
  try {
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: {
        reviews: true,
        bookings: true,
        guide: true,
      },
    });

    if (!gig) return 0;

    // 1. Rating (0 to 5)
    const reviewCount = gig.reviews.length;
    const avgRating =
      reviewCount > 0
        ? gig.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    // 2. Review Count Factor (0 to 5 scale, where 50+ reviews = 5.0)
    const review_count_factor = Math.min(reviewCount, 50) / 10;

    // 3. Booking Count Factor (0 to 5 scale, where 50+ bookings = 5.0)
    const bookingCount = gig.bookings.filter((b) => b.status === "COMPLETED" || b.status === "CONFIRMED").length;
    const booking_count_factor = Math.min(bookingCount, 50) / 10;

    // 4. Subscription Factor (FREE = 1.0, PRO = 1.5, ELITE = 2.0)
    let subscription_factor = 1.0;
    const subType = gig.guide.subscription_type || "FREE";
    const subExpiry = gig.guide.subscription_expiry;
    const isSubActive = subExpiry ? new Date(subExpiry) > new Date() : false;
    
    if (isSubActive) {
      if (subType === "ELITE") subscription_factor = 2.0;
      else if (subType === "PRO") subscription_factor = 1.5;
    }

    // 5. Featured Factor (Not Featured = 1.0, Featured = 1.3)
    const isFeatured = gig.featured_until ? new Date(gig.featured_until) > new Date() : false;
    const featured_factor = isFeatured ? 1.3 : 1.0;

    // 6. Activity Factor (1.0 to 5.0)
    // Based on recent bookings (within 7 days = 5.0, 30 days = 3.0, else 1.0)
    // and recent updates (within 7 days = 5.0, 30 days = 3.0, else 1.0)
    const now = new Date();
    let bookingActivity = 1.0;
    if (gig.bookings.length > 0) {
      const sortedBookings = [...gig.bookings].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const lastBookingDate = new Date(sortedBookings[0].createdAt);
      const daysSinceBooking = (now.getTime() - lastBookingDate.getTime()) / (1000 * 3600 * 24);
      if (daysSinceBooking <= 7) bookingActivity = 5.0;
      else if (daysSinceBooking <= 30) bookingActivity = 3.0;
    }

    let updateActivity = 1.0;
    const daysSinceUpdate = (now.getTime() - new Date(gig.createdAt).getTime()) / (1000 * 3600 * 24);
    if (daysSinceUpdate <= 7) updateActivity = 5.0;
    else if (daysSinceUpdate <= 30) updateActivity = 3.0;

    const activity_factor = (bookingActivity + updateActivity) / 2;

    // Calculate final weighted score
    const ranking_score =
      avgRating * 0.35 +
      review_count_factor * 0.15 +
      booking_count_factor * 0.15 +
      subscription_factor * 0.20 +
      featured_factor * 0.10 +
      activity_factor * 0.05;

    // Save pre-calculated fields directly to database
    await prisma.gig.update({
      where: { id: gigId },
      data: {
        ranking_score,
        booking_count: bookingCount,
        avgRating,
        reviewCount,
      },
    });

    return ranking_score;
  } catch (error) {
    console.error(`Error recalculating ranking score for gig ${gigId}:`, error);
    return 0;
  }
}

/**
 * Convenience helper to recalculate all gigs for a specific guide (e.g. after subscription upgrade)
 */
export async function recalculateGuideGigsRanking(guideId: string): Promise<void> {
  try {
    const gigs = await prisma.gig.findMany({
      where: { guideId },
      select: { id: true },
    });
    for (const gig of gigs) {
      await recalculateGigRankingScore(gig.id);
    }
  } catch (error) {
    console.error(`Error recalculating gigs ranking for guide ${guideId}:`, error);
  }
}
