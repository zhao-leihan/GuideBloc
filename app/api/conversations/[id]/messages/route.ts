import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const conversationId = params.id;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { touristId: userId },
          { guideId: userId },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    const total = await prisma.message.count({
      where: { conversationId },
    });

    return NextResponse.json({
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const conversationId = params.id;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { touristId: userId },
          { guideId: userId },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { content, type = "TEXT", mediaUrl } = body;

    if (!content && !mediaUrl) {
      return NextResponse.json(
        { message: "content or mediaUrl is required" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content || "",
        type,
        mediaUrl: mediaUrl || null,
      },
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
