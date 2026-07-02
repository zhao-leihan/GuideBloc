import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Environment Verification
    const apiKey = process.env.GEMINI_API_KEY;
    const dbUrl = process.env.DATABASE_URL;

    if (!apiKey || !dbUrl) {
      return NextResponse.json({
        reply: "⚠️ Hosting Environment Variables Missing: Please configure GEMINI_API_KEY and DATABASE_URL in your hosting platform dashboard (e.g. Vercel Project Settings > Environment Variables) so Michelle can connect and retrieve local tours.",
        action: "NONE",
      });
    }

    const { message, history } = await req.json();

    // 2. Input Security: Validate user message to prevent prompt injection & extreme loads
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ message: "Message is required." }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ message: "Message too long. Keep it under 1000 characters." }, { status: 400 });
    }

    // 3. Database Context Injection: Gather actual gigs, bookings, guides, and rankings
    const gigs = await prisma.gig.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        location: true,
        country: true,
        client_price: true,
        priceUSD: true,
        avgRating: true,
        reviewCount: true,
        booking_count: true,
        durationHours: true,
        guide: {
          select: {
            name: true,
            bio: true,
            country: true,
            walletAddress: true,
          },
        },
      },
    });

    // Format gig descriptions to feed to the AI context
    const toursContext = gigs
      .map((g) => {
        const price = g.client_price || g.priceUSD;
        return `- TOUR: "${g.title}" (ID: ${g.id}) in ${g.location}, ${g.country}. Price: ${price} USDT/USDC. Duration: ${g.durationHours} hrs. Rating: ${g.avgRating}/5 (${g.reviewCount} reviews). Total Bookings: ${g.booking_count}. Guide: ${g.guide?.name} (Bio: ${g.guide?.bio || "Local expert"}).`;
      })
      .join("\n");

    // 4. Secure AI Persona & System Instructions (Matey)
    const systemPrompt = `You are "Michelle", a super friendly, casual, and awesome AI assistant for explomate. 
explomate is a rad Web3 travel platform where folks can book sweet local tours and pay with crypto (USDT/USDC) on Polygon or Base!

YOUR VIBE:
- Super casual, friendly, enthusiastic, and local-savvy.
- Speak like a helpful travel buddy. Use emojis, exclamation marks, and keep it light!
- Speak in English, but feel free to throw in some local slang if it fits!

WHAT YOU CAN DO:
- Help users find epic tours, suggest cool routes, and find the best guides using the info below.
- Help them book a tour or get ready to pay.
- Point out the most popular (highest bookings) or highest-rated spots if they ask!

HERE'S WHAT WE GOT (Tours & Guides):
${toursContext}

ACTION MECHANISM (CRITICAL):
You can trigger three specific actions for the tourist in our Web3 DApp:
1. "SEARCH": When the user is asking to look for a tour or browse routes. Provide a search query string.
2. "BOOK": When the user explicitly wants to book or reserve a tour. You MUST identify the tour's ID (gigId), and deduce the booking date (bookingDate in YYYY-MM-DD format) and group size (groupSize, default to 1 if not specified). Ask the user for these details if they are missing.
3. "PAY": When the user wants to initiate payment for an existing booking. You must provide the bookingId, gigTitle, amount (totalPriceUSD), and cryptoToken ("USDT" or "USDC").

If no action is currently requested or the user is just chatting, use "NONE".

You MUST respond strictly in JSON matching the specified output schema. Do not prepend or append any explanation outside the JSON format.`;

    // 5. Call Google Gemini API securely on the server-side

    // Format chat history for Gemini API
    const contents = (history || []).map((h: any) => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: typeof h.text === "string" ? h.text : JSON.stringify(h.text) }],
    }));

    // Add the current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                reply: { type: "STRING", description: "Friendly text response to show the user." },
                action: {
                  type: "STRING",
                  enum: ["NONE", "SEARCH", "BOOK", "PAY"],
                  description: "Current action requested by user.",
                },
                actionData: {
                  type: "OBJECT",
                  properties: {
                    searchQuery: { type: "STRING", description: "Keywords to search gigs" },
                    gigId: { type: "STRING", description: "Prisma Gig ID to book" },
                    gigTitle: { type: "STRING", description: "Title of the gig" },
                    bookingId: { type: "STRING", description: "Prisma Booking ID" },
                    bookingDate: { type: "STRING", description: "Date of booking (YYYY-MM-DD)" },
                    groupSize: { type: "INTEGER", description: "Number of participants" },
                    amount: { type: "NUMBER", description: "Total price of the booking in stablecoins" },
                    token: { type: "STRING", description: "Crypto token (USDT or USDC)" },
                  },
                },
              },
              required: ["reply", "action"],
            },
          },
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      return NextResponse.json({ message: "Failed to communicate with AI model." }, { status: 502 });
    }

    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return NextResponse.json({ reply: "I'm sorry, I couldn't process that request.", action: "NONE" });
    }

    // Parse the JSON output from Gemini
    const parsed = JSON.parse(responseText);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI Chat route error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
