import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { backendCreateBooking } from "@/lib/crypto/backend";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
  } = body;

  const midtransServerKey = process.env.MIDTRANS_SERVER_KEY || "";

  // Extract actual booking ID from the order_id (format: bookingId_timestamp)
  const bookingId = order_id?.split("_")[0];

  if (!bookingId) {
    console.error("[Midtrans Webhook] Missing or malformed order_id:", order_id);
    return NextResponse.json({ message: "Invalid order_id" }, { status: 400 });
  }

  // Signature verification — skip only if server key is genuinely not set
  if (midtransServerKey) {
    const hashStr = `${order_id}${status_code}${gross_amount}${midtransServerKey}`;
    const localSignature = createHash("sha512").update(hashStr).digest("hex");

    if (localSignature !== signature_key) {
      console.error("[Midtrans Webhook] Invalid signature. Possible spoofed request.");
      // Write audit log for security
      await prisma.paymentAuditLog.create({
        data: {
          bookingId,
          txHash: null,
          source: "MIDTRANS_WEBHOOK",
          status: "REJECTED",
          errorMessage: "Signature verification failed",
        },
      }).catch(() => {});
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }
  } else {
    console.warn(
      "[Midtrans Webhook] MIDTRANS_SERVER_KEY is missing — signature check skipped. Set this in .env for production security."
    );
  }

  console.log(
    `[Midtrans Webhook] Received: Booking=${bookingId}, Status=${transaction_status}`
  );

  let booking;
  try {
    booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        gig: {
          include: {
            guide: { select: { id: true, walletAddress: true } },
          },
        },
      },
    });
  } catch (dbErr: any) {
    console.error("[Midtrans Webhook] DB lookup failed:", dbErr.message);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }

  if (!booking) {
    console.error(`[Midtrans Webhook] Booking not found: ${bookingId}`);
    return NextResponse.json({ message: "Booking not found" }, { status: 404 });
  }

  // ─── Idempotency guard ─────────────────────────────────────────────────────
  // If already CONFIRMED or COMPLETED, don't re-process the webhook
  if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
    console.log(
      `[Midtrans Webhook] Booking ${bookingId} is already ${booking.status}. Ignoring duplicate webhook.`
    );
    return NextResponse.json({ message: "Already processed" });
  }

  const isPaid =
    transaction_status === "settlement" || transaction_status === "capture";

  if (isPaid && booking.status === "PENDING") {
    console.log(
      `[Midtrans Webhook] Payment settled! Funding blockchain escrow for Booking: ${booking.id}`
    );

    // Use the wallet snapshot if available, then current profile, then fail loudly
    const guideWallet =
      booking.guideWalletSnapshot ||
      booking.gig.guide.walletAddress;

    if (!guideWallet) {
      const errMsg = `Guide (${booking.gig.guide.id}) has no wallet address configured. Cannot fund escrow.`;
      console.error(`[Midtrans Webhook] CRITICAL: ${errMsg}`);

      await prisma.paymentAuditLog.create({
        data: {
          bookingId: booking.id,
          txHash: null,
          source: "MIDTRANS_WEBHOOK",
          status: "FAILED",
          errorMessage: errMsg,
        },
      }).catch(() => {});

      // Return 200 so Midtrans doesn't keep retrying — this is a data configuration issue
      return NextResponse.json({
        message: "Webhook received but escrow funding failed: guide wallet not set",
      });
    }

    const chainNetwork = "avalanche"; // Primary network — adjust if needed

    let txHash: string;
    try {
      // ✅ FIX: backendCreateBooking now THROWS on failure — no more silent mock fallback
      txHash = await backendCreateBooking(
        booking.id,
        booking.totalPriceUSD,
        guideWallet,
        "USDC",
        chainNetwork
      );
    } catch (chainErr: any) {
      console.error(
        `[Midtrans Webhook] On-chain escrow funding FAILED for booking ${booking.id}:`,
        chainErr.message
      );

      // Write audit log — booking stays PENDING so admin can retry manually
      await prisma.paymentAuditLog.create({
        data: {
          bookingId: booking.id,
          txHash: null,
          source: "MIDTRANS_WEBHOOK",
          status: "FAILED",
          errorMessage: chainErr.message,
        },
      }).catch(() => {});

      // DO NOT update booking to CONFIRMED if on-chain failed
      // Return 200 to prevent Midtrans from retrying (the payment itself was valid)
      // Admin will need to manually retry escrow funding
      return NextResponse.json({
        message:
          "Payment received but on-chain escrow funding failed. Admin manual retry required.",
      });
    }

    // On-chain success — now update DB
    try {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
          txHash,
          paymentNetwork: chainNetwork,
        },
      });

      await prisma.paymentAuditLog.create({
        data: {
          bookingId: booking.id,
          txHash,
          source: "MIDTRANS_WEBHOOK",
          status: "SUCCESS",
        },
      });

      console.log(
        `[Midtrans Webhook] Booking ${booking.id} confirmed. On-chain escrow funded. Hash: ${txHash}`
      );
    } catch (dbErr: any) {
      // On-chain succeeded but DB update failed — critical inconsistency
      console.error(
        `[Midtrans Webhook] CRITICAL: On-chain funded (${txHash}) but DB update FAILED for booking ${booking.id}:`,
        dbErr.message
      );
      // Audit log the inconsistency
      await prisma.paymentAuditLog.create({
        data: {
          bookingId: booking.id,
          txHash,
          source: "MIDTRANS_WEBHOOK",
          status: "DB_SYNC_FAILED",
          errorMessage: `On-chain OK but DB update failed: ${dbErr.message}`,
        },
      }).catch(() => {});
    }
  } else if (
    transaction_status === "expire" ||
    transaction_status === "cancel" ||
    transaction_status === "deny"
  ) {
    try {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
      });

      await prisma.paymentAuditLog.create({
        data: {
          bookingId: booking.id,
          txHash: null,
          source: "MIDTRANS_WEBHOOK",
          status: "CANCELLED",
          errorMessage: `Transaction ${transaction_status} by Midtrans`,
        },
      });

      console.log(
        `[Midtrans Webhook] Booking ${booking.id} marked CANCELLED. Reason: ${transaction_status}`
      );
    } catch (dbErr: any) {
      console.error("[Midtrans Webhook] Failed to cancel booking:", dbErr.message);
    }
  } else {
    // Log other statuses (pending, etc.) without taking action
    console.log(
      `[Midtrans Webhook] No action taken for status: ${transaction_status}`
    );
  }

  return NextResponse.json({ message: "Webhook processed successfully" });
}
