import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { txHash } = await req.json();
    if (!txHash) {
      return NextResponse.json({ message: "Transaction hash is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        gig: {
          include: {
            guide: {
              select: { id: true, name: true, walletAddress: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const isGuideOwner = booking.gig.guide.id === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isGuideOwner && !isAdmin) {
      return NextResponse.json(
        { message: "You are not authorized to claim this booking" },
        { status: 403 }
      );
    }

    const guideAmount = booking.guide_price ?? (booking.totalPriceUSD - (booking.platform_fee ?? (booking.totalPriceUSD * 0.1)));
    const commissionAmount = booking.platform_fee ?? (booking.totalPriceUSD - guideAmount);
    const guideWallet =
      booking.guideWalletSnapshot ||
      booking.gig.guide.walletAddress ||
      "unknown";

    // Atomically record EscrowPayout and PlatformRevenue
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: {
          txHash,
          status: "COMPLETED",
        },
      }),
      prisma.escrowPayout.create({
        data: {
          bookingId: booking.id,
          guideId: booking.gig.guide.id,
          guideWallet,
          guideAmountUSD: guideAmount,
          commissionAmountUSD: commissionAmount,
          releaseHash: txHash,
          status: "COMPLETED",
        },
      }),
      prisma.platformRevenue.create({
        data: {
          source: "BOOKING_COMMISSION",
          amountUSDT: commissionAmount,
          txHash,
          referenceId: booking.id,
        },
      }),
      prisma.paymentAuditLog.create({
        data: {
          bookingId: booking.id,
          txHash,
          source: "GUIDE_SELF_CLAIM",
          status: "SUCCESS",
          rawPayload: {
            guideId: booking.gig.guide.id,
            guideWallet,
            guideAmountUSD: guideAmount,
            commissionAmountUSD: commissionAmount,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Earnings successfully claimed and recorded on-chain!",
      txHash,
    });
  } catch (error: any) {
    console.error("[Claim API Error]:", error);
    return NextResponse.json(
      { message: error.message || "Failed to process claim in database" },
      { status: 500 }
    );
  }
}
