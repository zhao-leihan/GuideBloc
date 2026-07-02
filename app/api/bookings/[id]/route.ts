import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateGigRankingScore } from "@/lib/ranking";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { status, txHash, paymentNetwork } = await req.json();
    if (!status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { gig: true },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // Update status and optional payment fields
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status,
        ...(txHash && { txHash }),
        ...(paymentNetwork && { paymentNetwork }),
      },
    });

    // Gamification reward logic when tour is completed
    if (status === "COMPLETED") {
      const xpEarned = Math.max(100, Math.round(booking.totalPriceUSD * 10));
      const guide = await prisma.user.findUnique({
        where: { id: booking.gig.guideId },
      });

      if (guide) {
        const newXp = (guide.xp || 0) + xpEarned;
        const newLevel = Math.floor(newXp / 1000) + 1;
        const oldLevel = guide.level || 1;

        await prisma.user.update({
          where: { id: guide.id },
          data: {
            xp: newXp,
            level: newLevel,
          },
        });

        // 1. Send reward/credits mail
        await prisma.mail.create({
          data: {
            recipientId: guide.id,
            subject: `💰 Escrow Released: Earned +${xpEarned} XP`,
            body: `Excellent job! The tourist completed the tour "${booking.gig.title}". You have earned +${xpEarned} XP. The locked USDC contract balance is now claimable/released to your address.`,
          },
        });

        // 2. Trigger level up notification
        if (newLevel > oldLevel) {
          await prisma.mail.create({
            data: {
              recipientId: guide.id,
              subject: `🎉 Level Up: Reached Level ${newLevel}!`,
              body: `Congratulations on leveling up to Level ${newLevel}! Your guide status has gained priority rank boost, making your tour listings more prominent in searches. Keep exploring!`,
            },
          });
        }
      }
    }

    // Update ranking score for the gig since booking status changed
    await recalculateGigRankingScore(booking.gigId);

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Booking PATCH status error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
