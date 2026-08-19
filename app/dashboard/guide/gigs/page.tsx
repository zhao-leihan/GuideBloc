"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  PlusCircle,
  Eye,
  Rocket,
  Loader2,
  Award,
  Trash2,
  X,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import PaymentModal from "@/components/payment/PaymentModal";
import toast from "react-hot-toast";
import { CONFIG } from "@/lib/config";

const BOOST_PRICE = CONFIG.FEATURED_GIG_PRICE; // $1

export default function GuideGigsPage() {
  const { data: session } = useSession();
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Boost modal state
  const [boostTargetGig, setBoostTargetGig] = useState<{ id: string; title: string } | null>(null);
  const [activatingBoost, setActivatingBoost] = useState(false);

  // Delete confirm state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchGigs();
    }
  }, [session]);

  const fetchGigs = async () => {
    try {
      const user = session?.user as any;
      const res = await fetch(`/api/gigs?guideId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setGigs((data.gigs || []).filter((g: any) => g.isActive));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load gigs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/gigs/${deleteTargetId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Gig deleted.");
        setDeleteTargetId(null);
        fetchGigs();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete gig");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting gig");
    } finally {
      setDeleting(false);
    }
  };

  // Called by PaymentModal once on-chain tx confirmed
  const handleBoostPaymentConfirmed = async (txHash: string) => {
    if (!boostTargetGig) return;
    setActivatingBoost(true);

    try {
      const res = await fetch("/api/monetization/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId: boostTargetGig.id, txHash }),
      });

      if (res.ok) {
        toast.success("Gig boosted to Featured for 7 days.");
        setBoostTargetGig(null);
        fetchGigs();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to activate boost on backend");
      }
    } catch (e) {
      toast.error("Network error activating boost");
    } finally {
      setActivatingBoost(false);
    }
  };

  return (
    <DashboardLayout role="guide">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">My Gigs</h1>
            <p className="text-dark-500">Manage your tour listings and ranking boosts</p>
          </div>
          <Link href="/dashboard/guide/gigs/create" className="btn-primary flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Create Gig
          </Link>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-dark-500">Loading gigs...</div>
          ) : gigs.length === 0 ? (
            <div className="p-8 text-center text-dark-500">
              No active gigs yet.{" "}
              <Link href="/dashboard/guide/gigs/create" className="text-primary font-medium hover:underline">
                Create one now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-50 border-b border-dark-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Tour</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Your Earnings</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Tourist Price</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Score</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Boost Status</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-100">
                  {gigs.map((gig) => {
                    const isFeatured = gig.featured_until
                      ? new Date(gig.featured_until) > new Date()
                      : false;
                    const featuredExpiry = gig.featured_until
                      ? new Date(gig.featured_until).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : null;

                    return (
                      <tr key={gig.id} className="hover:bg-dark-50/50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-dark-900 text-sm">{gig.title}</p>
                          <p className="text-xs text-dark-400 mt-0.5">
                            {gig.location}, {gig.country}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="badge badge-primary text-xs capitalize">
                            {gig.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-secondary">
                          {(gig.guide_price || gig.priceUSD * 0.9).toFixed(2)} USDC
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-dark-800">
                          {(gig.client_price || gig.priceUSD).toFixed(2)} USDC
                        </td>
                        <td className="px-6 py-4 text-sm text-dark-500">
                          {(gig.ranking_score || 0).toFixed(1)} pts
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {isFeatured ? (
                            <span className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-600 px-2.5 py-1 rounded-lg text-xs font-semibold">
                              <Award className="w-3.5 h-3.5" />
                              Featured — until {featuredExpiry}
                            </span>
                          ) : (
                            <span className="text-dark-400 text-xs">Not featured</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href="/explore"
                              className="btn-ghost text-xs p-1.5"
                              title="View in Explore"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteTargetId(gig.id)}
                              className="btn-ghost text-xs p-1.5 text-danger hover:bg-danger/10 rounded-lg cursor-pointer"
                              title="Delete Gig"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {!isFeatured && (
                              <button
                                onClick={() =>
                                  setBoostTargetGig({ id: gig.id, title: gig.title })
                                }
                                className="btn-ghost text-xs px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-600 text-purple-600 hover:text-white rounded-lg flex items-center gap-1.5 font-semibold transition-all cursor-pointer"
                                title={`Boost for $${BOOST_PRICE} USDC`}
                              >
                                <Rocket className="w-3.5 h-3.5" />
                                Boost
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Boost info row */}
        <div className="flex items-start gap-2 text-xs text-dark-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Boosting a gig costs <strong className="text-dark-600">$1 USDC</strong> and places
            it in a featured position for <strong className="text-dark-600">7 days</strong>.
            Payment is on-chain via your Web3 wallet.
          </p>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-dark-900">Delete Gig</h3>
              <button
                onClick={() => setDeleteTargetId(null)}
                className="p-1 text-dark-400 hover:text-dark-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-dark-600 mb-5">
              This action is permanent and cannot be undone. All booking history for
              this gig will remain in the system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2.5 border border-dark-200 rounded-xl text-sm font-semibold text-dark-700 hover:bg-dark-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boost activating overlay */}
      {activatingBoost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="font-semibold text-dark-900 text-sm">Activating boost...</p>
            <p className="text-xs text-dark-400 mt-1">Recording on backend</p>
          </div>
        </div>
      )}

      {/* Boost success notice */}
      {!activatingBoost && boostTargetGig === null && (
        <></>
      )}

      {/* Boost Payment Modal */}
      {boostTargetGig && !activatingBoost && (
        <PaymentModal
          isOpen={true}
          onClose={() => setBoostTargetGig(null)}
          amount={BOOST_PRICE}
          token="USDC"
          gigTitle={`Gig Boost — ${boostTargetGig.title}`}
          bookingDate={new Date().toISOString().slice(0, 10)}
          bookingId={`BOOST_${boostTargetGig.id.slice(-6)}`}
          onConfirm={handleBoostPaymentConfirmed}
        />
      )}
    </DashboardLayout>
  );
}
