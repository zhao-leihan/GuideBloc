import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    const newMember = await prisma.groupMember.create({
      data: {
        userId: user.id,
        name: body.name,
        passportNumber: body.passportNumber || null,
        idCardNumber: body.idCardNumber || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        title: body.title || null,
        age: body.age ? parseInt(body.age) : null,
      },
    });

    return NextResponse.json(newMember);
  } catch (error) {
    console.error("Saved members POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    // Verify it belongs to the user
    const member = await prisma.groupMember.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    const user = session.user as any;
    if (member.userId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.groupMember.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Saved members DELETE error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
