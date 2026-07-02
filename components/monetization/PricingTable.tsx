"use client";

import { Check } from "lucide-react";

interface PricingTier {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  commission: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

interface PricingTableProps {
  tiers: PricingTier[];
  billingCycle: "monthly" | "yearly";
  onSelect?: (tierName: string) => void;
  currentTier?: string;
}

export default function PricingTable({
  tiers,
  billingCycle,
  onSelect,
  currentTier,
}: PricingTableProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {tiers.map((tier) => {
        const price = billingCycle === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
        const period = billingCycle === "monthly" ? "/mo" : "/yr";
        const isCurrent = currentTier === tier.name;

        return (
          <div
            key={tier.name}
            className={`relative rounded-2xl p-6 transition-all ${
              tier.highlighted
                ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105"
                : "bg-white border border-dark-200 hover:border-primary/50"
            }`}
          >
            {tier.badge && (
              <span
                className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
                  tier.highlighted
                    ? "bg-white text-primary"
                    : "bg-accent text-dark-900"
                }`}
              >
                {tier.badge}
              </span>
            )}

            <h3
              className={`text-lg font-bold mb-1 ${
                tier.highlighted ? "text-white" : "text-dark-900"
              }`}
            >
              {tier.name}
            </h3>

            <div className="mb-4">
              <span
                className={`text-3xl font-bold ${
                  tier.highlighted ? "text-white" : "text-dark-900"
                }`}
              >
                ${price}
              </span>
              <span
                className={`text-sm ${
                  tier.highlighted ? "text-white/80" : "text-dark-500"
                }`}
              >
                {period}
              </span>
            </div>

            <div
              className={`text-sm mb-4 ${
                tier.highlighted ? "text-white/90" : "text-dark-600"
              }`}
            >
              Commission: <strong>{tier.commission}</strong>
            </div>

            <ul className="space-y-2 mb-6">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      tier.highlighted ? "text-white" : "text-secondary"
                    }`}
                  />
                  <span className={tier.highlighted ? "text-white/90" : "text-dark-600"}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelect?.(tier.name)}
              disabled={isCurrent}
              className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                tier.highlighted
                  ? "bg-white text-primary hover:bg-white/90"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {isCurrent ? "Current Plan" : price === 0 ? "Get Started" : "Subscribe"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
