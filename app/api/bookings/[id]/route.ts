import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateGigRankingScore } from "@/lib/ranking";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { status, txHash, paymentNetwork, proofPhoto } = await req.json();
    if (!status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { gig: true },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // Strict transaction validation before confirming
    if (status === "CONFIRMED") {
      if (!txHash || txHash === "N/A") {
        return NextResponse.json({ message: "Transaction reference is required" }, { status: 400 });
      }

      // Case A: MoonPay Checkout verification
      if (!txHash.startsWith("0x")) {
        const secretKey = process.env.MOONPAY_SECRET_KEY;
        if (!secretKey) {
          return NextResponse.json({ 
            message: "MOONPAY_SECRET_KEY is not configured in your server .env file." 
          }, { status: 400 });
        }

        try {
          // Fetch transaction detail from MoonPay API
          const orderRes = await fetch(`https://api.moonpay.com/v1/transactions/${txHash}`, {
            headers: {
              "X-Api-Key": secretKey
            }
          });

          if (!orderRes.ok) {
            return NextResponse.json({ message: "MoonPay transaction verification failed: Transaction not found on MoonPay" }, { status: 400 });
          }

          const tx = await orderRes.json();
          if (!tx) {
            return NextResponse.json({ message: "MoonPay transaction details not found in response" }, { status: 400 });
          }

          const validStatuses = ["completed", "pending"];
          if (!validStatuses.includes(tx.status?.toLowerCase())) {
            return NextResponse.json({ message: `MoonPay payment is not completed. Status: ${tx.status}` }, { status: 400 });
          }

          // Verify token (USDC)
          const assetCode = tx.destination?.asset?.code?.toLowerCase() || "";
          if (assetCode !== "usdc") {
            return NextResponse.json({ message: "MoonPay payment must be USDC" }, { status: 400 });
          }

          // Verify amount matches
          const paidAmount = Number(tx.source?.amount || 0);
          if (Math.abs(paidAmount - booking.totalPriceUSD) > 1.5) {
            return NextResponse.json({ message: `MoonPay payment amount mismatch. Expected: ${booking.totalPriceUSD} USD` }, { status: 400 });
          }
        } catch (verifyErr: any) {
          console.error("MoonPay verification server error:", verifyErr);
          return NextResponse.json({ message: `MoonPay validation failed: ${verifyErr.message}` }, { status: 400 });
        }
      }

      // Case B: Real EVM Checkout receipt verification
      if (txHash.startsWith("0x") && !txHash.startsWith("0xMOCK")) {
        try {
          const { ethers } = await import("ethers");
          const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
          const receipt = await provider.getTransactionReceipt(txHash);
          if (!receipt || receipt.status !== 1) {
            return NextResponse.json({ message: "EVM transaction failed or was not found on-chain" }, { status: 400 });
          }
        } catch (chainErr: any) {
          console.warn("Could not verify EVM receipt on local node:", chainErr);
          return NextResponse.json({ message: `EVM transaction verification failed: ${chainErr.message}` }, { status: 400 });
        }
      }
    }

    // Update status and optional payment fields
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status,
        ...(txHash && { txHash }),
        ...(paymentNetwork && { paymentNetwork }),
        ...(proofPhoto && { proofPhoto }),
      },
    });

    // On-chain escrow release trigger when tourist completes tour
    if (status === "COMPLETED") {
      if (booking.txHash && !booking.txHash.startsWith("0xMOCK") && booking.txHash !== "N/A") {
        try {
          const { backendReleaseToGuide } = await import("@/lib/crypto/backend");
          const chainNetwork = (booking.paymentNetwork as any) || "base";
          const releaseHash = await backendReleaseToGuide(booking.id, chainNetwork);
          console.log(`[Escrow Release] On-chain release successful! Tx Hash: ${releaseHash}`);
          
          // Update database with the release transaction hash
          await prisma.booking.update({
            where: { id: booking.id },
            data: { txHash: releaseHash },
          });
        } catch (chainErr: any) {
          console.error("[Escrow Release] Failed on-chain release:", chainErr);
          return NextResponse.json(
            { message: `Failed to release funds on-chain: ${chainErr.message}` },
            { status: 500 }
          );
        }
      }
    }

    // On-chain escrow refund trigger when booking is cancelled
    if (status === "CANCELLED") {
      if (booking.txHash && !booking.txHash.startsWith("0xMOCK") && booking.txHash !== "N/A") {
        try {
          const { backendRefundTourist } = await import("@/lib/crypto/backend");
          const chainNetwork = (booking.paymentNetwork as any) || "base";
          const refundHash = await backendRefundTourist(booking.id, chainNetwork);
          console.log(`[Escrow Refund] On-chain refund successful! Tx Hash: ${refundHash}`);
          
          // Update database with the refund transaction hash
          await prisma.booking.update({
            where: { id: booking.id },
            data: { txHash: refundHash },
          });
        } catch (chainErr: any) {
          console.error("[Escrow Refund] Failed on-chain refund:", chainErr);
          return NextResponse.json(
            { message: `Failed to refund escrow on-chain: ${chainErr.message}` },
            { status: 500 }
          );
        }
      }

      // Add system notifications for both tourist and guide
      try {
        await prisma.mail.create({
          data: {
            recipientId: booking.touristId,
            subject: "❌ Booking Cancelled & Escrow Refunded",
            body: `Your booking for "${booking.gig.title}" has been cancelled. The locked contract balance of ${booking.totalPriceUSD} USDC has been refunded to your wallet address.`,
          },
        });
        
        await prisma.mail.create({
          data: {
            recipientId: booking.gig.guideId,
            subject: "❌ Booking Cancelled",
            body: `The booking for your tour "${booking.gig.title}" has been cancelled. The escrow balance has been returned to the tourist.`,
          },
        });
      } catch (mailErr) {
        console.error("Failed to write cancellation notification emails:", mailErr);
      }
    }

    // Send PDF receipt email on transaction funding confirmation
    if (status === "CONFIRMED") {
      // 1. Confirm the booking on-chain
      if (txHash && !txHash.startsWith("0xMOCK") && txHash !== "N/A") {
        try {
          const { backendConfirmBooking } = await import("@/lib/crypto/backend");
          const chainNetwork = paymentNetwork || "base";
          const confirmHash = await backendConfirmBooking(params.id, chainNetwork as any);
          console.log(`[Escrow Confirm] On-chain confirm successful! Tx Hash: ${confirmHash}`);
        } catch (chainErr: any) {
          console.error("[Escrow Confirm] Failed on-chain confirm:", chainErr);
        }
      }

      // 2. Send PDF receipt email
      try {
        const fullBooking = await prisma.booking.findUnique({
          where: { id: params.id },
          include: {
            gig: { select: { title: true, location: true } },
            tourist: { select: { name: true, email: true } },
          },
        });

        if (fullBooking) {
          const { generateReceiptPdf } = await import("@/lib/receipt");
          const { triggerBookingSuccessEmail } = await import("@/lib/email");
          const pdfBuffer = generateReceiptPdf(fullBooking as any);
          await triggerBookingSuccessEmail(
            fullBooking.id,
            fullBooking.tourist.email,
            fullBooking.gig.title,
            fullBooking.totalPriceUSD,
            pdfBuffer
          );
        }
      } catch (err) {
        console.error("Failed to generate/email PDF receipt:", err);
      }
    }

    // Gamification reward logic when tour is completed
    if (status === "COMPLETED") {
      // Create Platform Revenue record for commission (10% fee)
      const commissionAmount = booking.totalPriceUSD * 0.10;
      await prisma.platformRevenue.create({
        data: {
          source: "BOOKING_COMMISSION",
          amountUSDT: commissionAmount,
          txHash: booking.txHash || "N/A",
          referenceId: booking.id,
        }
      });

      const xpEarned = Math.max(100, Math.round(booking.totalPriceUSD * 10));
      const guide = await prisma.user.findUnique({
        where: { id: booking.gig.guideId },
      });

      if (guide) {
        const newXp = (guide.xp || 0) + xpEarned;
        const newLevel = Math.floor(newXp / 1000) + 1;
        const oldLevel = guide.level || 1;

        await prisma.user.update({
          where: { id: guide.id },
          data: {
            xp: newXp,
            level: newLevel,
          },
        });

        // 1. Send reward/credits mail
        await prisma.mail.create({
          data: {
            recipientId: guide.id,
            subject: `💰 Escrow Released: Earned +${xpEarned} XP`,
            body: `Excellent job! The tourist completed the tour "${booking.gig.title}". You have earned +${xpEarned} XP. The locked USDC contract balance is now claimable/released to your address.`,
          },
        });

        // 2. Trigger level up notification
        if (newLevel > oldLevel) {
          await prisma.mail.create({
            data: {
              recipientId: guide.id,
              subject: `🎉 Level Up: Reached Level ${newLevel}!`,
              body: `Congratulations on leveling up to Level ${newLevel}! Your guide status has gained priority rank boost, making your tour listings more prominent in searches. Keep exploring!`,
            },
          });
        }
      }
    }

    // Update ranking score for the gig since booking status changed
    await recalculateGigRankingScore(booking.gigId);

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Booking PATCH status error:", error);
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

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json({ message: "Only unpaid pending bookings can be deleted" }, { status: 400 });
    }

    await prisma.booking.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Booking DELETE error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
