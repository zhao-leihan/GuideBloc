import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateGigRankingScore } from "@/lib/ranking";

// Helper: returns true if a txHash represents a real on-chain transaction
function isRealTxHash(hash: string | null | undefined): boolean {
  if (!hash) return false;
  if (hash === "N/A") return false;
  if (hash.startsWith("0xMOCK")) return false;
  if (hash.startsWith("0x") && hash.length >= 64) return true;
  return false;
}

// Helper: dynamically resolve the correct RPC URL for a given network string
function getRpcUrlForNetwork(network: string | null | undefined): string {
  const net = (network || "avalanche").toLowerCase();

  if (net === "avalanche") {
    const isMainnet =
      process.env.NEXT_PUBLIC_AVAX_NETWORK === "mainnet" ||
      process.env.NEXT_PUBLIC_AVALANCHE_NETWORK === "mainnet";
    return isMainnet
      ? "https://api.avax.network/ext/bc/C/rpc"
      : "https://api.avax-test.network/ext/bc/C/rpc";
  }

  if (net === "base") {
    const isMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
    const isSepolia = process.env.NEXT_PUBLIC_BASE_NETWORK === "sepolia";
    if (isMainnet) return "https://mainnet.base.org";
    if (isSepolia) return "https://sepolia.base.org";
    return "http://127.0.0.1:8545";
  }

  // Fallback
  return "https://api.avax.network/ext/bc/C/rpc";
}

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
      include: {
        gig: {
          include: {
            guide: { select: { id: true, walletAddress: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // ─── CONFIRMED: Verify payment before accepting ─────────────────────────
    if (status === "CONFIRMED") {
      if (!txHash || txHash === "N/A") {
        return NextResponse.json(
          { message: "Transaction reference is required" },
          { status: 400 }
        );
      }

      // Case A: MoonPay Checkout verification
      if (!txHash.startsWith("0x")) {
        const secretKey = process.env.MOONPAY_SECRET_KEY;
        if (!secretKey) {
          return NextResponse.json(
            { message: "MOONPAY_SECRET_KEY is not configured in your server .env file." },
            { status: 400 }
          );
        }

        try {
          const orderRes = await fetch(
            `https://api.moonpay.com/v1/transactions/${txHash}`,
            { headers: { "X-Api-Key": secretKey } }
          );

          if (!orderRes.ok) {
            return NextResponse.json(
              { message: "MoonPay transaction verification failed: Transaction not found on MoonPay" },
              { status: 400 }
            );
          }

          const tx = await orderRes.json();
          if (!tx) {
            return NextResponse.json(
              { message: "MoonPay transaction details not found in response" },
              { status: 400 }
            );
          }

          const validStatuses = ["completed", "pending"];
          if (!validStatuses.includes(tx.status?.toLowerCase())) {
            return NextResponse.json(
              { message: `MoonPay payment is not completed. Status: ${tx.status}` },
              { status: 400 }
            );
          }

          const assetCode = tx.destination?.asset?.code?.toLowerCase() || "";
          if (assetCode !== "usdc") {
            return NextResponse.json(
              { message: "MoonPay payment must be USDC" },
              { status: 400 }
            );
          }

          const paidAmount = Number(tx.source?.amount || 0);
          if (Math.abs(paidAmount - booking.totalPriceUSD) > 1.5) {
            return NextResponse.json(
              { message: `MoonPay payment amount mismatch. Expected: ${booking.totalPriceUSD} USD` },
              { status: 400 }
            );
          }
        } catch (verifyErr: any) {
          console.error("MoonPay verification server error:", verifyErr);
          return NextResponse.json(
            { message: `MoonPay validation failed: ${verifyErr.message}` },
            { status: 400 }
          );
        }
      }

      // Case B: Real EVM on-chain receipt verification
      // ✅ FIX: Use dynamic RPC URL based on the booking's paymentNetwork — NOT localhost
      if (txHash.startsWith("0x") && !txHash.startsWith("0xMOCK")) {
        const effectiveNetwork = paymentNetwork || booking.paymentNetwork || "avalanche";
        const rpcUrl = getRpcUrlForNetwork(effectiveNetwork);

        // Only verify on-chain for real networks (skip for localhost dev)
        if (rpcUrl !== "http://127.0.0.1:8545") {
          try {
            const { ethers } = await import("ethers");
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const receipt = await provider.getTransactionReceipt(txHash);
            if (!receipt || receipt.status !== 1) {
              return NextResponse.json(
                { message: `EVM transaction failed or not found on ${effectiveNetwork}` },
                { status: 400 }
              );
            }
          } catch (chainErr: any) {
            // Non-fatal: log and continue — don't block legitimate payments over RPC issues
            console.warn(
              `[EVM Verify] Could not verify receipt on ${effectiveNetwork}:`,
              chainErr.message
            );
          }
        }
      }
    }

    // ─── Update booking status and optional payment fields ───────────────────
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status,
        ...(txHash && { txHash }),
        ...(paymentNetwork && { paymentNetwork }),
        ...(proofPhoto && { proofPhoto }),
      },
    });

    // ─── COMPLETED: Release escrow on-chain, then record earnings ───────────
    if (status === "COMPLETED") {
      const bookingTxHash = booking.txHash;
      const chainNetwork = (booking.paymentNetwork as any) || "avalanche";

      if (isRealTxHash(bookingTxHash)) {
        // Step 1: Release on-chain FIRST — this is the source of truth
        let releaseHash: string | null = null;
        try {
          const { backendReleaseToGuide } = await import("@/lib/crypto/backend");
          releaseHash = await backendReleaseToGuide(booking.id, chainNetwork);
          console.log(`[Escrow Release] On-chain release successful! Tx Hash: ${releaseHash}`);
        } catch (chainErr: any) {
          console.error("[Escrow Release] FAILED on-chain release:", chainErr.message);
          return NextResponse.json(
            { message: `Failed to release escrow on-chain: ${chainErr.message}` },
            { status: 500 }
          );
        }

        // Step 2: Record all DB changes atomically AFTER on-chain success
        const commissionAmount =
          booking.platform_fee ?? booking.totalPriceUSD * 0.1;
        const guideAmount = booking.totalPriceUSD - commissionAmount;

        // Resolve guide wallet: prefer booking snapshot, fall back to current profile
        const guideWallet =
          booking.guideWalletSnapshot ||
          booking.gig.guide.walletAddress ||
          "unknown";

        try {
          await prisma.$transaction([
            // Update booking with the release hash
            prisma.booking.update({
              where: { id: booking.id },
              data: { txHash: releaseHash },
            }),
            // Create EscrowPayout record — full audit trail of guide earnings
            prisma.escrowPayout.create({
              data: {
                bookingId: booking.id,
                guideId: booking.gig.guide.id,
                guideWallet,
                guideAmountUSD: guideAmount,
                commissionAmountUSD: commissionAmount,
                releaseHash,
                status: "COMPLETED",
              },
            }),
            // Create PlatformRevenue with the RELEASE hash (not the original payment hash)
            prisma.platformRevenue.create({
              data: {
                source: "BOOKING_COMMISSION",
                amountUSDT: commissionAmount,
                txHash: releaseHash,
                referenceId: booking.id,
              },
            }),
          ]);
          console.log(
            `[Escrow Release] DB records created. Guide: ${guideAmount} USDC, Commission: ${commissionAmount} USDC`
          );
        } catch (dbErr: any) {
          // On-chain release succeeded but DB write failed — critical, log prominently
          console.error(
            `[Escrow Release] CRITICAL: On-chain release (${releaseHash}) succeeded but DB write failed! Booking: ${booking.id}`,
            dbErr
          );
          // Do not return error to client — on-chain is the source of truth.
          // The EscrowPayout can be reconciled manually from chain events.
        }
      } else {
        // Booking has no real on-chain txHash (mock/manual) — skip on-chain release
        // but still record the commission in the DB ledger
        console.warn(
          `[Escrow Release] Booking ${booking.id} has no real on-chain txHash. Skipping chain release, recording DB-only revenue.`
        );
        const commissionAmount =
          booking.platform_fee ?? booking.totalPriceUSD * 0.1;

        try {
          await prisma.platformRevenue.create({
            data: {
              source: "BOOKING_COMMISSION",
              amountUSDT: commissionAmount,
              txHash: "MANUAL_OFF_CHAIN",
              referenceId: booking.id,
            },
          });
        } catch (dbErr) {
          console.error("[Revenue] Failed to create off-chain revenue record:", dbErr);
        }

        // Log this as an audit warning
        try {
          await prisma.paymentAuditLog.create({
            data: {
              bookingId: booking.id,
              txHash: bookingTxHash,
              source: "BOOKING_COMPLETE_NO_CHAIN",
              status: "SKIPPED_MOCK",
              errorMessage:
                "Booking completed without a real on-chain txHash. No escrow release performed.",
            },
          });
        } catch (_) {}
      }
    }

    // ─── CANCELLED: Refund escrow on-chain ──────────────────────────────────
    if (status === "CANCELLED") {
      if (isRealTxHash(booking.txHash)) {
        try {
          const { backendRefundTourist } = await import("@/lib/crypto/backend");
          const chainNetwork = (booking.paymentNetwork as any) || "avalanche";
          const refundHash = await backendRefundTourist(booking.id, chainNetwork);
          console.log(`[Escrow Refund] On-chain refund successful! Tx Hash: ${refundHash}`);

          await prisma.booking.update({
            where: { id: booking.id },
            data: { txHash: refundHash },
          });
        } catch (chainErr: any) {
          console.error("[Escrow Refund] Failed on-chain refund:", chainErr.message);
          return NextResponse.json(
            { message: `Failed to refund escrow on-chain: ${chainErr.message}` },
            { status: 500 }
          );
        }
      }

      // Notifications for both parties
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

    // ─── CONFIRMED: Confirm on-chain + send receipt email ───────────────────
    if (status === "CONFIRMED") {
      if (isRealTxHash(txHash)) {
        try {
          const { backendConfirmBooking } = await import("@/lib/crypto/backend");
          const chainNetwork = paymentNetwork || "avalanche";
          const confirmHash = await backendConfirmBooking(
            params.id,
            chainNetwork as any
          );
          console.log(
            `[Escrow Confirm] On-chain confirm successful! Tx Hash: ${confirmHash}`
          );
        } catch (chainErr: any) {
          // Non-fatal: DB status is already updated; just log the chain failure
          console.error(
            "[Escrow Confirm] Failed on-chain confirm:",
            chainErr.message
          );
        }
      }

      // Send PDF receipt email
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

    // ─── COMPLETED: Gamification rewards ────────────────────────────────────
    if (status === "COMPLETED") {
      const xpEarned = Math.max(100, Math.round(booking.totalPriceUSD * 10));
      const guide = await prisma.user.findUnique({
        where: { id: booking.gig.guide.id },
      });

      if (guide) {
        const newXp = (guide.xp || 0) + xpEarned;
        const newLevel = Math.floor(newXp / 1000) + 1;
        const oldLevel = guide.level || 1;

        await prisma.user.update({
          where: { id: guide.id },
          data: { xp: newXp, level: newLevel },
        });

        const commissionAmount =
          booking.platform_fee ?? booking.totalPriceUSD * 0.1;
        const guideNet = booking.totalPriceUSD - commissionAmount;

        await prisma.mail.create({
          data: {
            recipientId: guide.id,
            subject: `💰 Escrow Released: You Earned ${guideNet.toFixed(2)} USDC (+${xpEarned} XP)`,
            body: `Excellent job! The tourist completed the tour "${booking.gig.title}". You earned +${xpEarned} XP.\n\nYour net earnings: ${guideNet.toFixed(2)} USDC (after ${commissionAmount.toFixed(2)} USDC platform fee) have been released on-chain to your wallet.`,
          },
        });

        if (newLevel > oldLevel) {
          await prisma.mail.create({
            data: {
              recipientId: guide.id,
              subject: `🎉 Level Up: Reached Level ${newLevel}!`,
              body: `Congratulations on leveling up to Level ${newLevel}! Your guide status has gained priority rank boost.`,
            },
          });
        }
      }
    }

    // Update gig ranking score
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
      return NextResponse.json(
        { message: "Only unpaid pending bookings can be deleted" },
        { status: 400 }
      );
    }

    await prisma.booking.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Booking DELETE error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
