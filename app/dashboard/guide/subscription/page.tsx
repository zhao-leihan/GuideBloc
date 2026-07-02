"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Check, X, Star, Zap, Crown, Sparkles, Loader2 } from "lucide-react";
import { connectWallet } from "@/lib/crypto/payment";
import { CONFIG } from "@/lib/config";
import { ethers } from "ethers";
import toast from "react-hot-toast";

const plans = [
  {
    name: "Free",
    price: 0,
    features: ["Create tours/gigs", "Normal search ranking", "Email support"],
    notIncluded: ["Priority ranking boost", "Featured Gig badge", "Advanced analytics dashboard"],
    icon: Star,
    popular: false,
  },
  {
    name: "Pro",
    price: 10,
    features: ["Priority ranking boost", "Featured Gig badge", "Advanced analytics dashboard", "High profile visibility", "Unlimited gigs", "Priority support"],
    notIncluded: ["Premium placement", "Homepage priority placement"],
    icon: Crown,
    popular: true,
  },
  {
    name: "Elite",
    price: 25,
    features: ["Strong ranking boost", "Featured Gig badge", "Advanced analytics dashboard", "Homepage priority slot", "Premium search placement", "Dedicated account manager", "Highest visibility"],
    notIncluded: [],
    icon: Sparkles,
    popular: false,
  },
];

export default function SubscriptionPage() {
  const { data: session, update: updateSession } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subType, setSubType] = useState("FREE");
  const [subExpiry, setSubExpiry] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      setSubType(user.subscription_type || "FREE");
      if (user.subscription_expiry) {
        setSubExpiry(new Date(user.subscription_expiry).toLocaleDateString());
      }
    }
  }, [session]);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (plan.price === 0) return;
    setLoadingPlan(plan.name);

    try {
      toast.loading("Connecting wallet & switching to Base...");
      const { provider } = await connectWallet("base");
      const signer = await provider.getSigner();

      // USDC ERC20 contract address on Base
      const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
      const USDC_TRANSFER_ABI = [
        "function transfer(address to, uint256 amount) external returns (bool)"
      ];

      const contract = new ethers.Contract(USDC_BASE_ADDRESS, USDC_TRANSFER_ABI, signer);
      const amount = ethers.parseUnits(plan.price.toString(), 6); // USDC uses 6 decimals

      toast.dismiss();
      toast.loading(`Please confirm transaction of ${plan.price} USDC in your wallet...`);
      
      const tx = await contract.transfer(CONFIG.TREASURY_WALLET_ADDRESS, amount);
      const receipt = await tx.wait();

      toast.dismiss();
      toast.loading("Activating your subscription on explomate...");

      const res = await fetch("/api/monetization/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: plan.name.toUpperCase(),
          txHash: receipt.hash,
        }),
      });

      toast.dismiss();
      if (res.ok) {
        const result = await res.json();
        toast.success(`Successfully upgraded to ${plan.name}!`);
        setSubType(result.subscription_type);
        setSubExpiry(new Date(result.subscription_expiry).toLocaleDateString());
        
        // Refresh local NextAuth session
        await updateSession();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to register subscription on backend");
      }
    } catch (error: any) {
      toast.dismiss();
      console.error(error);
      toast.error(error.reason || error.message || "Transaction failed");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <DashboardLayout role="guide">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Subscription Plans</h1>
          <p className="text-dark-500">Upgrade your freelance tier to boost ranking and unlock premium placement.</p>
        </div>

        {/* Current Plan Card */}
        <div className="card p-6 bg-dark-900 text-white flex items-center justify-between border border-dark-800">
          <div>
            <p className="text-xs text-dark-400 uppercase tracking-wide font-semibold">Active Plan</p>
            <h3 className="text-xl font-bold mt-1 flex items-center gap-2">
              {subType} Tier
              {subType !== "FREE" && <span className="inline-block w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />}
            </h3>
            {subType !== "FREE" && subExpiry && (
              <p className="text-sm text-dark-300 mt-1">Renews/Expires on: {subExpiry}</p>
            )}
          </div>
          <div className="text-right">
            <span className="badge badge-primary text-xs px-3 py-1 font-semibold uppercase tracking-wider">
              {subType === "FREE" ? "Standard" : "Boosted"}
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = subType === plan.name.toUpperCase();
            
            return (
              <div
                key={plan.name}
                className={`card p-6 relative flex flex-col justify-between ${
                  plan.popular ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""
                }`}
                style={{ overflow: 'visible' }}
              >
                <div>
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-primary text-white text-xs px-2.5 py-1">
                      Most Popular
                    </span>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    plan.popular ? "bg-primary/10 text-primary" : "bg-dark-100 text-dark-500"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-dark-900 text-lg">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-bold text-dark-900">{plan.price} USDC</span>
                    <span className="text-dark-400 text-sm">/mo</span>
                  </div>
                  
                  <ul className="space-y-3.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-dark-600">
                        <Check className="w-4 h-4 text-secondary flex-shrink-0" /> {f}
                      </li>
                    ))}
                    {plan.notIncluded.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-dark-300">
                        <X className="w-4 h-4 text-dark-300 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrent || plan.price === 0 || loadingPlan !== null}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-dark-100 text-dark-500 cursor-default"
                      : plan.popular
                      ? "btn-primary py-2.5"
                      : "border border-dark-200 text-dark-700 hover:border-primary hover:text-primary"
                  }`}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Paying...
                    </>
                  ) : isCurrent ? (
                    "Active Tier"
                  ) : plan.price === 0 ? (
                    "Included"
                  ) : (
                    `Upgrade (${plan.price} USDC)`
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
