"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DollarSign, TrendingUp, ExternalLink } from "lucide-react";
import { ClipboardIcon, CardStackIcon, RocketIcon, TokensIcon } from "@radix-ui/react-icons";
import toast from "react-hot-toast";

interface SourceBreakdown {
  source: string;
  amount: number;
  percent: number;
}

interface Transaction {
  date: string;
  source: string;
  amount: number;
  hash: string;
  fullHash: string;
  ref: string;
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<{
    totalRevenue: number;
    thisMonthRevenue: number;
    sources: SourceBreakdown[];
    transactions: Transaction[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      const res = await fetch("/api/admin/revenue");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error("Failed to load revenue data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading revenue data");
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    if (source.includes("Commission")) return ClipboardIcon;
    if (source.includes("Subscription")) return CardStackIcon;
    if (source.includes("Boost")) return RocketIcon;
    return TokensIcon;
  };

  const getSourceColor = (source: string) => {
    if (source.includes("Commission")) return "bg-primary";
    if (source.includes("Subscription")) return "bg-secondary";
    if (source.includes("Boost")) return "bg-accent";
    return "bg-purple-500";
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Revenue Dashboard</h1>
          <p className="text-dark-500">Complete platform revenue breakdown (live database data)</p>
        </div>

        {loading || !data ? (
          <div className="p-12 text-center text-dark-500">Loading revenue metrics...</div>
        ) : (
          <>
            {/* KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Revenue (All Time)", value: `${data.totalRevenue.toLocaleString()} USDT`, change: "Total accumulated" },
                { label: "This Month", value: `${data.thisMonthRevenue.toLocaleString()} USDT`, change: "Current billing cycle" },
                { label: "Platform Wallet (Treasury)", value: `${data.totalRevenue.toLocaleString()} USDT`, change: "Polygon Network" },
              ].map((stat) => (
                <div key={stat.label} className="card p-5">
                  <DollarSign className="w-5 h-5 text-secondary mb-2" />
                  <p className="text-2xl font-bold text-dark-900">{stat.value}</p>
                  <p className="text-xs text-dark-400 mt-1">{stat.change}</p>
                  <p className="text-sm text-dark-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Revenue Sources */}
            <div className="card p-6">
              <h3 className="font-display font-semibold text-dark-900 mb-6">Revenue by Source</h3>
              <div className="space-y-4">
                {data.sources.length === 0 ? (
                  <p className="text-sm text-dark-400">No revenue breakdown available.</p>
                ) : (
                  data.sources.map((item) => {
                    const Icon = getSourceIcon(item.source);
                    const color = getSourceColor(item.source);
                    return (
                      <div key={item.source} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-dark-50 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-dark-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-dark-700">{item.source}</span>
                            <span className="font-bold text-dark-900">${item.amount.toLocaleString()} USDT ({item.percent}%)</span>
                          </div>
                          <div className="h-3 bg-dark-100 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${item.percent}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="card p-6">
              <h3 className="font-display font-semibold text-dark-900 mb-4">Recent Revenue Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-200">
                    <tr>
                      <th className="text-left text-xs font-medium text-dark-500 py-2">Date</th>
                      <th className="text-left text-xs font-medium text-dark-500 py-2">Source</th>
                      <th className="text-left text-xs font-medium text-dark-500 py-2">Amount</th>
                      <th className="text-left text-xs font-medium text-dark-500 py-2">Tx Hash</th>
                      <th className="text-left text-xs font-medium text-dark-500 py-2">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100">
                    {data.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-sm text-dark-400">No revenue transactions recorded.</td>
                      </tr>
                    ) : (
                      data.transactions.map((tx, i) => (
                        <tr key={i} className="text-sm">
                          <td className="py-3 text-dark-600">{tx.date}</td>
                          <td className="py-3">
                            <span className="badge badge-primary text-xs capitalize">{tx.source}</span>
                          </td>
                          <td className="py-3 font-medium text-dark-900">{tx.amount.toLocaleString()} USDT</td>
                          <td className="py-3">
                            {tx.fullHash ? (
                              <a 
                                href={`https://polygonscan.com/tx/${tx.fullHash}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-mono text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                {tx.hash} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-dark-400">N/A</span>
                            )}
                          </td>
                          <td className="py-3 text-dark-500">{tx.ref}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="card p-6">
              <h3 className="font-display font-semibold text-dark-900 mb-3">Platform Treasury</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-dark-50 rounded-xl">
                  <p className="text-xs text-dark-400">Treasury Address</p>
                  <p className="font-mono text-sm text-dark-900">0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</p>
                </div>
                <div className="p-4 bg-dark-50 rounded-xl">
                  <p className="text-xs text-dark-400">Accumulated Earnings (Locked & Claimed)</p>
                  <p className="font-bold text-dark-900">{data.totalRevenue.toLocaleString()} USDT</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
