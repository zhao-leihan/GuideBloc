import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Admin-only endpoint to manage platform settings
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const settings = await prisma.platformSettings.findFirst();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    let settings = await prisma.platformSettings.findFirst();

    if (settings) {
      settings = await prisma.platformSettings.update({
        where: { id: settings.id },
        data: {
          commissionRate: body.commissionRate ?? settings.commissionRate,
          supportedChains: body.supportedChains ?? settings.supportedChains,
        },
      });
    } else {
      settings = await prisma.platformSettings.create({
        data: {
          commissionRate: body.commissionRate || 0.10,
          supportedChains: body.supportedChains || ["polygon", "base"],
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
