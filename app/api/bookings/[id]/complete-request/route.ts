import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

const TOKEN_EXPIRY_MINUTES = 60; // QR token valid for 1 hour

function generateCompletionToken(bookingId: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "guidebloc-secret";
  const nonce = crypto.randomUUID();
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(bookingId + ":" + nonce);
  const digest = hmac.digest("hex");
  // Format: nonce:digest (nonce for uniqueness, digest for verification)
  return Buffer.from(nonce + ":" + digest).toString("base64url");
}

/**
 * POST /api/bookings/[id]/complete-request
 * Guide generates a one-time QR token to signal tour completion.
 * Tourist scans QR -> GET /api/bookings/[id]/complete?token=... -> escrow released.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        gig: { select: { guideId: true, title: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // Only the guide who owns the gig can request completion
    if (booking.gig.guideId !== user.id) {
      return NextResponse.json({ message: "Forbidden: only the guide can request completion" }, { status: 403 });
    }

    const allowedStatuses = ["CONFIRMED", "PAID"];
    if (!allowedStatuses.includes(booking.status)) {
      return NextResponse.json(
        { message: "Booking must be CONFIRMED or PAID to request completion. Current status: " + booking.status },
        { status: 400 }
      );
    }

    // Generate one-time token
    const token = generateCompletionToken(params.id);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
    const now = new Date();

    await prisma.booking.update({
      where: { id: params.id },
      data: {
        completionToken: token,
        completionTokenExpiresAt: expiresAt,
        completionRequestedAt: booking.completionRequestedAt ?? now, // Only set once
      },
    });

    const appUrl = process.env.NEXTAUTH_URL || "https://guidebloc.com";
    const qrUrl = appUrl + "/api/bookings/" + params.id + "/complete?token=" + token;

    return NextResponse.json({
      success: true,
      token,
      qrUrl,
      expiresAt: expiresAt.toISOString(),
      message: "QR code generated. Tourist can scan within " + TOKEN_EXPIRY_MINUTES + " minutes.",
    });
  } catch (error: any) {
    console.error("[Complete Request Error]", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
