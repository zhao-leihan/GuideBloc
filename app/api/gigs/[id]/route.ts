import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const gig = await prisma.gig.findUnique({
      where: { id: params.id },
      include: {
        guide: {
          select: {
            id: true,
            name: true,
            avatar: true,
            country: true,
            bio: true,
            language: true,
            walletAddress: true,
          },
        },
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true, avatar: true } },
            guide: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!gig) {
      return NextResponse.json({ message: "Gig not found" }, { status: 404 });
    }

    const avgRating =
      gig.reviews.length > 0
        ? gig.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / gig.reviews.length
        : 0;

    return NextResponse.json({ ...gig, avgRating, reviewCount: gig.reviews.length });
  } catch (error) {
    console.error("Gig detail error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const gig = await prisma.gig.findUnique({
      where: { id: params.id },
    });

    if (!gig) {
      return NextResponse.json({ message: "Gig not found" }, { status: 404 });
    }

    if (gig.guideId !== userId && (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Soft delete: set isActive = false
    await prisma.gig.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Gig deleted successfully" });
  } catch (error) {
    console.error("Gig delete error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
