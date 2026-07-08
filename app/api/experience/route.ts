import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const experiences = await prisma.booking.findMany({
      where: {
        status: "COMPLETED",
        proofPhoto: { not: null },
      },
      select: {
        id: true,
        proofPhoto: true,
        bookingTime: true,
        gig: {
          select: {
            title: true,
            location: true,
          },
        },
        tourist: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

    return NextResponse.json({ experiences });
  } catch (error: any) {
    console.error("Failed to fetch experiences:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
