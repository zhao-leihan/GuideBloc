import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and password are required" },
        { status: 400 }
      );
    }

    // 1. Verify reset token exists
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { message: "Invalid reset token" },
        { status: 400 }
      );
    }

    // 2. Check token expiration
    const now = new Date();
    if (now > resetRecord.expires) {
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { message: "Reset token has expired" },
        { status: 400 }
      );
    }

    // 3. Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Update the user's password
    await prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashedPassword },
    });

    // 5. Delete the consumed token
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return NextResponse.json({
      message: "Password has been successfully updated.",
    });
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
