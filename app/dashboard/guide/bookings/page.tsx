"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Calendar, CheckCircle, XCircle, Clock, Eye, Compass, X } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import MeetInterface from "@/components/meet/MeetInterface";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600",
  AWAITING_PAYMENT: "bg-orange-500/10 text-orange-600",
  CONFIRMED: "bg-blue-500/10 text-blue-600",
  COMPLETED: "bg-green-500/10 text-green-600",
  CANCELLED: "bg-red-500/10 text-red-600",
  DISPUTED: "bg-purple-500/10 text-purple-600",
};

export default function GuideBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMeetBooking, setActiveMeetBooking] = useState<any | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings?role=guide");
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Booking status updated to ${newStatus}`);
        fetchBookings();
      } else {
        toast.error("Failed to update booking status");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;
  
  // Calculate total earnings from completed bookings
  const totalRevenue = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + (b.guide_price || (b.totalPriceUSD * 0.90)), 0);

  return (
    <DashboardLayout role="guide">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Bookings</h1>
          <p className="text-dark-500">Manage incoming booking requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Pending Requests", count: pendingCount, color: "bg-yellow-500" },
            { label: "Confirmed Tours", count: confirmedCount, color: "bg-blue-500" },
            { label: "Completed Tours", count: completedCount, color: "bg-green-500" },
            { label: "Total Completed Revenue", count: `${totalRevenue.toFixed(2)} USDC`, color: "bg-secondary" },
          ].map((stat) => (
            <div key={stat.label} className="card p-4">
              <div className={`w-2 h-2 rounded-full ${stat.color} mb-2`} />
              <p className="text-xl font-bold text-dark-900">{stat.count}</p>
              <p className="text-xs text-dark-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Bookings Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-dark-500">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-dark-500">No bookings found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-50 border-b border-dark-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Tour</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Tourist</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Guests</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">USDC Price Breakdown</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-100">
                  {bookings.map((b) => {
                    const clientVal = b.client_price || b.totalPriceUSD / b.groupSize;
                    const guideVal = b.guide_price || (clientVal * 0.90);
                    const platformFeeVal = b.platform_fee || (clientVal - guideVal);
                    
                    const totalClient = clientVal * b.groupSize;
                    const totalGuide = guideVal * b.groupSize;
                    const totalPlatform = platformFeeVal * b.groupSize;

                    return (
                      <tr key={b.id} className="hover:bg-dark-50/50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-dark-900 text-sm">{b.gig?.title}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-dark-600">{b.tourist?.name}</td>
                        <td className="px-6 py-4 text-sm text-dark-600">
                          {new Date(b.bookingDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-dark-600">{b.groupSize}</td>
                        <td className="px-6 py-4 text-xs text-dark-600 space-y-1">
                          <div className="flex gap-2 justify-between max-w-[200px]">
                            <span className="text-dark-400">Expected Earnings:</span>
                            <span className="font-semibold text-secondary">{totalGuide.toFixed(2)} USDC</span>
                          </div>
                          <div className="flex gap-2 justify-between max-w-[200px]">
                            <span className="text-dark-400">Customer Price:</span>
                            <span className="font-semibold text-dark-800">{totalClient.toFixed(2)} USDC</span>
                          </div>
                          <div className="flex gap-2 justify-between max-w-[200px]">
                            <span className="text-dark-400">Platform Fee (5%):</span>
                            <span className="font-semibold text-primary">{totalPlatform.toFixed(2)} USDC</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge text-xs ${statusColors[b.status] || "bg-dark-100"}`}>{b.status.replace("_", " ")}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {b.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(b.id, "CONFIRMED")}
                                  className="btn-ghost text-xs p-1 hover:bg-secondary/10 rounded text-secondary"
                                  title="Confirm Booking"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                                  className="btn-ghost text-xs p-1 hover:bg-danger/10 rounded text-danger"
                                  title="Cancel Booking"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {(b.status === "CONFIRMED" || b.status === "FUNDED") && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                                  className="btn-ghost text-xs px-2.5 py-1.5 bg-secondary/10 hover:bg-secondary text-secondary hover:text-white rounded-lg font-medium"
                                  title="Complete Tour"
                                >
                                  Complete Tour
                                </button>
                                <button
                                  onClick={() => setActiveMeetBooking(b)}
                                  className="btn-ghost text-xs px-2.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg font-medium flex items-center gap-1 cursor-pointer"
                                  title="Open Meetup Radar"
                                >
                                  <Compass className="w-3.5 h-3.5" /> Radar
                                </button>
                              </>
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

      {/* Meetup Radar Overlay Modal */}
      {activeMeetBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-dark-900 rounded-3xl overflow-hidden shadow-2xl border border-dark-850 animate-in zoom-in duration-200">
            <button 
              onClick={() => setActiveMeetBooking(null)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white p-2 hover:bg-dark-800 rounded-full transition-colors z-20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-1">
              <MeetInterface 
                bookingId={activeMeetBooking.id}
                role="GUIDE"
                otherPartyName={activeMeetBooking.touristName || "Tourist"}
                otherPartyAvatar={activeMeetBooking.touristAvatar}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
