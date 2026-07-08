import { prisma } from "./prisma";

/**
 * Checks for guide abnormalities and raises system flags/warnings.
 * If a guide receives multiple bad reviews (rating <= 2) consecutively,
 * we flag them, block them automatically, and create a Warning record for admins.
 */
export async function detectAndFlagAnomaly(guideId: string) {
  try {
    // Get the last 3 reviews received by this guide
    const recentReviews = await prisma.review.findMany({
      where: { guideId },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    // Check if the last 2 or 3 reviews are all bad (rating <= 2)
    if (recentReviews.length >= 2) {
      const allBad = recentReviews.every((r) => r.rating <= 2);
      if (allBad) {
        // Find the system admin ID
        const adminUser = await prisma.user.findFirst({
          where: { role: "ADMIN" },
          select: { id: true },
        });

        const adminId = adminUser?.id || "system-admin-id";

        // Create a formal warning report in the database
        await prisma.warning.create({
          data: {
            userId: guideId,
            adminId: adminId,
            reason: "CONSECUTIVE_BAD_REVIEWS",
            details: `Automated System Flag: Guide has received ${recentReviews.length} consecutive bad reviews (rating <= 2). Payouts frozen and account suspended pending admin verification.`,
          },
        });

        // Suspend/Block the guide immediately to freeze access
        await prisma.user.update({
          where: { id: guideId },
          data: { isBlocked: true },
        });

        console.log(`[Anomaly System] Automatically blocked guide ${guideId} due to consecutive bad reviews.`);
      }
    }
  } catch (err) {
    console.error("[Anomaly System] Error running fraud anomaly check:", err);
  }
}
