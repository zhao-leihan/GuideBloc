import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        bio: true,
        country: true,
        avatar: true,
        role: true,
        guideStatus: true,
        passportNumber: true,
        passportPhoto: true,
        idCardNumber: true,
        idCardPhoto: true,
        verificationStatus: true,
        verificationRejectReason: true,
        birthDate: true,
        title: true,
        age: true,
        xp: true,
        level: true,
        benefits: true,
        warnings: {
          orderBy: { createdAt: "desc" },
          select: { id: true, reason: true, createdAt: true },
        },
        savedMembers: {
          select: {
            id: true,
            name: true,
            passportNumber: true,
            idCardNumber: true,
            birthDate: true,
            title: true,
            age: true
          }
        }
      }
    });

    if (!dbUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Calculate balance based on completed bookings
    let balance = 0;
    if (dbUser.role === "GUIDE") {
      const gigs = await prisma.gig.findMany({
        where: { guideId: userId },
        select: { id: true }
      });
      const gigIds = gigs.map(g => g.id);
      const completedBookings = await prisma.booking.findMany({
        where: { gigId: { in: gigIds }, status: "COMPLETED" },
        select: { totalPriceUSD: true }
      });
      balance = completedBookings.reduce((sum, b) => sum + b.totalPriceUSD, 0);
    }

    return NextResponse.json({ ...dbUser, balance });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();

    // 1. Perform server-side AI verification if status is PENDING
    if (body.verificationStatus === "PENDING") {
      const documentNumber = body.idCardNumber || body.passportNumber;
      const documentPhoto = body.idCardPhoto || body.passportPhoto;
      const documentType = body.idCardPhoto ? "KTP (Identity Card)" : "Passport";

      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && documentPhoto && documentPhoto.startsWith("data:")) {
        try {
          const match = documentPhoto.match(/^data:(image\/[a-zA-Z+-\.]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const base64Data = match[2];

            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text: `You are an automated KYC identity document verification expert. Analyze the provided identity document photo (${documentType}) and verify it against the user-supplied document number: '${documentNumber}'.
Your task is to perform the following checks:
1. Detect if the image is actually a valid identity card, driver's license, passport, or governmental document. If it is blank, a generic image, or an unrelated placeholder, set isValid to false and provide a descriptive reason in Indonesian language.
2. Perform OCR to read the ID number (NIK on KTP, or Passport Number on Passport).
3. Verify if the extracted ID number matches the user-provided number: '${documentNumber}'. Allow for minor OCR recognition mistakes (e.g. reading 8 instead of B, or minor digit offsets), but it should be a clear match.

Respond strictly in JSON format matching the schema:
{
  "isValid": boolean,
  "rejectReason": string (null if isValid is true, otherwise a detailed explanation in Indonesian language of why it failed)
}`
                        },
                        {
                          inlineData: {
                            mimeType,
                            data: base64Data
                          }
                        }
                      ]
                    }
                  ],
                  generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                      type: "OBJECT",
                      properties: {
                        isValid: { type: "BOOLEAN" },
                        rejectReason: { type: "STRING" }
                      },
                      required: ["isValid"]
                    }
                  }
                })
              }
            );

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const result = JSON.parse(text);
                body.verificationStatus = result.isValid ? "APPROVED" : "REJECTED";
                body.verificationRejectReason = result.rejectReason || null;
              } else {
                body.verificationStatus = "APPROVED";
                body.verificationRejectReason = null;
              }
            } else {
              console.error("Gemini API error response status:", geminiRes.status);
              body.verificationStatus = "APPROVED";
              body.verificationRejectReason = null;
            }
          }
        } catch (err) {
          console.error("Gemini verification processing error:", err);
          body.verificationStatus = "APPROVED";
          body.verificationRejectReason = null;
        }
      } else {
        // Fallback for local development if API key is missing
        const isFail = documentNumber?.toLowerCase().includes("fail");
        body.verificationStatus = isFail ? "REJECTED" : "APPROVED";
        body.verificationRejectReason = isFail ? "Fotokopi/foto KTP buram, tidak terbaca atau NIK tidak terdaftar di sistem kependudukan." : null;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        walletAddress: body.walletAddress !== undefined ? body.walletAddress : undefined,
        name: body.name !== undefined ? body.name : undefined,
        bio: body.bio !== undefined ? body.bio : undefined,
        country: body.country !== undefined ? body.country : undefined,
        avatar: body.avatar !== undefined ? body.avatar : undefined,
        passportNumber: body.passportNumber !== undefined ? body.passportNumber : undefined,
        passportPhoto: body.passportPhoto !== undefined ? body.passportPhoto : undefined,
        idCardNumber: body.idCardNumber !== undefined ? body.idCardNumber : undefined,
        idCardPhoto: body.idCardPhoto !== undefined ? body.idCardPhoto : undefined,
        verificationStatus: body.verificationStatus !== undefined ? body.verificationStatus : undefined,
        verificationRejectReason: body.verificationRejectReason !== undefined ? body.verificationRejectReason : undefined,
        birthDate: body.birthDate !== undefined ? (body.birthDate ? new Date(body.birthDate) : null) : undefined,
        title: body.title !== undefined ? body.title : undefined,
        age: body.age !== undefined ? (body.age ? parseInt(body.age) : null) : undefined,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
