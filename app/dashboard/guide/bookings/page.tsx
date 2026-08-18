"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Calendar, CheckCircle, XCircle, Clock, Eye, Compass, X, Star, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import DotsLoader from "@/components/ui/DotsLoader";
import { useSession } from "next-auth/react";
import MeetInterface from "@/components/meet/MeetInterface";
import TourVerificationModal from "@/components/verification/TourVerificationModal";

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
  const [verificationBookingModal, setVerificationBookingModal] = useState<any | null>(null);
  const { data: session } = useSession();

  // Double Review system states
  const [reviewBooking, setReviewBooking] = useState<any | null>(null);
  const [touristRating, setTouristRating] = useState(5);
  const [touristComment, setTouristComment] = useState("");
  const [platformRating, setPlatformRating] = useState(5);
  const [platformComment, setPlatformComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchBookings();
    }
  }, [session]);

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

  const handleSubmitReviews = async (bookingId: string) => {
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating: touristRating,
          comment: touristComment,
          platformRating,
          platformComment,
        }),
      });

      if (res.ok) {
        toast.success("Reviews submitted successfully!");
        setReviewBooking(null);
        setTouristRating(5);
        setTouristComment("");
        setPlatformRating(5);
        setPlatformComment("");
        fetchBookings();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to submit reviews");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit reviews");
    } finally {
      setSubmittingReview(false);
    }
  };

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PAID").length;
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;
  
  // Calculate total earnings from completed / paid bookings
  const totalRevenue = bookings
    .filter((b) => b.status === "COMPLETED" || b.status === "PAID" || b.status === "CONFIRMED")
    .reduce((sum, b) => sum + (b.guide_price || (b.totalPriceUSD * 0.90)), 0);

  const unreviewedCompletedBooking = bookings.find(
    (b) => b.status === "COMPLETED" && !b.reviews?.some((r: any) => r.reviewerId === (session?.user as any)?.id)
  );
  const activeReviewBooking = reviewBooking || unreviewedCompletedBooking;
  const isReviewMandatory = !!unreviewedCompletedBooking;

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
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <DotsLoader size="lg" />
              <span className="text-xs font-semibold text-slate-500 dark:text-dark-300">Loading bookings...</span>
            </div>
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
                            {(b.status === "CONFIRMED" || b.status === "FUNDED" || b.status === "PAID") && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                                  className="btn-ghost text-xs px-2.5 py-1.5 bg-secondary/10 hover:bg-secondary text-secondary hover:text-white rounded-lg font-medium"
                                  title="Complete Tour"
                                >
                                  Complete Tour
                                </button>
                                 <button
                                   onClick={() => setVerificationBookingModal(b)}
                                   className="btn-ghost text-xs px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                                   title="3-Step Safe Verification Protocol"
                                 >
                                   <ShieldCheck className="w-3.5 h-3.5" /> Verify (QR+GPS)
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

      {/* Double Review Modal */}
      {activeReviewBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-dark-100 animate-in zoom-in duration-200 my-8">
            {!isReviewMandatory && (
              <button 
                onClick={() => setReviewBooking(null)}
                className="absolute top-4 right-4 text-dark-400 hover:text-dark-900 p-2 hover:bg-dark-50 rounded-full transition-colors z-20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            <div className="p-6 border-b border-dark-100 bg-dark-50/50">
              <h2 className="text-xl font-bold text-dark-900">Leave Your Feedback</h2>
              <p className="text-xs text-dark-500 mt-1">Help us improve by reviewing both the Tourist and your Explomate platform experience.</p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitReviews(activeReviewBooking.id);
              }} 
              className="p-6 space-y-6 max-h-[70vh] overflow-y-auto"
            >
              
              {/* Section 1: Review for Tourist */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">1. Review for Tourist ({activeReviewBooking.tourist?.name || "Customer"})</h3>
                
                {/* Rating selection */}
                <div>
                  <label className="block text-xs font-bold text-dark-600 uppercase mb-2">Tourist Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setTouristRating(star)}
                        className="p-1 hover:scale-115 transition-transform cursor-pointer"
                      >
                        <Star 
                          className={`w-8 h-8 ${star <= touristRating ? "fill-accent text-accent" : "text-dark-200"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">Review Comment</label>
                  <textarea
                    value={touristComment}
                    onChange={(e) => setTouristComment(e.target.value)}
                    rows={3}
                    placeholder="Share your experience guiding this tourist (punctuality, communication, behavior)..."
                    className="w-full bg-dark-50 border border-dark-200 rounded-xl p-3 text-sm focus:border-primary outline-none resize-none"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-dark-100 pt-6 space-y-4">
                {/* Section 2: Review for Explomate */}
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">2. Review for Explomate Platform</h3>
                
                {/* Platform Rating */}
                <div>
                  <label className="block text-xs font-bold text-dark-600 uppercase mb-2">Platform Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setPlatformRating(star)}
                        className="p-1 hover:scale-115 transition-transform cursor-pointer"
                      >
                        <Star 
                          className={`w-8 h-8 ${star <= platformRating ? "fill-secondary text-secondary" : "text-dark-200"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform Comment */}
                <div>
                  <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">Platform Feedback Comment</label>
                  <textarea
                    value={platformComment}
                    onChange={(e) => setPlatformComment(e.target.value)}
                    rows={3}
                    placeholder="Tell us what you think of Explomate (escrow system, payouts, guide tools, layout)..."
                    className="w-full bg-dark-50 border border-dark-200 rounded-xl p-3 text-sm focus:border-primary outline-none resize-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Both Reviews"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

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
                otherPartyName={activeMeetBooking.tourist?.name || "Tourist"}
                otherPartyAvatar={activeMeetBooking.tourist?.avatar}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3-Step Safe Verification Protocol Modal (QR + GPS + Mutual Confirm) */}
      {verificationBookingModal && (
        <TourVerificationModal
          booking={verificationBookingModal}
          userRole="GUIDE"
          onClose={() => setVerificationBookingModal(null)}
          onSuccess={() => {
            fetchBookings();
            toast.success("Tour Verified & Escrow Payout Released Successfully!");
          }}
        />
      )}
    </DashboardLayout>
  );
}
