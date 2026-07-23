import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { walletAddress, amount } = await req.json();
    
    const apiSecret = process.env.TRANSAK_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json({ 
        message: "TRANSAK_API_SECRET is not configured in the server environment." 
      }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY || "48715dee-7955-4215-bab4-37cf8bca836f";

    // 1. Refresh partner access token
    const tokenRes = await fetch("https://api-stg.transak.com/partners/api/v2/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-secret": apiSecret,
        "x-api-key": apiKey
      },
      body: JSON.stringify({ apiKey })
    });

    if (!tokenRes.ok) {
      const tokenErr = await tokenRes.text();
      console.error("Transak token refresh error response:", tokenErr);
      return NextResponse.json({ message: `Transak API authentication failed: ${tokenErr}` }, { status: 400 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.data?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ message: "Failed to retrieve access token from Transak" }, { status: 400 });
    }

    // 2. Create secure session widget URL
    const sessionRes = await fetch("https://api-gateway-stg.transak.com/api/v2/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": accessToken,
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        widgetParams: {
          apiKey,
          referrerDomain: "http://localhost:3000",
          cryptoCurrency: "USDC",
          cryptoCurrencyCode: "USDC",
          network: "base",
          walletAddress,
          fiatCurrency: "USD",
          defaultCryptoAmount: Number(Number(amount).toFixed(2))
        }
      })
    });

    if (!sessionRes.ok) {
      const sessionErr = await sessionRes.text();
      console.error("Transak session creation error:", sessionErr);
      return NextResponse.json({ message: `Transak session creation failed: ${sessionErr}` }, { status: 400 });
    }

    const sessionData = await sessionRes.json();
    const widgetUrl = sessionData.data?.widgetUrl;
    if (!widgetUrl) {
      return NextResponse.json({ message: "Failed to retrieve widgetUrl from Transak" }, { status: 400 });
    }

    return NextResponse.json({ widgetUrl });
  } catch (error: any) {
    console.error("Transak session creation endpoint error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
