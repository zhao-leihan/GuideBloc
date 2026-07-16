import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { backendCreateBooking } from "@/lib/crypto/backend";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status
    } = body;

    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY || "";

    // Extract actual booking ID
    const bookingId = order_id.split("_")[0];

    // Verify signature key if server key is set
    if (midtransServerKey) {
      const hashStr = `${order_id}${status_code}${gross_amount}${midtransServerKey}`;
      const localSignature = createHash("sha512").update(hashStr).digest("hex");

      if (localSignature !== signature_key) {
        console.error("[Midtrans Webhook] Invalid signature verification.");
        return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
      }
    } else {
      console.warn("[Midtrans Webhook] MIDTRANS_SERVER_KEY is missing, skipping signature verification for testing.");
    }

    console.log(`[Midtrans Webhook] Received notification for Booking: ${bookingId}, Status: ${transaction_status}`);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { gig: { include: { guide: true } } }
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // Capture or settlement statuses mean payment is complete
    const isPaid = transaction_status === "settlement" || transaction_status === "capture";

    if (isPaid && booking.status === "PENDING") {
      // 1. Trigger the server-side hot wallet to fund the blockchain escrow
      console.log(`[Midtrans Webhook] Payment settled! Funding blockchain escrow for Booking: ${booking.id}`);
      
      const chainNetwork = "base";
      const txHash = await backendCreateBooking(
        booking.id,
        booking.totalPriceUSD,
        booking.gig.guide.walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "USDC",
        chainNetwork
      );

      // 2. Update booking status to CONFIRMED (funded) with transaction hash
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
          txHash: txHash,
          paymentNetwork: chainNetwork
        }
      });

      console.log(`[Midtrans Webhook] Escrow funded successfully. Tx Hash: ${txHash}`);
    } else if (transaction_status === "expire" || transaction_status === "cancel" || transaction_status === "deny") {
      // If payment expired or cancelled, set status to CANCELLED
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED"
        }
      });
      console.log(`[Midtrans Webhook] Booking marked as CANCELLED due to transaction status: ${transaction_status}`);
    }

    return NextResponse.json({ message: "Webhook processed successfully" });

  } catch (error: any) {
    console.error("[Midtrans Webhook Error]:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
