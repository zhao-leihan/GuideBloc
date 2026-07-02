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

    const userId = (session.user as any).id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { touristId: userId },
          { guideId: userId },
        ],
      },
      include: {
        tourist: { select: { id: true, name: true, avatar: true } },
        guide: { select: { id: true, name: true, avatar: true } },
        gig: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    const result = conversations.map((c: any) => {
      const isTourist = c.touristId === userId;
      const otherParticipant = isTourist ? c.guide : c.tourist;

      return {
        id: c.id,
        otherParticipant: {
          ...otherParticipant,
          role: isTourist ? "GUIDE" : "TOURIST",
        },
        gig: c.gig,
        lastMessage: c.messages[0] || null,
        unreadCount: 0,
        updatedAt: c.lastMessageAt || c.createdAt,
      };
    });

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error("Conversations GET error:", error);
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
    const { touristId, guideId, gigId, bookingId } = body;

    if (!touristId || !guideId) {
      return NextResponse.json(
        { message: "touristId and guideId are required" },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: { touristId, guideId },
    });

    if (existing) {
      return NextResponse.json({ conversation: existing });
    }

    const conversation = await prisma.conversation.create({
      data: {
        touristId,
        guideId,
        gigId: gigId || null,
        bookingId: bookingId || null,
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Conversations POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
