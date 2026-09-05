import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ethers } from "ethers";
import { getNetworkConfig } from "@/lib/crypto/networkConfig";
import { executeGaslessDeposit } from "@/lib/crypto/gaslessRelayer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Verifying Gate: Authenticated User Check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized. Please login to continue." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { bookingId, touristAddress, permit } = body;

    if (!bookingId || !touristAddress) {
      return NextResponse.json(
        { message: "bookingId and touristAddress are required." },
        { status: 400 }
      );
    }

    if (!ethers.isAddress(touristAddress)) {
      return NextResponse.json({ message: "Invalid tourist wallet address format." }, { status: 400 });
    }

    // 2. Verifying Gate: Database Integrity & Anti-Fraud Checks
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        gig: {
          include: { guide: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    // Strict Ownership Check: Only the authorized tourist can pay for this booking
    if (booking.touristId !== userId) {
      return NextResponse.json(
        { message: "Security Violation: You are not authorized to pay for this booking." },
        { status: 403 }
      );
    }

    // Status Check: Prevent double-spending or replay on already paid bookings
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { message: `Booking cannot be paid. Current status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Destination Check: Verify Guide Payout Wallet
    const guideWallet = booking.guideWalletSnapshot || booking.gig?.guide?.walletAddress;
    if (!guideWallet || guideWallet === "unknown" || !ethers.isAddress(guideWallet)) {
      return NextResponse.json(
        { message: "Guide has not linked an active payout wallet. Please contact support." },
        { status: 400 }
      );
    }

    const cfg = getNetworkConfig();
    const targetToken = cfg.usdcTokenAddress;

    // 3. Verifying Gate: Execute Sponsored On-Chain Escrow Deposit
    const { txHash } = await executeGaslessDeposit({
      bookingId: booking.id,
      touristAddress,
      guideAddress: guideWallet,
      tokenAddress: targetToken,
      amountUSD: booking.totalPriceUSD,
      permit,
    });

    // 4. Update Database Atomically
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
          txHash,
          paymentNetwork: cfg.name,
          paidAmountUSD: booking.totalPriceUSD,
        },
      }),
      prisma.paymentAuditLog.create({
        data: {
          source: "GASLESS_SPONSORED_PAYMASTER",
          status: "SUCCESS",
          txHash,
          rawPayload: {
            bookingId: booking.id,
            touristId: userId,
            touristAddress,
            guideWallet,
            amountUSD: booking.totalPriceUSD,
            network: cfg.networkKey,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Payment successfully deposited to escrow with Sponsored Gas!",
      txHash,
      explorerUrl: `${cfg.explorerUrl}/tx/${txHash}`,
    });
  } catch (error: any) {
    console.error("[Gasless Payment API Error]:", error);
    return NextResponse.json(
      { message: error.message || "Failed to process sponsored payment transaction." },
      { status: 500 }
    );
  }
}
