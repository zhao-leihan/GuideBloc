"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency } from "@/lib/utils";
import { Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2, History, AlertCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

type Transaction = {
  id: string;
  title: string;
  amount: string;
  status: string;
  rawStatus?: string;
  createdAt: string;
  expiresAt?: string;
};

function formatRemainingTime(expiresAt?: string, createdAt?: string): string {
  const target = expiresAt
    ? new Date(expiresAt).getTime()
    : createdAt
    ? new Date(createdAt).getTime() + 24 * 60 * 60 * 1000
    : 0;

  if (!target) return "";
  const diff = target - Date.now();
  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${mins}m left`;
  }
  return `${mins}m left`;
}

type GuideStats = {
  totalEarnings: number;
  pendingRelease: number;
  recentTransactions: Transaction[];
};

export default function GuideEarningsPage() {
  const [stats, setStats] = useState<GuideStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/guide/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        toast.error("Failed to load earnings stats");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading earnings data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="guide">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Earnings & Payouts</h1>
          <p className="text-dark-500">Track your automated payouts directly to your Web3 Wallet.</p>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-dark-500">Loading earnings information...</div>
        ) : !stats ? (
          <div className="card p-8 text-center text-dark-500 flex items-center gap-2 justify-center">
            <AlertCircle className="w-5 h-5 text-danger" /> Failed to load earnings data.
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="card p-6 bg-primary text-white border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Wallet className="w-16 h-16" />
                </div>
                <div className="relative z-10">
                  <p className="text-primary-100 font-medium mb-1">Total Earned (Lifetime)</p>
                  <h2 className="text-3xl font-bold">{formatCurrency(stats.totalEarnings)}</h2>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-dark-500 font-medium mb-1">Pending Balance</p>
                    <h2 className="text-3xl font-bold text-dark-900">{formatCurrency(stats.pendingRelease)}</h2>
                  </div>
                  <div className="p-2 bg-dark-50 rounded-lg">
                    <ArrowDownRight className="w-6 h-6 text-dark-400" />
                  </div>
                </div>
                <p className="text-sm text-dark-400 mt-4">Funds automatically transfer upon completion.</p>
              </div>

              <div className="card p-6 border-secondary/30 bg-secondary/5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-dark-500 font-medium mb-1">Platform Commission</p>
                    <h2 className="text-2xl font-bold text-dark-900">10%</h2>
                  </div>
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-secondary" />
                  </div>
                </div>
                <p className="text-sm text-dark-600 mt-4">Highly competitive rate.</p>
              </div>
            </div>

            {/* Automated Payout History */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-dark-500" />
                <h2 className="text-lg font-bold text-dark-900">Automated Payout History</h2>
              </div>
              
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-dark-50 text-dark-500 font-medium">
                      <tr>
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Tour</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-right">Fee (10%)</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100">
                      {stats.recentTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-dark-400 bg-white">
                            No transactions or payouts recorded yet.
                          </td>
                        </tr>
                      ) : (
                        stats.recentTransactions.map((tx) => {
                          const amountVal = parseFloat(tx.amount.replace(/[^0-9.-]+/g,""));
                          const guideAmount = amountVal * 0.90;
                          const feeAmount = amountVal * 0.10;

                          return (
                            <tr key={tx.id} className="hover:bg-dark-50/50 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs text-dark-500 break-all max-w-[200px]">
                                {tx.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-dark-700">
                                {new Date(tx.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric"
                                })}
                              </td>
                              <td className="px-6 py-4 text-dark-900 font-medium">{tx.title}</td>
                              <td className="px-6 py-4 text-right font-bold text-secondary">
                                {formatCurrency(guideAmount)}
                              </td>
                              <td className="px-6 py-4 text-right text-dark-400">
                                {formatCurrency(feeAmount)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 items-start">
                                  <span className={`badge ${
                                    tx.status === "Released" ? "badge-secondary" : "bg-yellow-500/10 text-yellow-600"
                                  }`}>
                                    {tx.status === "Released" ? "PAID" : "PENDING"}
                                  </span>
                                  {tx.status !== "Released" && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                                      {formatRemainingTime(tx.expiresAt, tx.createdAt)}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
