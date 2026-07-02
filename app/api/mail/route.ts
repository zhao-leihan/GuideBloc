import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 1. GET Inbox Mails
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || !user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const mails = await prisma.mail.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(mails);
  } catch (error: any) {
    console.error("GET mails error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}

// 2. PATCH Mark Mail as Read
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { mailId } = await req.json();
    if (!mailId) {
      return NextResponse.json({ message: "Missing mailId" }, { status: 400 });
    }

    const updatedMail = await prisma.mail.update({
      where: { id: mailId },
      data: { isRead: true },
    });

    return NextResponse.json(updatedMail);
  } catch (error: any) {
    console.error("PATCH mail error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}
