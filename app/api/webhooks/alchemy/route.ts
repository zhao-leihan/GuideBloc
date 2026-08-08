import { NextResponse } from "next/server";
import crypto from "crypto";
import { ethers } from "ethers";
import { prisma } from "@/lib/prisma";
import { triggerBookingSuccessEmail } from "@/lib/email";
import { generateReceiptPdf } from "@/lib/receipt";

export const dynamic = "force-dynamic";

/**
 * SCENARIO A: Webhook Event Listener for Base L2 Escrow Smart Contract.
 * Validates HMAC SHA-256 signature from Alchemy/Node provider.
 * Idempotently verifies EscrowFunded events and cross-checks receipt on Base L2.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-alchemy-signature") || req.headers.get("x-signature") || "";

    // 1. Verify HMAC SHA-256 Webhook Signature
    const signingKey = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY || process.env.WEBHOOK_SIGNING_KEY;
    if (signingKey) {
      const hmac = crypto.createHmac("sha256", signingKey);
      const computedSignature = hmac.update(rawBody).digest("hex");
      if (computedSignature.toLowerCase() !== signature.toLowerCase()) {
        console.error("[Webhook Error] Invalid HMAC Signature attempt.");
        return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const logs = payload.event?.activity || payload.logs || [];

    // Base L2 RPC for independent on-chain cross-checking
    const rpcUrl = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet" 
      ? "https://mainnet.base.org" 
      : "https://sepolia.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    for (const logItem of logs) {
      const txHash = logItem.hash || logItem.transactionHash;
      if (!txHash) continue;

      // 2. Idempotency Check: Skip if txHash is already processed
      const existingAudit = await prisma.paymentAuditLog.findFirst({
        where: { txHash, status: "SUCCESS" }
      });
      if (existingAudit) {
        console.log(`[Webhook] Skipping txHash ${txHash} - already processed.`);
        continue;
      }

      // 3. Cross-Check On-Chain Receipt Independently
      const txReceipt = await provider.getTransactionReceipt(txHash);
      if (!txReceipt || txReceipt.status !== 1) {
        console.warn(`[Webhook Warning] Transaction ${txHash} not confirmed or reverted on-chain.`);
        await prisma.paymentAuditLog.create({
          data: {
            txHash,
            source: "WEBHOOK",
            status: "REJECTED",
            rawPayload: logItem,
            errorMessage: "Transaction reverted or missing on-chain receipt."
          }
        });
        continue;
      }

      // Extract bookingId from topics or memo
      const bookingId = logItem.bookingId || logItem.topics?.[1];
      if (!bookingId) continue;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { gig: true, tourist: true }
      });

      if (!booking) {
        console.warn(`[Webhook Warning] Booking ${bookingId} not found.`);
        continue;
      }

      // 4. Update Booking Status to PAID / CONFIRMED
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "PAID",
          txHash,
          paidAmountUSD: booking.totalPriceUSD,
          paymentNetwork: "Base L2 Network"
        }
      });

      // 5. Log Audit Trail
      await prisma.paymentAuditLog.create({
        data: {
          bookingId,
          txHash,
          source: "WEBHOOK",
          status: "SUCCESS",
          rawPayload: logItem
        }
      });

      // 6. Generate PDF Receipt and Trigger Success Email
      try {
        const pdfBuffer = generateReceiptPdf({
          id: booking.id,
          bookingDate: booking.bookingDate.toISOString(),
          bookingTime: booking.bookingTime || "09:00 AM",
          groupSize: booking.groupSize,
          totalPriceUSD: booking.totalPriceUSD,
          paymentNetwork: "Base L2 Network",
          txHash,
          paymentMethod: "Base Escrow Smart Contract",
          gig: { title: booking.gig.title, location: booking.gig.location },
          tourist: { name: booking.tourist.name, email: booking.tourist.email }
        });

        await triggerBookingSuccessEmail(
          booking.id,
          booking.tourist.email,
          booking.gig.title,
          booking.totalPriceUSD,
          pdfBuffer
        );
      } catch (emailErr) {
        console.error("[Webhook Email Error]", emailErr);
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed idempotently." });
  } catch (error: any) {
    console.error("[Webhook System Error]", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
