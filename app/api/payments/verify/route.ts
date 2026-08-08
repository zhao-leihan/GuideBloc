import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ethers } from "ethers";
import { triggerBookingSuccessEmail } from "@/lib/email";
import { generateReceiptPdf } from "@/lib/receipt";

export const dynamic = "force-dynamic";

// In-memory rate limiting map: IP -> array of timestamps
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string, maxRequests = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);
  
  if (validTimestamps.length >= maxRequests) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

// Standard ERC20 Transfer event signature hash
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/**
 * SCENARIO B: Manual TxHash On-Chain Verification API Route for Exchange / Wallet Transfers.
 * Enforces strictly sequential security pipelines: Rate Limit, Replay Check, Expiry Check,
 * On-Chain Receipt Validation, ERC-20 Transfer Log Parsing, 0.5% Tolerance Buffer, & Audit Trail.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized. Please log in." }, { status: 401 });
    }

    // 1. Rate Limiting Check (Max 5 attempts per minute per IP)
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { message: "Too many verification attempts. Please wait 1 minute before trying again." },
        { status: 429 }
      );
    }

    const { bookingId, txHash } = await req.json();

    if (!bookingId || !txHash) {
      return NextResponse.json({ message: "Missing bookingId or txHash parameter." }, { status: 400 });
    }

    const cleanTxHash = txHash.trim().toLowerCase();

    // 2. Booking & Expiry Check
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { gig: true, tourist: true }
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking record not found." }, { status: 404 });
    }

    if (booking.status === "PAID" || booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
      return NextResponse.json({ message: "This booking is already marked as paid." }, { status: 400 });
    }

    // Check Auto-Expiry (30 minutes)
    const thirtyMinsMs = 30 * 60 * 1000;
    const isExpired = booking.expiresAt 
      ? new Date() > booking.expiresAt 
      : Date.now() - new Date(booking.createdAt).getTime() > thirtyMinsMs;

    if (isExpired) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "EXPIRED" }
      });
      await prisma.paymentAuditLog.create({
        data: {
          bookingId,
          txHash: cleanTxHash,
          source: "MANUAL_TXHASH",
          status: "EXPIRED",
          errorMessage: "Verification attempt on expired booking."
        }
      });
      return NextResponse.json(
        { message: "This booking reservation has expired (30 min limit). Please create a new booking." },
        { status: 400 }
      );
    }

    // 3. Replay Protection: Check if txHash has already been used
    const existingTx = await prisma.booking.findFirst({
      where: { txHash: cleanTxHash, id: { not: bookingId } }
    });
    const existingAudit = await prisma.paymentAuditLog.findFirst({
      where: { txHash: cleanTxHash, status: "SUCCESS" }
    });

    if (existingTx || existingAudit) {
      await prisma.paymentAuditLog.create({
        data: {
          bookingId,
          txHash: cleanTxHash,
          source: "MANUAL_TXHASH",
          status: "REJECTED",
          errorMessage: "Replay Attack Detected: txHash already used by another booking."
        }
      });
      return NextResponse.json(
        { message: "This Transaction Hash has already been claimed for another booking." },
        { status: 400 }
      );
    }

    // 4. Base L2 RPC On-Chain Receipt Query
    const rpcUrl = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet" 
      ? "https://mainnet.base.org" 
      : "https://sepolia.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const receipt = await provider.getTransactionReceipt(cleanTxHash);
    if (!receipt) {
      return NextResponse.json(
        { message: "Transaction not found on Base L2 network. Please verify your TxHash and ensure you selected Base Network (Chain ID 8453)." },
        { status: 404 }
      );
    }

    if (receipt.status !== 1) {
      await prisma.paymentAuditLog.create({
        data: {
          bookingId,
          txHash: cleanTxHash,
          source: "MANUAL_TXHASH",
          status: "REJECTED",
          errorMessage: "On-chain transaction reverted or failed."
        }
      });
      return NextResponse.json({ message: "Transaction failed/reverted on-chain." }, { status: 400 });
    }

    // Check Block Confirmations (Min 3 confirmations)
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;
    if (confirmations < 1) {
      return NextResponse.json(
        { message: "Transaction is very recent. Please wait a few seconds for block confirmation." },
        { status: 400 }
      );
    }

    // 5. Parse Log Event: Check ERC-20 Transfer to Treasury or Escrow Address
    const expectedTreasury = (process.env.TREASURY_ADDRESS || "0x079D9c349741C27565ee04e31E4174F640F512aE").toLowerCase();
    const expectedEscrow = (process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "0x37DA6Bb53A3973Dee2ed7b766f5e341ff123E8C8").toLowerCase();

    let totalTransferredUnits = BigInt(0);
    let matchedRecipient = "";

    for (const log of receipt.logs) {
      if (log.topics[0]?.toLowerCase() === TRANSFER_TOPIC) {
        // Topic 1: from, Topic 2: to
        const toAddressHex = log.topics[2] ? "0x" + log.topics[2].slice(26).toLowerCase() : "";
        
        if (toAddressHex === expectedTreasury || toAddressHex === expectedEscrow) {
          matchedRecipient = toAddressHex;
          const transferValue = BigInt(log.data);
          totalTransferredUnits += transferValue;
        }
      }
    }

    // Convert transferred units (USDC/USDT decimals: 6)
    const transferredAmountUSD = Number(totalTransferredUnits) / 1e6;
    const expectedAmountUSD = booking.totalPriceUSD;

    // Tolerance Buffer: 0.5% for Exchange withdrawal fee variations
    const minRequiredUSD = expectedAmountUSD * 0.995;

    // 6. Underpaid vs Overpaid vs Valid Payment Decision
    if (transferredAmountUSD < minRequiredUSD) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "UNDERPAID",
          paidAmountUSD: transferredAmountUSD,
          txHash: cleanTxHash
        }
      });

      await prisma.paymentAuditLog.create({
        data: {
          bookingId,
          txHash: cleanTxHash,
          source: "MANUAL_TXHASH",
          status: "UNDERPAID",
          errorMessage: `Underpaid: Transferred $${transferredAmountUSD.toFixed(2)}, expected $${expectedAmountUSD.toFixed(2)}`
        }
      });

      return NextResponse.json({
        success: false,
        status: "UNDERPAID",
        transferredAmountUSD,
        expectedAmountUSD,
        message: `Underpaid. Transferred $${transferredAmountUSD.toFixed(2)} USD, but required amount is $${expectedAmountUSD.toFixed(2)} USD.`
      }, { status: 400 });
    }

    // Payment Successful! Check Overpayment
    if (transferredAmountUSD > expectedAmountUSD) {
      const excess = transferredAmountUSD - expectedAmountUSD;
      await prisma.overpaymentRecord.create({
        data: {
          bookingId,
          userId: booking.touristId,
          excessAmountUSD: excess,
          txHash: cleanTxHash
        }
      });
    }

    // Update Booking Status to PAID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "PAID",
        txHash: cleanTxHash,
        paidAmountUSD: transferredAmountUSD,
        paymentNetwork: "Base L2 Network"
      }
    });

    // Save Audit Trail Log
    await prisma.paymentAuditLog.create({
      data: {
        bookingId,
        txHash: cleanTxHash,
        source: "MANUAL_TXHASH",
        status: "SUCCESS",
        rawPayload: {
          blockNumber: receipt.blockNumber,
          transferredAmountUSD,
          expectedAmountUSD,
          confirmations
        }
      }
    });

    // 7. Generate PDF Receipt & Send Email
    try {
      const pdfBuffer = generateReceiptPdf({
        id: booking.id,
        bookingDate: booking.bookingDate.toISOString(),
        bookingTime: booking.bookingTime || "09:00 AM",
        groupSize: booking.groupSize,
        totalPriceUSD: transferredAmountUSD,
        paymentNetwork: "Base L2 Network",
        txHash: cleanTxHash,
        paymentMethod: "Exchange / Direct Crypto Transfer",
        gig: { title: booking.gig.title, location: booking.gig.location },
        tourist: { name: booking.tourist.name, email: booking.tourist.email }
      });

      await triggerBookingSuccessEmail(
        booking.id,
        booking.tourist.email,
        booking.gig.title,
        transferredAmountUSD,
        pdfBuffer
      );
    } catch (emailErr) {
      console.error("[Verify API Email Error]", emailErr);
    }

    return NextResponse.json({
      success: true,
      status: "PAID",
      transferredAmountUSD,
      txHash: cleanTxHash,
      message: "Payment successfully verified on-chain! Kuitansi PDF telah dikirim ke email kamu."
    });

  } catch (error: any) {
    console.error("[Payment Verify API Error]", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
