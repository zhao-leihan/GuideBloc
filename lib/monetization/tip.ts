import { prisma } from "@/lib/prisma";

export interface TipParams {
  bookingId: string;
  fromUserId: string;
  toGuideId: string;
  amount: number;
  token: "USDT" | "USDC";
  txHash: string;
  message?: string;
}

/**
 * Record a tip transaction
 */
export async function recordTip(params: TipParams) {
  const revenue = await prisma.platformRevenue.create({
    data: {
      source: "TIP_FEE",
      amountUSDT: params.amount,
      txHash: params.txHash,
      referenceId: params.bookingId,
    },
  });

  return {
    success: true,
    revenue,
    tip: {
      amount: params.amount,
      token: params.token,
      from: params.fromUserId,
      to: params.toGuideId,
      message: params.message,
    },
  };
}

/**
 * Get total tips recorded on the platform
 */
export async function getPlatformTipsTotal(): Promise<number> {
  const tips = await prisma.platformRevenue.findMany({
    where: { source: "TIP_FEE" },
    select: { amountUSDT: true },
  });

  return tips.reduce((sum: number, t: any) => sum + Number(t.amountUSDT), 0);
}

/**
 * Get tip history for a booking
 */
export async function getBookingTips(bookingId: string) {
  return prisma.platformRevenue.findMany({
    where: {
      source: "TIP_FEE",
      referenceId: bookingId,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Suggested tip amounts based on booking total
 */
export function getSuggestedTipAmounts(bookingTotal: number): number[] {
  const suggestions = [
    Math.round(bookingTotal * 0.05),
    Math.round(bookingTotal * 0.1),
    Math.round(bookingTotal * 0.15),
    Math.round(bookingTotal * 0.2),
  ];
  return suggestions.filter((s) => s >= 1);
}
