import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        country: true,
        createdAt: true,
        guideStatus: true,
        certificationText: true,
        certificationFile: true,
        isBlocked: true,
        bookings: {
          select: { id: true }
        }
      }
    });

    // Map bookings count dynamically
    const mappedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      country: user.country || "Unknown",
      joined: new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      bookingsCount: user.bookings.length,
      guideStatus: user.guideStatus,
      certificationText: user.certificationText,
      certificationFile: user.certificationFile,
      isBlocked: user.isBlocked,
    }));

    return NextResponse.json(mappedUsers);
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, action, message } = body;

    if (!userId || !action) {
      return NextResponse.json({ message: "Missing userId or action" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      await prisma.user.update({
        where: { id: userId },
        data: {
          role: "GUIDE",
          guideStatus: "APPROVED"
        }
      });
      return NextResponse.json({ message: "User approved as a Guide successfully" });
    } else if (action === "REJECT") {
      await prisma.user.update({
        where: { id: userId },
        data: {
          role: "TOURIST",
          guideStatus: "REJECTED"
        }
      });
      return NextResponse.json({ message: "Guide application rejected" });
    } else if (action === "BLOCK") {
      await prisma.user.update({
        where: { id: userId },
        data: { isBlocked: true }
      });
      return NextResponse.json({ message: "User blocked successfully" });
    } else if (action === "UNBLOCK") {
      await prisma.user.update({
        where: { id: userId },
        data: { isBlocked: false }
      });
      return NextResponse.json({ message: "User unblocked successfully" });
    } else if (action === "WARN") {
      if (!message || message.trim() === "") {
        return NextResponse.json({ message: "Warning message is required" }, { status: 400 });
      }

      // Create warning logs in DB
      await prisma.warning.create({
        data: {
          userId: userId,
          adminId: (session.user as any).id,
          reason: message,
          details: "System administrative warning notice.",
        }
      });

      // Send warn system inbox mail
      await prisma.mail.create({
        data: {
          recipientId: userId,
          subject: "⚠️ Warning: Account Conduct Infraction Notice",
          body: `This is an official warning letter regarding your account conduct:\n\n"${message}"\n\nPlease align your profile details and conduct with platform rules. Repeated violations will result in permanent suspension of your account.`,
        }
      });

      return NextResponse.json({ message: "Warning sent successfully" });
    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin users update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
