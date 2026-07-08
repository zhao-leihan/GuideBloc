import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, country, certificationText, certificationFile } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const isApplyingGuide = role === "GUIDE";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: isApplyingGuide ? "GUIDE" : "TOURIST",
        guideStatus: isApplyingGuide ? "PENDING" : "NONE",
        certificationText: isApplyingGuide ? certificationText : null,
        certificationFile: isApplyingGuide ? certificationFile : null,
        country,
      },
    });

    // Trigger welcome email
    try {
      const { triggerWelcomeEmail } = await import("@/lib/email");
      await triggerWelcomeEmail(email.toLowerCase(), name, user.role);
    } catch (err) {
      console.error("Welcome email error:", err);
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
