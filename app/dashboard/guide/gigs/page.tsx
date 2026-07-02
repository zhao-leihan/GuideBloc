"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { PlusCircle, Eye, Rocket, Loader2, Award, Trash2 } from "lucide-react";
import { connectWallet } from "@/lib/crypto/payment";
import { CONFIG } from "@/lib/config";
import { ethers } from "ethers";
import toast from "react-hot-toast";

export default function GuideGigsPage() {
  const { data: session } = useSession();
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [boostingId, setBoostingId] = useState<string | null>(null);

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

  const handleDelete = async (gigId: string) => {
    if (!window.confirm("Are you sure you want to delete this tour gig? This action cannot be undone.")) return;

    try {
      toast.loading("Deleting gig...");
      const res = await fetch(`/api/gigs/${gigId}`, {
        method: "DELETE",
      });

      toast.dismiss();
      if (res.ok) {
        toast.success("Gig deleted successfully!");
        fetchGigs();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete gig");
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Error deleting gig");
    }
  };

  const handleBoost = async (gigId: string) => {
    setBoostingId(gigId);
    try {
      toast.loading("Connecting wallet & switching to Base...");
      const { provider } = await connectWallet("base");
      const signer = await provider.getSigner();

      // USDC ERC20 address on Base
      const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
      const USDC_TRANSFER_ABI = [
        "function transfer(address to, uint256 amount) external returns (bool)"
      ];

      const contract = new ethers.Contract(USDC_BASE_ADDRESS, USDC_TRANSFER_ABI, signer);
      const amount = ethers.parseUnits(CONFIG.FEATURED_GIG_PRICE.toString(), 6); // USDC uses 6 decimals

      toast.dismiss();
      toast.loading(`Please confirm payment of ${CONFIG.FEATURED_GIG_PRICE} USDC in your wallet...`);

      const tx = await contract.transfer(CONFIG.TREASURY_WALLET_ADDRESS, amount);
      const receipt = await tx.wait();

      toast.dismiss();
      toast.loading("Boosting your gig...");

      const res = await fetch("/api/monetization/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigId,
          txHash: receipt.hash,
        }),
      });

      toast.dismiss();
      if (res.ok) {
        toast.success("Gig successfully boosted to Featured (7 Days)!");
        fetchGigs();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Failed to register boost on backend");
      }
    } catch (error: any) {
      toast.dismiss();
      console.error(error);
      toast.error(error.reason || error.message || "Boost transaction failed");
    } finally {
      setBoostingId(null);
    }
  };

  return (
    <DashboardLayout role="guide">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">My Gigs</h1>
            <p className="text-dark-500">Manage your tour listings and active ranking boosts</p>
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
              You haven&apos;t created any gigs yet.{" "}
              <Link href="/dashboard/guide/gigs/create" className="text-primary font-medium hover:underline">
                Create one now!
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-50 border-b border-dark-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Tour</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Expected Earnings</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Customer Price</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Discoverability Score</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Featured Boost</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-100">
                  {gigs.map((gig) => {
                    const isFeatured = gig.featured_until ? new Date(gig.featured_until) > new Date() : false;
                    const featuredExpiry = gig.featured_until ? new Date(gig.featured_until).toLocaleDateString() : null;

                    return (
                      <tr key={gig.id} className="hover:bg-dark-50/50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-dark-900 text-sm">{gig.title}</p>
                          <p className="text-xs text-dark-400">{gig.location}, {gig.country}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="badge badge-primary text-xs capitalize">{gig.category}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-dark-700 font-semibold text-secondary">
                          {(gig.guide_price || gig.priceUSD * 0.90).toFixed(2)} USDC
                        </td>
                        <td className="px-6 py-4 text-sm text-dark-800 font-semibold">
                          {(gig.client_price || gig.priceUSD).toFixed(2)} USDC
                        </td>
                        <td className="px-6 py-4 text-sm text-dark-700">
                          {(gig.ranking_score || 0).toFixed(2)} pts
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {isFeatured ? (
                            <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-600 px-2.5 py-1 rounded-lg text-xs font-semibold">
                              <Award className="w-3.5 h-3.5" /> Featured (Expires {featuredExpiry})
                            </span>
                          ) : (
                            <span className="text-dark-400 text-xs">Not Featured</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/explore`} className="btn-ghost text-xs p-1.5" title="View in Explore">
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(gig.id)}
                              className="btn-ghost text-xs p-1.5 text-danger hover:bg-danger/10 rounded-lg cursor-pointer"
                              title="Delete Gig"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {!isFeatured && (
                              <button
                                onClick={() => handleBoost(gig.id)}
                                disabled={boostingId !== null}
                                className="btn-ghost text-xs px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-600 text-purple-600 hover:text-white rounded-lg flex items-center gap-1 font-semibold"
                                title={`Boost ranking with ${CONFIG.FEATURED_GIG_PRICE} USDC for 7 Days`}
                              >
                                {boostingId === gig.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Rocket className="w-3.5 h-3.5" />
                                )}
                                Boost Featured
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
      </div>
    </DashboardLayout>
  );
}
