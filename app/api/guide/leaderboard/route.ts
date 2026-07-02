import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const topGuides = await prisma.user.findMany({
      where: { role: "GUIDE" },
      orderBy: [
        { level: "desc" },
        { xp: "desc" },
      ],
      select: {
        id: true,
        name: true,
        avatar: true,
        level: true,
        xp: true,
        bio: true,
        country: true,
      },
      take: 10, // top 10 guides
    });

    return NextResponse.json(topGuides);
  } catch (error: any) {
    console.error("GET guide leaderboard error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
