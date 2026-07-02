import { prisma } from "@/lib/prisma";

export type BoostType = "FEATURED_HOME" | "TOP_SEARCH" | "CATEGORY_BANNER";

export interface BoostOption {
  type: BoostType;
  name: string;
  description: string;
  priceUSD: number;
  durationHours: number;
  icon: string;
}

export const BOOST_OPTIONS: BoostOption[] = [
  {
    type: "FEATURED_HOME",
    name: "Featured on Homepage",
    description: "Your gig appears on the homepage featured section for 24 hours",
    priceUSD: 5,
    durationHours: 24,
    icon: "StarFilledIcon",
  },
  {
    type: "TOP_SEARCH",
    name: "Top of Search",
    description: "Your gig appears at the top of search results for your category",
    priceUSD: 8,
    durationHours: 48,
    icon: "ArrowUpIcon",
  },
  {
    type: "CATEGORY_BANNER",
    name: "Category Banner",
    description: "Your gig is featured in a category banner for 72 hours",
    priceUSD: 12,
    durationHours: 72,
    icon: "LightningBoltIcon",
  },
];

/**
 * Purchase a gig boost
 */
export async function purchaseBoost(
  gigId: string,
  guideId: string,
  boostType: BoostType,
  txHash: string
) {
  const option = BOOST_OPTIONS.find((b) => b.type === boostType);
  if (!option) throw new Error("Invalid boost type");

  const startsAt = new Date();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + option.durationHours);

  const boost = await prisma.gigBoost.create({
    data: {
      gigId,
      guideId,
      boostType,
      priceUSDT: option.priceUSD,
      txHash,
      startsAt,
      expiresAt,
    },
  });

  // Record platform revenue
  await prisma.platformRevenue.create({
    data: {
      source: "GIG_BOOST",
      amountUSDT: option.priceUSD,
      txHash,
      referenceId: gigId,
    },
  });

  return boost;
}

/**
 * Check if a gig has active boosts
 */
export async function getActiveBoosts(gigId: string) {
  return prisma.gigBoost.findMany({
    where: {
      gigId,
      expiresAt: { gt: new Date() },
    },
  });
}

/**
 * Check if a gig is currently boosted (has any active boost)
 */
export async function isGigBoosted(gigId: string): Promise<boolean> {
  const count = await prisma.gigBoost.count({
    where: {
      gigId,
      expiresAt: { gt: new Date() },
    },
  });
  return count > 0;
}

/**
 * Get boost stats for a guide's dashboard
 */
export async function getGuideBoostStats(guideId: string) {
  const boosts = await prisma.gigBoost.findMany({
    where: { guideId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const activeBoosts = boosts.filter((b: any) => new Date(b.expiresAt) > new Date());
  const totalSpent = boosts.reduce((sum: number, b: any) => sum + Number(b.priceUSDT), 0);

  return {
    active: activeBoosts.length,
    total: boosts.length,
    totalSpent,
    recentBoosts: boosts.slice(0, 5),
  };
}
