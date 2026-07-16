import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ message: "Booking ID is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        gig: {
          include: { guide: true }
        },
        tourist: true
      }
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY || "";
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const midtransUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    // Convert USD to IDR using a standard rate (e.g. 16,200 IDR per USD)
    const usdToIdrRate = 16200;
    const grossAmount = Math.round(booking.totalPriceUSD * usdToIdrRate);

    // If Midtrans Server Key is missing, return a mock token for seamless testing
    if (!midtransServerKey) {
      console.warn("[Midtrans] MIDTRANS_SERVER_KEY is not configured in .env. Returning mock snap token.");
      return NextResponse.json({
        token: `mock_snap_token_${Math.random().toString(36).substring(2, 15)}`,
        redirectUrl: "https://sandbox.midtrans.com",
        isMock: true
      });
    }

    const authHeader = `Basic ${Buffer.from(midtransServerKey + ":").toString("base64")}`;

    const midtransBody = {
      transaction_details: {
        order_id: `${booking.id}_${Date.now()}`, // append timestamp to prevent duplicate order ID error on retry
        gross_amount: grossAmount
      },
      item_details: [
        {
          id: booking.gigId,
          price: grossAmount,
          quantity: 1,
          name: booking.gig.title.substring(0, 50) // limit name length
        }
      ],
      customer_details: {
        first_name: booking.tourist?.name || "Tourist",
        email: booking.tourist?.email || "tourist@explomate.com"
      },
      credit_card: {
        secure: true
      }
    };

    const response = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify(midtransBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Midtrans API Error]:", errorText);
      return NextResponse.json({ message: "Failed to generate Midtrans transaction" }, { status: 500 });
    }

    const midtransData = await response.json();
    return NextResponse.json({
      token: midtransData.token,
      redirectUrl: midtransData.redirect_url
    });

  } catch (error: any) {
    console.error("[Midtrans Token Route Error]:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
