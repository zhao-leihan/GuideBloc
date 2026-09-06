"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  DollarSign, TrendingUp, ExternalLink, ShieldCheck, Lock, CheckCircle2, 
  Lightbulb, LineChart, BarChart3, PieChart as PieIcon, ArrowUpRight, Wallet,
  Zap, AlertTriangle, Coins, ShieldAlert
} from "lucide-react";
import { ClipboardIcon, CardStackIcon, RocketIcon, TokensIcon } from "@radix-ui/react-icons";
import toast from "react-hot-toast";
import { getExplorerTxLink, getExplorerAddressLink } from "@/lib/crypto/networkConfig";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface SourceBreakdown {
  source: string;
  amount: number;
  percent: number;
}

interface MonthlyTrendItem {
  label: string;
  commission: number;
  subscriptions: number;
  boosts: number;
  tips: number;
  total: number;
}

interface FinancialInsights {
  summary: string;
  escrowNote: string;
  payoutNote: string;
}

interface Transaction {
  date: string;
  source: string;
  amount: number;
  hash: string;
  fullHash: string;
  ref: string;
}

interface AdminRevenueData {
  gmv: number;
  grossRevenue: number;
  gasOpEx: number;
  netMargin: number;
  marginPercent: string;
  activeEscrowTVL: number;
  disputeRate: number;
  totalBookings: number;
  disputedOrRefundedCount: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  totalGuidePayouts: number;
  sources: SourceBreakdown[];
  monthlyTrends: MonthlyTrendItem[];
  financialInsights: FinancialInsights;
  transactions: Transaction[];
}

const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function AdminRevenuePage() {
  const [data, setData] = useState<AdminRevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"area" | "bar">("area");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    if (source.includes("Commission")) return "bg-indigo-600";
    if (source.includes("Subscription")) return "bg-emerald-500";
    if (source.includes("Boost")) return "bg-amber-500";
    return "bg-pink-500";
  };

  const pieData = data?.sources
    ?.filter((s) => s.amount > 0)
    ?.map((s) => ({
      name: s.source,
      value: s.amount,
    })) || [];

  const fallbackPie = pieData.length > 0 ? pieData : [{ name: "Awaiting Revenue", value: 1 }];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Financial Analytics & Treasury</h1>
            <p className="text-dark-500 text-sm">
              Live marketplace GMV, protocol treasury earnings, gas operations, and risk metrics (USDC)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Avalanche C-Chain Sync
            </span>
          </div>
        </div>

        {loading || !data ? (
          <div className="card p-16 text-center text-dark-400">
            <div className="inline-block animate-spin mb-3">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-medium">Calculating platform financial metrics...</p>
          </div>
        ) : (
          <>
            {/* 1. Finance for Non-Finance: Executive Insights Box */}
            <div className="card p-6 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/40 border border-indigo-100/80 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-bold text-dark-900 text-base flex items-center gap-2">
                    Executive Financial Summary
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                      Simplified for Admin
                    </span>
                  </h3>
                  <p className="text-sm text-dark-700 leading-relaxed font-medium">
                    {data.financialInsights?.summary}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-dark-600">
                    <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-indigo-100/60">
                      <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{data.financialInsights?.escrowNote}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-indigo-100/60">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{data.financialInsights?.payoutNote}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Four Vital Financial Cards (Marketplace Standard) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: GMV (Gross Merchandise Value) */}
              <div className="card p-5 bg-white border border-dark-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between text-dark-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-dark-500">
                    GMV (Gross Volume)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-dark-900">
                  ${(data.gmv || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-dark-400">USDC</span>
                </p>
                <p className="text-xs text-indigo-600 font-bold mt-2 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Total tourist gross booking volume
                </p>
              </div>

              {/* Card 2: Gross Revenue (Treasury) */}
              <div className="card p-5 bg-white border border-dark-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between text-dark-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-dark-500">
                    Gross Revenue (Treasury)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-dark-900">
                  ${(data.grossRevenue || data.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-dark-400">USDC</span>
                </p>
                <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  10% Take-rate protocol earnings
                </p>
              </div>

              {/* Card 3: Relayer / Gas OpEx */}
              <div className="card p-5 bg-white border border-dark-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between text-dark-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-dark-500">
                    Relayer / Gas OpEx
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-dark-900">
                  ${(data.gasOpEx || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-dark-400">USDC</span>
                </p>
                <p className="text-xs text-amber-700 font-medium mt-2">
                  Subsidized network gas for guides
                </p>
              </div>

              {/* Card 4: Net Platform Margin */}
              <div className="card p-5 bg-white border border-dark-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between text-dark-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-dark-500">
                    Net Platform Margin
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-dark-900">
                  ${(data.netMargin || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-dark-400">USDC</span>
                </p>
                <p className="text-xs text-blue-600 font-bold mt-2">
                  Retained treasury ({data.marginPercent || "100.0"}% margin)
                </p>
              </div>
            </div>

            {/* 3. Operational Risk & Liquidity Indicators (2 Vital Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Risk Card 1: Active Escrow TVL */}
              <div className="card p-5 bg-white border border-amber-200/80 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-dark-600">
                        Active Escrow TVL (Total Value Locked)
                      </span>
                    </div>
                    <p className="text-2xl font-black text-dark-900">
                      ${(data.activeEscrowTVL || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                      <span className="text-sm font-semibold text-dark-400">USDC</span>
                    </p>
                    <p className="text-xs text-dark-600 mt-2 font-medium">
                      Tourist funds currently secured in smart contracts awaiting tour completion.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                    Active TVL
                  </span>
                </div>
              </div>

              {/* Risk Card 2: Dispute / Refund Rate */}
              <div className={`card p-5 bg-white border transition-shadow ${
                (data.disputeRate || 0) > 5 ? "border-red-300" : "border-emerald-200/80"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className={`w-4 h-4 ${(data.disputeRate || 0) > 5 ? "text-red-500" : "text-emerald-600"}`} />
                      <span className="text-xs font-bold uppercase tracking-wider text-dark-600">
                        Dispute & Refund Rate (%)
                      </span>
                    </div>
                    <p className="text-2xl font-black text-dark-900">
                      {data.disputeRate || 0}%{" "}
                      <span className="text-xs font-normal text-dark-400">
                        ({data.disputedOrRefundedCount || 0} of {data.totalBookings || 0} orders)
                      </span>
                    </p>
                    <p className="text-xs text-dark-600 mt-2 font-medium">
                      {(data.disputeRate || 0) <= 5 
                        ? "Platform risk is healthy. Quality of local guides and communication is well maintained."
                        : "Attention recommended: Cancellation/dispute rate exceeds 5% threshold."}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border ${
                    (data.disputeRate || 0) <= 5
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}>
                    {(data.disputeRate || 0) <= 5 ? "Healthy (< 5%)" : "Attention (> 5%)"}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Financial Visual Graphics (Charts) */}
            {mounted && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Monthly Trend Chart */}
                <div className="lg:col-span-2 card p-6 flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-display font-bold text-dark-900 text-base">
                          Platform Revenue Trend
                        </h3>
                      </div>
                      <p className="text-xs text-dark-500 mt-1">
                        Monthly platform earnings from tour escrow commissions & marketplace volume
                      </p>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center bg-dark-100/70 p-1 rounded-xl gap-1">
                      <button
                        onClick={() => setChartMode("area")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          chartMode === "area"
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-dark-500 hover:text-dark-900"
                        }`}
                      >
                        <LineChart className="w-3.5 h-3.5" />
                        Total Inflow
                      </button>
                      <button
                        onClick={() => setChartMode("bar")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          chartMode === "bar"
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-dark-500 hover:text-dark-900"
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        By Service
                      </button>
                    </div>
                  </div>

                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartMode === "area" ? (
                        <AreaChart
                          data={data.monthlyTrends || []}
                          margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="totalRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            tickLine={false}
                            axisLine={{ stroke: "#e2e8f0" }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `$${val}`}
                          />
                          <Tooltip
                            formatter={(val: any) => [`$${Number(val).toLocaleString()} USDC`, "Total Inflow"]}
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              border: "none",
                              borderRadius: "12px",
                              color: "#ffffff",
                              fontSize: "12px",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                            }}
                            itemStyle={{ color: "#38bdf8" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#totalRevenueGradient)"
                          />
                        </AreaChart>
                      ) : (
                        <BarChart
                          data={data.monthlyTrends || []}
                          margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            tickLine={false}
                            axisLine={{ stroke: "#e2e8f0" }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `$${val}`}
                          />
                          <Tooltip
                            formatter={(val: any, name: any) => [`$${Number(val).toLocaleString()} USDC`, name]}
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              border: "none",
                              borderRadius: "12px",
                              color: "#ffffff",
                              fontSize: "12px",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                            }}
                          />
                          <Legend
                            verticalAlign="top"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: "11px" }}
                          />
                          <Bar dataKey="commission" name="Commission (10%)" fill="#4f46e5" stackId="a" />
                          <Bar dataKey="subscriptions" name="Subscriptions" fill="#10b981" stackId="a" />
                          <Bar dataKey="boosts" name="Gig Boosts" fill="#f59e0b" stackId="a" />
                          <Bar dataKey="tips" name="Tips" fill="#ec4899" stackId="a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right: Revenue Distribution Donut */}
                <div className="card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <PieIcon className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-display font-bold text-dark-900 text-base">
                        Income Streams
                      </h3>
                    </div>
                    <p className="text-xs text-dark-500">
                      Percentage contribution by service channel
                    </p>
                  </div>

                  <div className="h-[210px] w-full relative flex items-center justify-center my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={fallbackPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {fallbackPie.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: any, name: any) => [
                            pieData.length > 0 ? `$${Number(val).toLocaleString()} USDC` : "No Data Yet",
                            name,
                          ]}
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "10px",
                            color: "#ffffff",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] uppercase font-bold text-dark-400 tracking-wider">
                        Streams
                      </span>
                      <span className="text-lg font-extrabold text-dark-900">
                        {pieData.length}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Legend List */}
                  <div className="space-y-2 border-t border-dark-100 pt-3">
                    {data.sources.length === 0 ? (
                      <p className="text-xs text-dark-400 text-center py-2">
                        No revenue stream data available yet.
                      </p>
                    ) : (
                      data.sources.map((item, idx) => (
                        <div key={item.source} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                            />
                            <span className="text-dark-600 font-medium">{item.source}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-dark-900">${item.amount.toLocaleString()}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-dark-100 text-dark-600">
                              {item.percent}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Detailed Revenue by Source List */}
            <div className="card p-6">
              <h3 className="font-display font-semibold text-dark-900 mb-6">Revenue by Source Details</h3>
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
                            <span className="font-bold text-dark-900">${item.amount.toLocaleString()} USDC ({item.percent}%)</span>
                          </div>
                          <div className="h-2.5 bg-dark-100 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${item.percent}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 6. Recent Transactions Table */}
            <div className="card p-6">
              <h3 className="font-display font-semibold text-dark-900 mb-4">Recent Inflow Transactions</h3>
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
                        <td colSpan={5} className="py-6 text-center text-sm text-dark-400">No revenue transactions recorded yet.</td>
                      </tr>
                    ) : (
                      data.transactions.map((tx, i) => (
                        <tr key={i} className="text-sm">
                          <td className="py-3 text-dark-600">{tx.date}</td>
                          <td className="py-3">
                            <span className="badge badge-primary text-xs capitalize">{tx.source}</span>
                          </td>
                          <td className="py-3 font-medium text-dark-900">${tx.amount.toLocaleString()} USDC</td>
                          <td className="py-3">
                            {tx.fullHash ? (
                              <a 
                                href={getExplorerTxLink(tx.fullHash)} 
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
                          <td className="py-3 text-dark-500 font-mono text-xs">{tx.ref}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7. Platform Treasury Wallet Card */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-indigo-600" />
                <h3 className="font-display font-semibold text-dark-900">Platform Treasury Destination</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-dark-50 rounded-xl">
                  <p className="text-xs text-dark-400 mb-1">Official Treasury Address (Avalanche C-Chain Mainnet)</p>
                  <a
                    href={getExplorerAddressLink("0x079D9c349741C27565ee04e31E4174F640F512aE")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold break-all"
                  >
                    0x079D9c349741C27565ee04e31E4174F640F512aE <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
                <div className="p-4 bg-dark-50 rounded-xl">
                  <p className="text-xs text-dark-400 mb-1">Accumulated Realized Platform Revenue</p>
                  <p className="font-bold text-dark-900 text-lg">
                    ${(data.grossRevenue || data.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
