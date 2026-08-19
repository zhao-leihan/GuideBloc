"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Check,
  X,
  Loader2,
  ShieldCheck,
  TrendingUp,
  LayoutGrid,
  HeadphonesIcon,
  Award,
  AlertCircle,
} from "lucide-react";
import PaymentModal from "@/components/payment/PaymentModal";
import toast from "react-hot-toast";

const PRO_PRICE = 9.99;

const PRO_FEATURES = [
  "Priority ranking in search results",
  "Featured badge on all gig listings",
  "High-visibility profile placement",
  "Advanced discoverability score boost",
  "Priority support channel",
];

const FREE_LIMITATIONS = [
  "Normal search ranking",
  "No featured badge",
  "Standard profile visibility",
];

export default function SubscriptionPage() {
  const { data: session, update: updateSession } = useSession();
  const [subType, setSubType] = useState("FREE");
  const [subExpiry, setSubExpiry] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      setSubType(user.subscription_type || "FREE");
      if (user.subscription_expiry) {
        setSubExpiry(
          new Date(user.subscription_expiry).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
      }
    }
  }, [session]);

  // Called by PaymentModal after on-chain tx confirmed
  const handlePaymentConfirmed = async (txHash: string) => {
    setPendingTxHash(txHash);
    setShowPayModal(false);
    setActivating(true);

    try {
      const res = await fetch("/api/monetization/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "PRO", txHash }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success("Pro subscription activated.");
        setSubType(result.subscription_type);
        setSubExpiry(
          new Date(result.subscription_expiry).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
        await updateSession();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to activate subscription on backend");
      }
    } catch (e: any) {
      toast.error("Network error activating subscription");
    } finally {
      setActivating(false);
    }
  };

  const isPro = subType === "PRO" || subType === "ELITE";

  return (
    <DashboardLayout role="guide">
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Subscription</h1>
          <p className="text-dark-500 mt-1">
            Increase your visibility and attract more bookings with the Pro plan.
          </p>
        </div>

        {/* Current Status Card */}
        <div className="card p-6 bg-dark-900 text-white border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-widest font-semibold mb-1">
                Active Plan
              </p>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold">
                  {isPro ? "Pro" : "Free"} Plan
                </h2>
                {isPro && (
                  <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse" />
                )}
              </div>
              {isPro && subExpiry && (
                <p className="text-sm text-dark-300 mt-1">Renews {subExpiry}</p>
              )}
              {!isPro && (
                <p className="text-sm text-dark-400 mt-1">
                  Upgrade to boost your ranking and get more visibility.
                </p>
              )}
            </div>
            <span
              className={`badge text-xs px-3 py-1.5 font-semibold uppercase tracking-wider ${
                isPro ? "badge-secondary" : "bg-dark-700 text-dark-300"
              }`}
            >
              {isPro ? "Active" : "Standard"}
            </span>
          </div>
        </div>

        {/* Plans comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Free Plan */}
          <div className="card p-6 flex flex-col border border-dark-100">
            <div className="mb-4">
              <p className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">
                Free
              </p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-dark-900">$0</span>
                <span className="text-dark-400 text-sm pb-1">/mo</span>
              </div>
            </div>
            <ul className="space-y-2.5 flex-1">
              {FREE_LIMITATIONS.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-dark-400">
                  <X className="w-4 h-4 text-dark-300 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold bg-dark-100 text-dark-400 cursor-default"
            >
              {isPro ? "Downgraded Plan" : "Current Plan"}
            </button>
          </div>

          {/* Pro Plan */}
          <div
            className="card p-6 flex flex-col relative ring-2 ring-primary shadow-lg shadow-primary/10"
            style={{ overflow: "visible" }}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-primary text-white text-xs px-3 py-1 font-bold">
              Recommended
            </span>
            <div className="mb-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Pro
              </p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-dark-900">
                  ${PRO_PRICE}
                </span>
                <span className="text-dark-400 text-sm pb-1">/mo</span>
              </div>
              <p className="text-xs text-dark-400 mt-1">Paid in USDC</p>
            </div>
            <ul className="space-y-2.5 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-dark-700">
                  <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            {activating ? (
              <button
                disabled
                className="mt-5 btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Activating...
              </button>
            ) : isPro ? (
              <button
                disabled
                className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold bg-secondary/10 text-secondary cursor-default border border-secondary/20"
              >
                Active — Renews {subExpiry}
              </button>
            ) : (
              <button
                onClick={() => setShowPayModal(true)}
                className="mt-5 btn-primary w-full py-2.5 text-sm font-semibold cursor-pointer"
              >
                Upgrade for ${PRO_PRICE} USDC
              </button>
            )}
          </div>
        </div>

        {/* What happens when you upgrade */}
        {!isPro && (
          <div className="card p-6 border border-dark-100">
            <h3 className="font-semibold text-dark-900 mb-4 text-sm">
              How the Pro boost works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: TrendingUp,
                  label: "Search Priority",
                  desc: "Your gigs appear higher in explore and search results automatically.",
                },
                {
                  icon: Award,
                  label: "Featured Badge",
                  desc: "A visible Pro badge appears on all your tour listings.",
                },
                {
                  icon: LayoutGrid,
                  label: "Discoverability Score",
                  desc: "Your ranking score increases immediately upon activation.",
                },
                {
                  icon: HeadphonesIcon,
                  label: "Priority Support",
                  desc: "Faster response times from the Explomate support team.",
                },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark-900">{label}</p>
                    <p className="text-xs text-dark-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending tx confirmation notice */}
        {pendingTxHash && !activating && (
          <div className="card p-4 border border-secondary/20 bg-secondary/5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-dark-900">
                Payment confirmed on-chain
              </p>
              <p className="text-xs text-dark-500 mt-0.5 font-mono break-all">
                {pendingTxHash}
              </p>
            </div>
          </div>
        )}

        {/* Security note */}
        <div className="flex items-start gap-2 text-xs text-dark-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Payment is processed directly on-chain via your Web3 wallet. No
            card or fiat required. Subscription activates immediately after
            on-chain confirmation.
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        amount={PRO_PRICE}
        token="USDC"
        gigTitle="Pro Guide Subscription — 30 Days"
        bookingDate={new Date().toISOString().slice(0, 10)}
        bookingId={`SUB_${(session?.user as any)?.id?.slice(-6) || "GUIDE"}`}
        onConfirm={handlePaymentConfirmed}
      />
    </DashboardLayout>
  );
}
