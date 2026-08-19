import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { txHash, amountUSD, network, bookingId } = await req.json();

    if (!txHash || !amountUSD || amountUSD <= 0) {
      return NextResponse.json(
        { message: "txHash and a positive amountUSD are required" },
        { status: 400 }
      );
    }

    // Replay protection: reject duplicate tip txHash
    const existing = await prisma.platformRevenue.findFirst({
      where: { txHash, source: "TIP_FEE" },
    });
    if (existing) {
      return NextResponse.json(
        { message: "This transaction has already been recorded as a tip" },
        { status: 400 }
      );
    }

    // Record the tip as platform revenue
    const revenue = await prisma.platformRevenue.create({
      data: {
        source: "TIP_FEE",
        amountUSDT: Number(amountUSD),
        txHash,
        referenceId: bookingId || (session.user as any).id,
      },
    });

    // Write to audit log
    await prisma.paymentAuditLog.create({
      data: {
        txHash,
        source: "TIP_FEE",
        status: "SUCCESS",
        rawPayload: {
          amountUSD,
          network: network || "unknown",
          userId: (session.user as any).id,
          bookingId: bookingId || null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for your support!",
      revenueId: revenue.id,
    });
  } catch (error) {
    console.error("[Tip API Error]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
