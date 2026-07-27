import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { walletAddress, amount } = body;

    if (!walletAddress || !amount) {
      return NextResponse.json({ message: "Missing walletAddress or amount" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_MOONPAY_API_KEY;
    const secretKey = process.env.MOONPAY_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json({ 
        message: "MoonPay API keys are not configured on the server .env file." 
      }, { status: 500 });
    }

    // Resolve return URL
    const hostHeader = req.headers.get("host") || "localhost:3000";
    const protocol = hostHeader.includes("localhost") ? "http" : "https";
    const redirectUrl = `${protocol}://${hostHeader}/dashboard/tourist/bookings`;

    // 1. Construct original query parameters
    const queryParams = new URLSearchParams({
      apiKey,
      currencyCode: "usdc",
      baseCurrencyCode: "usd",
      baseCurrencyAmount: Number(amount).toFixed(2),
      walletAddress,
      redirectUrl
    });

    const queryString = `?${queryParams.toString()}`;
    const baseUrl = "https://buy-sandbox.moonpay.com/";

    // 2. Generate HMAC-SHA256 signature (Base64)
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(queryString)
      .digest("base64");

    // 3. Append signature to the URL
    const signedUrl = `${baseUrl}${queryString}&signature=${encodeURIComponent(signature)}`;

    return NextResponse.json({ url: signedUrl });
  } catch (error: any) {
    console.error("MoonPay signing error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
