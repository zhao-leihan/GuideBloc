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
        reply: "⚠️ Hosting Environment Variables Missing: Please configure GEMINI_API_KEY and DATABASE_URL in your hosting platform dashboard (e.g. Vercel Project Settings > Environment Variables) so Kira can connect and retrieve local tours.",
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
    let gigs: any[] = [];
    try {
      gigs = await prisma.gig.findMany({
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
    } catch (dbErr) {
      console.warn("Could not query gigs from DB for AI context:", dbErr);
    }

    // Format gig descriptions to feed to the AI context
    const toursContext = gigs
      .map((g) => {
        const price = g.client_price || g.priceUSD;
        return `- TOUR: "${g.title}" (ID: ${g.id}) in ${g.location}, ${g.country}. Price: ${price} USDT/USDC. Duration: ${g.durationHours} hrs. Rating: ${g.avgRating}/5 (${g.reviewCount} reviews). Total Bookings: ${g.booking_count}. Guide: ${g.guide?.name} (Bio: ${g.guide?.bio || "Local expert"}).`;
      })
      .join("\n");

    // 4. Secure AI Persona & System Instructions (Tour Information Assistant)
    const systemPrompt = `You are "Kira", a friendly, knowledgeable Tour Information Assistant for Explomate, specializing in tours across JAPAN (Tokyo, Kyoto, Osaka, Mount Fuji, and beyond).

ROLE & BOUNDARIES (CRITICAL):
- You act strictly as an INFORMATIVE GUIDE (Tour Finder & Travel Information Assistant).
- You DO NOT automatically book tours, schedule appointments, or handle payments for the user in chat.
- Your sole purpose is to help users discover matching tours in Japan, explore itineraries, learn about vetted local guides, and understand how Explomate's Avalanche Smart Contract Escrow guarantees their safety.
- When users ask to book, schedule, or make an appointment (e.g., "make me an appointment"), explain that you are an information assistant, and guide them to browse the tour details and book directly on the official tour page on Explomate!

TARGET DESTINATION:
- Primary focus is JAPAN (Tokyo, Kyoto, Osaka, Mount Fuji, Hokkaido, etc.). Highlight Japan's culture, temples, food tours, and vetted local guides.
- If a user asks about other destinations like Bali, politely clarify that Explomate specializes in verified tours in Japan, and offer to show top Japan tours.

YOUR VIBE:
- Super casual, friendly, enthusiastic, and knowledgeable about Japanese travel and culture.
- Use emojis (🎌, 🌸, 🏯, 🍣, 🗺️), keep it warm, helpful, and concise!
- Respond in the same language the user speaks (English or Indonesian).

HERE ARE VERIFIED TOURS IN JAPAN:
${toursContext}

ACTION MECHANISM:
- "SEARCH": When the user is looking for a tour, asking for recommendations, or asking about a city in Japan. Provide a search query string.
- "NONE": When answering general questions about Japan, escrow safety, or travel tips.
(Do not use "BOOK" or "PAY" - booking is handled directly by the user on the tour page).

You MUST respond strictly in JSON matching the specified output schema. Do not prepend or append any explanation outside the JSON format.`;

    // 5. Attempt Google Gemini AI with sanitized history and clean API key
    const rawApiKey = process.env.GEMINI_API_KEY || "";
    const cleanApiKey = rawApiKey.replace(/^["']|["']$/g, "").trim();

    if (cleanApiKey && !cleanApiKey.includes("...")) {
      try {
        // Sanitize history strictly for Gemini API (must alternate, start with user, non-empty)
        const sanitizedContents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

        for (const h of history || []) {
          const text = typeof h.text === "string" ? h.text.trim() : "";
          if (!text) continue;

          const role = h.sender === "user" ? "user" : "model";

          if (sanitizedContents.length === 0) {
            if (role === "user") {
              sanitizedContents.push({ role: "user", parts: [{ text }] });
            }
            continue;
          }

          const last = sanitizedContents[sanitizedContents.length - 1];
          if (last.role === role) {
            last.parts[0].text += `\n${text}`;
          } else {
            sanitizedContents.push({ role, parts: [{ text }] });
          }
        }

        // Append current user message
        if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === "user") {
          sanitizedContents[sanitizedContents.length - 1].parts[0].text += `\n${message.trim()}`;
        } else {
          sanitizedContents.push({ role: "user", parts: [{ text: message.trim() }] });
        }

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": cleanApiKey,
            },
            body: JSON.stringify({
              contents: sanitizedContents,
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    reply: { type: "STRING", description: "Friendly informative text response to show the user." },
                    action: {
                      type: "STRING",
                      enum: ["NONE", "SEARCH"],
                      description: "Current action: SEARCH to show tours, or NONE for conversation.",
                    },
                    actionData: {
                      type: "OBJECT",
                      properties: {
                        searchQuery: { type: "STRING", description: "Keywords to search gigs in Japan" },
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

        if (geminiRes.ok) {
          const result = await geminiRes.json();
          const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const parsed = JSON.parse(responseText);
            return NextResponse.json(parsed);
          }
        } else {
          const errText = await geminiRes.text();
          console.warn("Gemini API returned error, activating smart local concierge fallback:", errText);
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, falling back to local concierge engine:", geminiError);
      }
    }

    // 6. Smart Local Tour Information Engine (Focused on Japan tours)
    const fallbackResponse = generateLocalKiraResponse(message, gigs);
    return NextResponse.json(fallbackResponse);
  } catch (error) {
    console.error("AI Chat route fatal error:", error);
    return NextResponse.json({
      reply: "Konnichiwa! 🎌✨ I'm Kira, your local tour information assistant. Tell me which city in Japan you'd like to explore (Tokyo, Kyoto, Osaka) and I'll find the best tours for you!",
      action: "NONE",
    });
  }
}

/**
 * High-Intelligence Local Tour Information Assistant Engine
 * Focuses on Japan tours and informative guidance.
 */
function generateLocalKiraResponse(message: string, gigs: any[]) {
  const lower = message.toLowerCase().trim();

  // 1. Explicit Appointment / Booking requests (Informative boundary clarification)
  if (
    lower.includes("appointment") ||
    lower.includes("schedule") ||
    lower.includes("make me an") ||
    lower.includes("pesan") ||
    lower.includes("jadwal") ||
    lower.includes("reservasi") ||
    lower.includes("book")
  ) {
    const japanGigs = gigs.filter(
      (g) =>
        (g.country || "").toLowerCase().includes("japan") ||
        (g.location || "").toLowerCase().includes("kyoto") ||
        (g.location || "").toLowerCase().includes("tokyo")
    );
    const top = japanGigs[0] || gigs[0];

    return {
      reply: `I'm here as your **Tour Information Assistant** to help you search and explore the best local tours in Japan! 🎌✨\n\nI don't schedule appointments or process bookings automatically in the chat. To book a tour, simply click on the tour card below to view the itinerary, choose your preferred date & time, and book directly on Explomate with Avalanche Smart Contract Escrow protection!`,
      action: "SEARCH",
      actionData: {
        searchQuery: top ? (top.location || top.title) : "Kyoto",
      },
    };
  }

  // 2. Direct match with database gigs in Japan
  const matchedGigs = gigs.filter((g) => {
    const loc = (g.location || "").toLowerCase();
    const ctry = (g.country || "").toLowerCase();
    const ttl = (g.title || "").toLowerCase();
    return lower.includes(loc) || lower.includes(ctry) || lower.includes(ttl);
  });

  if (matchedGigs.length > 0) {
    const top = matchedGigs[0];
    const price = top.client_price || top.priceUSD;
    return {
      reply: `I found an authentic local tour in Japan for you! 🎌🏯\n\n**${top.title}** in **${top.location}, ${top.country}** hosted by verified guide **${top.guide?.name || "Local Expert"}** ($${price} USD).\n\nCheck out the tour details below to explore the itinerary and book directly!`,
      action: "SEARCH",
      actionData: {
        searchQuery: top.location || top.title,
      },
    };
  }

  // 3. Japan / Tokyo / Kyoto / Osaka inquiry
  if (
    lower.includes("japan") ||
    lower.includes("tokyo") ||
    lower.includes("kyoto") ||
    lower.includes("osaka") ||
    lower.includes("jepang") ||
    lower.includes("fuji")
  ) {
    return {
      reply: `Konnichiwa! 🎌🏯 Japan is our premier destination! We have verified local guides ready for cultural temple tours, hidden alley dining, and scenic castle explorations in Kyoto & Tokyo.\n\nBrowse through our verified Japan tours below to find your perfect experience!`,
      action: "SEARCH",
      actionData: {
        searchQuery: lower.includes("tokyo") ? "Tokyo" : "Kyoto",
      },
    };
  }

  // 4. Bali / Non-Japan inquiry (Redirect politely to Japan)
  if (lower.includes("bali") || lower.includes("indonesia")) {
    return {
      reply: `Explomate specializes primarily in authentic local experiences across **Japan** (Tokyo, Kyoto, Osaka, and more)! 🎌🗻\n\nI can help you find amazing tours in Japan like traditional temple explorations in Kyoto or dynamic city tours in Tokyo. Would you like to check out our top tours in Japan?`,
      action: "SEARCH",
      actionData: {
        searchQuery: "Kyoto",
      },
    };
  }

  // 5. Escrow and safety questions
  if (
    lower.includes("escrow") ||
    lower.includes("aman") ||
    lower.includes("safe") ||
    lower.includes("security") ||
    lower.includes("bayar") ||
    lower.includes("crypto") ||
    lower.includes("usdt") ||
    lower.includes("usdc") ||
    lower.includes("avalanche")
  ) {
    return {
      reply: `At Explomate, every tour in Japan is 100% protected by **Avalanche Smart Contract Escrow** 🛡️🔒!\n\n1. When you book a tour on the tour page, your payment (USDC/USDT) is safely locked on-chain.\n2. The guide **cannot** take your funds early.\n3. Payment is released to the guide **only after you meet in person and confirm your tour is completed**.\n\nZero advance payment risk, zero chargeback scams, pure peace of mind!`,
      action: "NONE",
    };
  }

  // 6. Questions about becoming a guide
  if (lower.includes("guide") || lower.includes("pemandu") || lower.includes("daftar guide") || lower.includes("earning")) {
    return {
      reply: `Interested in becoming a local guide in Japan? 🎒🗺️ Explomate offers local guides 90% direct earnings paid instantly in stablecoins (USDC/USDT) with **zero fraud or chargeback risk**!\n\nYou can click **Become a Tour Guide** in the navigation bar to register and list your custom tours!`,
      action: "NONE",
    };
  }

  // 7. Greetings or test messages
  if (lower === "test" || lower === "hi" || lower === "halo" || lower === "hello" || lower === "p" || lower.includes("kira")) {
    return {
      reply: `Konnichiwa! 🌟 I'm **Kira**, your local tour information assistant at Explomate! I'm here to help you search and discover authentic local tours across **Japan** (Tokyo, Kyoto, Osaka, and more) 🎌🏯.\n\nWhich city or experience in Japan would you like to explore today?`,
      action: "NONE",
    };
  }

  // 8. General search fallback focusing on Japan
  const japanGigs = gigs.filter(
    (g) =>
      (g.country || "").toLowerCase().includes("japan") ||
      (g.location || "").toLowerCase().includes("kyoto") ||
      (g.location || "").toLowerCase().includes("tokyo")
  );
  const sampleGigs = (japanGigs.length > 0 ? japanGigs : gigs).slice(0, 2);
  const gigList = sampleGigs.length > 0
    ? `\n\nTrending tours in Japan right now:\n` + sampleGigs.map((g) => `• **${g.title}** (${g.location})`).join("\n")
    : "";

  return {
    reply: `I'd love to help you find the best tour in Japan! 🎌✨ Tell me what kind of travel experience you have in mind (e.g. "Kyoto castle tour", "Tokyo food tour", or "temple visits").${gigList}`,
    action: "SEARCH",
    actionData: {
      searchQuery: "Kyoto",
    },
  };
}
