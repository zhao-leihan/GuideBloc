import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateGigRankingScore } from "@/lib/ranking";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const where: any = {};
    if (role === "guide") {
      where.gig = { guideId: user.id };
    } else {
      where.touristId = user.id;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        reviews: {
          select: { id: true, reviewerId: true }
        },
        gig: {
          include: { guide: { select: { id: true, name: true, avatar: true, country: true } } },
        },
        tourist: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            passportNumber: true,
            idCardNumber: true,
            birthDate: true,
            title: true,
            age: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Bookings GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const data = await req.json();

    const gig = await prisma.gig.findUnique({ where: { id: data.gigId } });
    if (!gig) {
      return NextResponse.json({ message: "Gig not found" }, { status: 404 });
    }

    const client_price = gig.client_price || gig.priceUSD;
    const guide_price = gig.guide_price || (client_price * 0.90);
    const platform_fee = gig.platform_fee || (client_price - guide_price);

    const totalPriceUSD = client_price * data.groupSize;

    const booking = await prisma.booking.create({
      data: {
        gigId: data.gigId,
        touristId: user.id,
        bookingDate: new Date(data.bookingDate),
        bookingTime: data.bookingTime || null,
        participants: data.participants || null,
        groupSize: data.groupSize,
        totalPriceUSD,
        totalPriceCrypto: totalPriceUSD,
        cryptoToken: data.cryptoToken || "USDT",
        guide_price,
        client_price,
        platform_fee,
        specialRequests: data.specialRequests,
        status: "PENDING",
      },
    });

    // Auto-save new companions
    if (data.participants && Array.isArray(data.participants)) {
      for (const p of data.participants) {
        if (p.isMainUser) continue;
        if (!p.name) continue;

        // Check if already in saved members
        const existing = await prisma.groupMember.findFirst({
          where: {
            userId: user.id,
            name: p.name,
          },
        });

        if (!existing) {
          await prisma.groupMember.create({
            data: {
              userId: user.id,
              name: p.name,
              passportNumber: p.passportNumber || null,
              idCardNumber: p.idCardNumber || null,
              birthDate: p.birthDate ? new Date(p.birthDate) : null,
              title: p.title || null,
              age: p.age ? parseInt(p.age) : null,
            },
          });
        }
      }
    }

    // Update ranking score for the gig (since booking count has changed)
    await recalculateGigRankingScore(data.gigId);

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Bookings POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
