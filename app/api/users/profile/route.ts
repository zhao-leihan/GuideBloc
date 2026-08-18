import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        bio: true,
        country: true,
        avatar: true,
        role: true,
        guideStatus: true,
        passportNumber: true,
        passportPhoto: true,
        idCardNumber: true,
        idCardPhoto: true,
        verificationStatus: true,
        verificationRejectReason: true,
        birthDate: true,
        title: true,
        age: true,
        xp: true,
        level: true,
        benefits: true,
        warnings: {
          orderBy: { createdAt: "desc" },
          select: { id: true, reason: true, createdAt: true },
        },
        savedMembers: {
          select: {
            id: true,
            name: true,
            passportNumber: true,
            idCardNumber: true,
            birthDate: true,
            title: true,
            age: true
          }
        }
      }
    });

    if (!dbUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Calculate pending payout balance for guides based on COMPLETED bookings
    let balance = 0;
    // activeWalletWarning: true if guide has CONFIRMED bookings with a different wallet snapshot
    // (meaning their escrow is locked to an old wallet)
    let activeWalletWarning = false;

    if (dbUser.role === "GUIDE") {
      const gigs = await prisma.gig.findMany({
        where: { guideId: userId },
        select: { id: true },
      });
      const gigIds = gigs.map((g) => g.id);

      const completedBookings = await prisma.booking.findMany({
        where: { gigId: { in: gigIds }, status: "COMPLETED" },
        select: { guide_price: true, totalPriceUSD: true },
      });
      // Use guide_price (net after commission) if available, else totalPriceUSD * 0.9
      balance = completedBookings.reduce(
        (sum, b) => sum + (b.guide_price ?? b.totalPriceUSD * 0.9),
        0
      );

      // Check if any CONFIRMED/PAID bookings have a wallet snapshot different from current wallet
      if (dbUser.walletAddress) {
        const mismatchedBookings = await prisma.booking.findMany({
          where: {
            gigId: { in: gigIds },
            status: { in: ["CONFIRMED", "PAID"] },
            guideWalletSnapshot: { not: null },
            NOT: { guideWalletSnapshot: dbUser.walletAddress },
          },
          select: { id: true },
          take: 1,
        });
        activeWalletWarning = mismatchedBookings.length > 0;
      }
    }

    return NextResponse.json({ ...dbUser, balance, activeWalletWarning });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        walletAddress: body.walletAddress !== undefined ? body.walletAddress : undefined,
        name: body.name !== undefined ? body.name : undefined,
        bio: body.bio !== undefined ? body.bio : undefined,
        country: body.country !== undefined ? body.country : undefined,
        avatar: body.avatar !== undefined ? body.avatar : undefined,
        passportNumber: body.passportNumber !== undefined ? body.passportNumber : undefined,
        passportPhoto: body.passportPhoto !== undefined ? body.passportPhoto : undefined,
        idCardNumber: body.idCardNumber !== undefined ? body.idCardNumber : undefined,
        idCardPhoto: body.idCardPhoto !== undefined ? body.idCardPhoto : undefined,
        verificationStatus: body.verificationStatus !== undefined ? body.verificationStatus : undefined,
        verificationRejectReason: body.verificationRejectReason !== undefined ? body.verificationRejectReason : undefined,
        birthDate: body.birthDate !== undefined ? (body.birthDate ? new Date(body.birthDate) : null) : undefined,
        title: body.title !== undefined ? body.title : undefined,
        age: body.age !== undefined ? (body.age ? parseInt(body.age) : null) : undefined,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
