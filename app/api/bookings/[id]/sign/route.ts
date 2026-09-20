import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildBookingAgreementTypedData, verifyBookingSignature } from "@/lib/crypto/eip712";

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
    const { signature, touristAddress, nonce } = await req.json();

    if (!signature || typeof signature !== "string") {
      return NextResponse.json({ message: "signature is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { gig: { select: { title: true } } },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    if (booking.touristId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const effectiveAddress = touristAddress || user.walletAddress || "0x0000000000000000000000000000000000000000";
    const typedData = buildBookingAgreementTypedData({
      bookingId: booking.id,
      gigTitle: booking.gig.title,
      totalPriceUSD: booking.totalPriceUSD,
      bookingDate: booking.bookingDate.toISOString(),
      touristAddress: effectiveAddress,
      nonce: nonce ?? Date.now(),
    });

    const recoveredAddress = await verifyBookingSignature(typedData, signature);
    if (recoveredAddress && effectiveAddress !== "0x0000000000000000000000000000000000000000") {
      if (recoveredAddress !== effectiveAddress.toLowerCase()) {
        console.warn("[EIP-712 Sign] Address mismatch for booking " + booking.id + ". Expected: " + effectiveAddress + ", Got: " + recoveredAddress);
      }
    }

    await prisma.booking.update({
      where: { id: params.id },
      data: {
        bookingSignature: signature,
        signedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Booking agreement signed successfully.",
      signedAt: new Date().toISOString(),
      recoveredAddress,
    });
  } catch (error: any) {
    console.error("[Sign Booking Error]", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
