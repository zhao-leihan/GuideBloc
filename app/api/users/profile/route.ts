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
        idCardNumber: true,
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

    // Calculate balance based on completed bookings
    let balance = 0;
    if (dbUser.role === "GUIDE") {
      const gigs = await prisma.gig.findMany({
        where: { guideId: userId },
        select: { id: true }
      });
      const gigIds = gigs.map(g => g.id);
      const completedBookings = await prisma.booking.findMany({
        where: { gigId: { in: gigIds }, status: "COMPLETED" },
        select: { totalPriceUSD: true }
      });
      balance = completedBookings.reduce((sum, b) => sum + b.totalPriceUSD, 0);
    }

    return NextResponse.json({ ...dbUser, balance });
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
        passportNumber: body.passportNumber !== undefined ? body.passportNumber : undefined,
        idCardNumber: body.idCardNumber !== undefined ? body.idCardNumber : undefined,
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
