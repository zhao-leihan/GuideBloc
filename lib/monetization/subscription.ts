import { prisma } from "@/lib/prisma";

export type PlanTier = "FREE" | "EXPLORER" | "PRO" | "ELITE";

export interface SubscriptionPlan {
  tier: PlanTier;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  commissionRate: number; // percentage (e.g., 15 = 15%)
  features: string[];
  maxGigs: number;
  maxPhotos: number;
  prioritySupport: boolean;
  analytics: boolean;
  boosted: boolean;
}

export const PLANS: SubscriptionPlan[] = [
  {
    tier: "FREE",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    commissionRate: 15,
    features: [
      "Up to 3 active gigs",
      "5 photos per gig",
      "Basic profile",
      "Standard support",
    ],
    maxGigs: 3,
    maxPhotos: 5,
    prioritySupport: false,
    analytics: false,
    boosted: false,
  },
  {
    tier: "EXPLORER",
    name: "Explorer",
    monthlyPrice: 9,
    yearlyPrice: 89,
    commissionRate: 12,
    features: [
      "Up to 10 active gigs",
      "15 photos per gig",
      "Enhanced profile",
      "Basic analytics",
      "Email support",
    ],
    maxGigs: 10,
    maxPhotos: 15,
    prioritySupport: false,
    analytics: true,
    boosted: false,
  },
  {
    tier: "PRO",
    name: "Pro",
    monthlyPrice: 19,
    yearlyPrice: 189,
    commissionRate: 8,
    features: [
      "Up to 25 active gigs",
      "30 photos per gig",
      "Premium profile badge",
      "Advanced analytics",
      "Priority support",
      "Featured in search",
    ],
    maxGigs: 25,
    maxPhotos: 30,
    prioritySupport: true,
    analytics: true,
    boosted: true,
  },
  {
    tier: "ELITE",
    name: "Elite",
    monthlyPrice: 39,
    yearlyPrice: 389,
    commissionRate: 5,
    features: [
      "Unlimited gigs",
      "50 photos per gig",
      "Elite profile badge",
      "Full analytics suite",
      "Dedicated support",
      "Top placement in search",
      "Custom booking page",
      "Video introductions",
    ],
    maxGigs: -1,
    maxPhotos: 50,
    prioritySupport: true,
    analytics: true,
    boosted: true,
  },
];

/**
 * Get plan details by tier
 */
export function getPlan(tier: PlanTier): SubscriptionPlan {
  return PLANS.find((p) => p.tier === tier) || PLANS[0];
}

/**
 * Get the commission rate for a guide (as a percentage)
 */
export async function getGuideCommissionRate(guideId: string): Promise<number> {
  try {
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: guideId,
        status: "ACTIVE",
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) return 15; // Default 15%
    return subscription.plan.commissionRate;
  } catch {
    return 15;
  }
}

/**
 * Check if a guide can create more gigs based on their plan
 */
export async function canCreateGig(guideId: string): Promise<boolean> {
  try {
    const subscription = await prisma.userSubscription.findFirst({
      where: { userId: guideId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    const plan = subscription?.plan
      ? getPlanByName(subscription.plan.name)
      : getPlan("FREE");

    if (plan.maxGigs === -1) return true;

    const gigCount = await prisma.gig.count({
      where: { guideId, isActive: true },
    });

    return gigCount < plan.maxGigs;
  } catch {
    return false;
  }
}

function getPlanByName(name: string): SubscriptionPlan {
  return PLANS.find((p) => p.name === name) || PLANS[0];
}

/**
 * Create a subscription for a user
 */
export async function createSubscription(
  userId: string,
  planId: string,
  billingCycle: "MONTHLY" | "YEARLY",
  txHash: string
) {
  const now = new Date();
  const periodEnd = new Date();
  if (billingCycle === "MONTHLY") {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // Expire existing active subscriptions
  await prisma.userSubscription.updateMany({
    where: { userId, status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });

  return prisma.userSubscription.create({
    data: {
      userId,
      planId,
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      txHash,
      status: "ACTIVE",
    },
  });
}
