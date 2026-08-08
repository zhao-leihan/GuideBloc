"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  DollarSign, Calendar, TrendingUp, PlusCircle,
  Users, Star, BarChart3, Clock, AlertCircle, Trophy, Award, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import Leaderboard from "@/components/gamification/Leaderboard";
import Inbox from "@/components/gamification/Inbox";

type UpcomingTour = {
  id: string;
  title: string;
  date: string;
  guests: number;
  status: string;
};

type RecentTx = {
  id: string;
  title: string;
  amount: string;
  status: string;
};

type GuideStats = {
  totalEarnings: number;
  pendingRelease: number;
  activeBookingsCount: number;
  avgRating: string;
  reviewCount: number;
  upcomingTours: UpcomingTour[];
  recentTransactions: RecentTx[];
};

export default function GuideOverviewPage() {
  const [stats, setStats] = useState<GuideStats | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "inbox" | "leaderboard">("overview");

  useEffect(() => {
    fetchStats();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/users/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/guide/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        toast.error("Failed to load dashboard statistics");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="guide">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Dashboard Overview</h1>
            <p className="text-dark-500">Welcome back! Here&apos;s your performance summary.</p>
          </div>
          <Link href="/dashboard/guide/gigs/create" className="btn-primary flex items-center gap-2 cursor-pointer">
            <PlusCircle className="w-4 h-4" /> New Gig
          </Link>
        </div>

        {/* Gamification Level Progress Banner */}
        {profile && (
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0 animate-pulse">
                Lvl {profile.level || 1}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-dark-900 text-sm flex items-center gap-1.5">
                  Tour Guide Level Achievement
                  <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold">
                    <Sparkles className="w-3 h-3 text-secondary inline-block" /> Boost Active
                  </span>
                </h4>
                <p className="text-xs text-dark-500">Earn XP by completing tours. Higher levels boost listing search priority!</p>
              </div>
            </div>
            
            <div className="w-full sm:w-64 space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-dark-700">
                <span>{(profile.xp || 0) % 1000} / 1000 XP</span>
                <span className="text-primary">Level {(profile.level || 1) + 1}</span>
              </div>
              <div className="w-full bg-dark-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-700" 
                  style={{ width: `${((profile.xp || 0) % 1000) / 10}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-dark-100 dark:bg-dark-900 dark:border dark:border-dark-800 rounded-xl max-w-[420px] shadow-inner">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "overview" ? "bg-white text-dark-900 dark:bg-primary dark:text-white shadow-sm" : "text-dark-500 hover:text-dark-900 dark:text-dark-400 dark:hover:text-white"
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "inbox" ? "bg-white text-dark-900 dark:bg-primary dark:text-white shadow-sm" : "text-dark-500 hover:text-dark-900 dark:text-dark-400 dark:hover:text-white"
            }`}
          >
            System Mail
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "leaderboard" ? "bg-white text-dark-900 dark:bg-primary dark:text-white shadow-sm" : "text-dark-500 hover:text-dark-900 dark:text-dark-400 dark:hover:text-white"
            }`}
          >
            Leaderboard
          </button>
        </div>

        {/* Tab Content Rendering */}
        {activeTab === "overview" && (
          <>
            {loading ? (
              <div className="card p-12 text-center text-dark-500">Loading statistics...</div>
            ) : !stats ? (
              <div className="card p-8 text-center text-dark-500 flex items-center gap-2 justify-center">
                <AlertCircle className="w-5 h-5 text-danger" /> Failed to load statistics.
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Earnings"
                    value={`$${stats.totalEarnings.toFixed(2)}`}
                    subtitle="USDT (Lifetime)"
                    change="Calculated"
                    positive
                    icon={DollarSign}
                    color="bg-secondary/10 text-secondary"
                  />
                  <StatCard
                    title="Pending Release"
                    value={`$${stats.pendingRelease.toFixed(2)}`}
                    subtitle="USDT"
                    change="Awaiting tour"
                    positive={false}
                    icon={TrendingUp}
                    color="bg-primary/10 text-primary"
                  />
                  <StatCard
                    title="Active Bookings"
                    value={stats.activeBookingsCount.toString()}
                    subtitle="Tours remaining"
                    change="Live count"
                    positive
                    icon={Calendar}
                    color="bg-accent/10 text-accent"
                  />
                  <StatCard
                    title="Average Rating"
                    value={stats.avgRating}
                    subtitle={`${stats.reviewCount} review(s)`}
                    change="Lifetime"
                    positive
                    icon={Star}
                    color="bg-purple-500/10 text-purple-500"
                  />
                </div>

                {/* Quick Actions + Recent */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upcoming Bookings */}
                  <div className="card p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-dark-900 mb-4">Upcoming Tours</h3>
                      {stats.upcomingTours.length === 0 ? (
                        <div className="p-8 text-center text-sm text-dark-400 bg-dark-50/50 rounded-xl border border-dashed border-dark-200">
                          No upcoming tours scheduled.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {stats.upcomingTours.map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-50 border border-dark-100">
                              <div>
                                <p className="font-medium text-dark-900 text-sm">{booking.title}</p>
                                <p className="text-xs text-dark-500">{booking.date} · {booking.guests} guest(s)</p>
                              </div>
                              <span className={`badge text-xs ${
                                booking.status === "CONFIRMED" ? "bg-blue-500/10 text-blue-600" : "bg-yellow-500/10 text-yellow-600"
                              }`}>
                                {booking.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link href="/dashboard/guide/bookings" className="block text-center text-sm text-primary font-medium mt-4 hover:underline">
                      View all bookings →
                    </Link>
                  </div>

                  {/* Recent Transactions */}
                  <div className="card p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-dark-900 mb-4">Recent Transactions</h3>
                      {stats.recentTransactions.length === 0 ? (
                        <div className="p-8 text-center text-sm text-dark-400 bg-dark-50/50 rounded-xl border border-dashed border-dark-200">
                          No recent transaction payouts.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {stats.recentTransactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-50 border border-dark-100">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  tx.status === "Released" ? "bg-secondary/10" : "bg-yellow-500/10"
                                }`}>
                                  <TrendingUp className={`w-4 h-4 ${
                                    tx.status === "Released" ? "text-secondary" : "text-yellow-600"
                                  }`} />
                                </div>
                                <div>
                                  <p className="font-medium text-dark-900 text-sm">{tx.title}</p>
                                  <p className="text-xs text-dark-500">{tx.status}</p>
                                </div>
                              </div>
                              <span className="font-medium text-sm text-dark-900">{tx.amount}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link href="/dashboard/guide/earnings" className="block text-center text-sm text-primary font-medium mt-4 hover:underline">
                      View earnings →
                    </Link>
                  </div>
                </div>

                {/* Earnings Chart */}
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-dark-900 mb-4">Monthly Earnings</h3>
                  <div className="h-64 flex items-center justify-center bg-dark-50 rounded-xl border border-dark-100">
                    <div className="text-center">
                      <BarChart3 className="w-10 h-10 text-dark-300 mx-auto mb-2" />
                      <p className="text-dark-500 text-sm">Monthly chart will update dynamically based on completed bookings</p>
                      <p className="text-xs text-dark-400 mt-1">Lifetime total: ${stats.totalEarnings.toFixed(2)} USDT</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "inbox" && <Inbox />}
        {activeTab === "leaderboard" && <Leaderboard />}
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  change,
  positive,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  change: string;
  positive: boolean;
  icon: any;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-xs font-medium ${positive ? "text-secondary" : "text-dark-400"}`}>
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-dark-900">{value}</p>
      <p className="text-xs text-dark-400 mt-1">{subtitle}</p>
      <p className="text-sm text-dark-500 mt-0.5">{title}</p>
    </div>
  );
}
