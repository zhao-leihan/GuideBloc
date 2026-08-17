"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, MapPin, Calendar, ExternalLink, Download, Loader2, MessageSquare, Compass, X, Star, Upload, ChevronDown, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DotsLoader from "@/components/ui/DotsLoader";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MeetInterface from "@/components/meet/MeetInterface";
import TourVerificationModal from "@/components/verification/TourVerificationModal";

export default function TouristBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [activeMeetBooking, setActiveMeetBooking] = useState<any | null>(null);
  const [verificationBookingModal, setVerificationBookingModal] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const { data: session } = useSession();
  const router = useRouter();

  // Double Review system states
  const [reviewBooking, setReviewBooking] = useState<any | null>(null);
  const [guideRating, setGuideRating] = useState(5);
  const [guideComment, setGuideComment] = useState("");
  const [guideImages, setGuideImages] = useState<string[]>([]);
  const [platformRating, setPlatformRating] = useState(5);
  const [platformComment, setPlatformComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Tour Completion Verification states
  const [completionBooking, setCompletionBooking] = useState<any | null>(null);
  const [proofPhoto, setProofPhoto] = useState<string>("");
  const [isUploadingProof, setIsUploadingProof] = useState<boolean>(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [hiddenBookingIds, setHiddenBookingIds] = useState<string[]>([]);

  useEffect(() => {
    const hidden = JSON.parse(localStorage.getItem("hidden_bookings") || "[]");
    setHiddenBookingIds(hidden);
  }, []);

  const handleHideBooking = (bookingId: string) => {
    const nextHidden = [...hiddenBookingIds, bookingId];
    setHiddenBookingIds(nextHidden);
    localStorage.setItem("hidden_bookings", JSON.stringify(nextHidden));
    toast.success("Booking removed from your history list.");
  };

  useEffect(() => {
    if (session?.user) {
      fetchBookings();
    }
  }, [session]);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        const userId = (session?.user as any)?.id;
        // Map database schema to frontend expected layout
        const mapped = data.map((b: any) => ({
          id: b.id,
          tourName: b.gig?.title || "Unknown Tour",
          guideName: b.gig?.guide?.name || "Unknown Guide",
          guideId: b.gig?.guide?.id,
          gigId: b.gigId,
          date: new Date(b.bookingDate).toISOString().split("T")[0],
          bookingTime: b.bookingTime || "",
          amountUSD: b.totalPriceUSD,
          status: b.status === "CONFIRMED" ? "FUNDED" : b.status,
          txHash: b.txHash || "N/A",
          location: b.gig?.location || "Unknown Location",
          participants: b.participants || [],
          tourist: b.tourist || null,
          hasReviewed: b.reviews?.some((r: any) => r.reviewerId === userId) || false,
        }));
        setBookings(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (bookingId: string, photo: string) => {
    setIsProcessing(bookingId);
    toast.info("Processing automated payout on the blockchain...");
    
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          proofPhoto: photo,
        }),
      });

      if (res.ok) {
        setBookings(prev => 
          prev.map(b => b.id === bookingId ? { ...b, status: "COMPLETED", proofPhoto: photo } : b)
        );
        toast.success("Tour marked as complete! Funds automatically sent to Guide & Treasury.");
        setCompletionBooking(null);
        setProofPhoto("");
      } else {
        toast.error("Failed to complete tour in database");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete tour transaction");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking? If funded, your USDC/USDT escrow funds will be fully refunded to your wallet.")) {
      return;
    }
    
    setIsProcessing(bookingId);
    toast.info("Processing cancellation and escrow refund on-chain...");
    
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
        }),
      });

      if (res.ok) {
        setBookings(prev => 
          prev.map(b => b.id === bookingId ? { ...b, status: "CANCELLED" } : b)
        );
        toast.success("Booking cancelled and refunded successfully!");
        fetchBookings();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to cancel booking");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to process booking cancellation");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleChatWithGuide = async (booking: any) => {
    if (!booking.guideId) {
      toast.error("Guide information not found");
      return;
    }
    try {
      toast.info("Opening chat with guide...");
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          touristId: (session?.user as any)?.id,
          guideId: booking.guideId,
          gigId: booking.gigId,
          bookingId: booking.id,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/tourist/messages");
      } else {
        toast.error("Failed to start chat session");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error starting chat");
    }
  };

  const handleDownloadPDF = async (booking: any) => {
    try {
      toast.info("Generating PDF receipt...");

      // Construct a unified traveler list (lead booker + companions)
      const allTravelers: any[] = [];
      allTravelers.push({
        title: booking.tourist?.title || "Mr",
        name: booking.tourist?.name || "Customer",
        document: booking.tourist?.passportNumber || booking.tourist?.idCardNumber || "-",
        age: booking.tourist?.age ? `${booking.tourist.age} yrs` : "-",
      });

      if (booking.participants && Array.isArray(booking.participants)) {
        booking.participants.forEach((p: any) => {
          if (p.isMainUser) return;
          allTravelers.push({
            title: p.title || "Mr",
            name: p.name,
            document: p.passportNumber || p.idCardNumber || "-",
            age: p.age ? `${p.age} yrs` : "-",
          });
        });
      }

      // Configure cap/stamp styling based on payment status
      let stampColor = "#10b981"; // green
      let stampText = "RELEASED / PAID";
      if (booking.status === "FUNDED" || booking.status === "CONFIRMED") {
        stampColor = "#3b82f6"; // blue
        stampText = "ESCROW SECURED";
      } else if (booking.status === "PENDING" || booking.status === "AWAITING_PAYMENT") {
        stampColor = "#f59e0b"; // yellow
        stampText = "PENDING ESCROW";
      }

      const receiptDiv = document.createElement("div");
      receiptDiv.innerHTML = `
      <div style="position: relative; width: 600px; min-height: 820px; background: #ffffff; font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif; color: #0f172a; border-radius: 20px; border: 1px solid #e9edf4; overflow: hidden; box-sizing: border-box; box-shadow: 0 20px 60px rgba(0,0,0,0.08);">

    <!-- ===== HEADER ===== -->
    <div style="background: url('/assets/background.jpg') center/cover no-repeat, linear-gradient(145deg, #0f172a, #1e1b4b); padding: 24px 30px; position: relative; overflow: hidden; border-bottom: 2px solid rgba(255,255,255,0.1);">

        <!-- Subtle dark overlay for contrast -->
        <div style="position: absolute; inset: 0; background: rgba(15, 23, 42, 0.4); pointer-events: none;"></div>

        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1;">

            <!-- Left: Logo & Title -->
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="/assets/logo.png" alt="Explomate Logo" style="height: 38px; width: 38px; object-fit: contain;" />
                <div>
                    <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">EXPLOMATE</h2>
                    <p style="margin: 2px 0 0 0; font-size: 8.5px; color: #e2e8f0; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600;">Official Booking Receipt</p>
                </div>
            </div>

            <!-- Right: Stamp -->
            <div>
                <div style="border: 3px double ${stampColor}; color: ${stampColor}; padding: 5px 14px; font-size: 11px; font-weight: 900; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; letter-spacing: 1.5px; border-radius: 8px; transform: rotate(-4deg); background: rgba(255,255,255,0.96); box-shadow: 0 0 0 2px ${stampColor}, 0 4px 12px rgba(0,0,0,0.15); display: inline-block; text-align: center; line-height: 1.3;">
                    ${stampText}
                </div>
            </div>

        </div>
    </div>

    <!-- ===== MAIN CONTENT ===== -->
    <div style="padding: 24px 28px 16px 28px;">

        <!-- ===== INFO GRID: 2 Columns ===== -->
        <div style="display: table; width: 100%; font-size: 11.5px; margin-bottom: 22px; border-collapse: separate; border-spacing: 0;">

            <!-- Column 1: Booker -->
            <div style="display: table-cell; width: 50%; vertical-align: top; padding-right: 14px; box-sizing: border-box;">

                <div style="background: #f8fafc; border-radius: 12px; padding: 14px 16px; border: 1px solid #eef2f6;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                        <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em;">Booker Information</span>
                        <span style="flex: 1; border-bottom: 1px dashed #dce1e9;"></span>
                    </div>
                    <div style="display: grid; grid-template-columns: 85px 1fr; gap: 4px 6px; font-size: 11px;">
                        <span style="color: #64748b;">Lead</span>
                        <span style="font-weight: 600; color: #0f172a;">${booking.tourist?.title ? booking.tourist.title + '. ' : ''}${booking.tourist?.name || 'Customer'}</span>
                        <span style="color: #64748b;">Email</span>
                        <span style="font-weight: 500; color: #0f172a; word-break: break-all;">${booking.tourist?.email || 'N/A'}</span>
                        <span style="color: #64748b;">Guide</span>
                        <span style="font-weight: 500; color: #0f172a;">${booking.guideName}</span>
                    </div>
                </div>

            </div>

            <!-- Column 2: Tour & Payment Details -->
            <div style="display: table-cell; width: 50%; vertical-align: top; padding-left: 14px; box-sizing: border-box;">

                <div style="background: #f8fafc; border-radius: 12px; padding: 14px 16px; border: 1px solid #eef2f6;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                        <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em;">Tour & Payment Details</span>
                        <span style="flex: 1; border-bottom: 1px dashed #dce1e9;"></span>
                    </div>
                    <div style="display: grid; grid-template-columns: 95px 1fr; gap: 4px 6px; font-size: 11px;">
                        <span style="color: #64748b;">Booking ID</span>
                        <span style="font-weight: 600; color: #0f172a; font-family: 'SF Mono', 'Courier New', monospace; font-size: 10px;">${booking.id}</span>
                        <span style="color: #64748b;">Method</span>
                        <span style="font-weight: 700; color: #4f46e5;">Crypto Escrow (USDC/USDT)</span>
                        <span style="color: #64748b;">Network</span>
                        <span style="font-weight: 600; color: #0f172a;">Base L2 Network</span>
                        <span style="color: #64748b;">Date</span>
                        <span style="font-weight: 600; color: #0f172a;">${booking.date} ${booking.bookingTime ? '· ' + booking.bookingTime : ''}</span>
                    </div>
                </div>

            </div>
        </div>

        <!-- ===== TRAVELERS TABLE ===== -->
        <div style="margin-bottom: 22px;">

            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em;">Travelers Manifest</span>
                <span style="flex: 1; border-bottom: 1px solid #eef2f6;"></span>
                <span style="font-size: 9px; font-weight: 500; color: #94a3b8; background: #f1f5f9; padding: 2px 10px; border-radius: 20px;">${allTravelers.length} pax</span>
            </div>

            <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 10.5px; border-radius: 12px; overflow: hidden; border: 1px solid #e9edf4; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 8px 10px; color: #475569; font-weight: 700; text-align: center; border-bottom: 2px solid #dce1e9; width: 10%;">#</th>
                        <th style="padding: 8px 10px; color: #475569; font-weight: 700; text-align: left; border-bottom: 2px solid #dce1e9; width: 42%;">Full Name</th>
                        <th style="padding: 8px 10px; color: #475569; font-weight: 700; text-align: left; border-bottom: 2px solid #dce1e9; width: 33%;">Passport / NIK</th>
                        <th style="padding: 8px 10px; color: #475569; font-weight: 700; text-align: center; border-bottom: 2px solid #dce1e9; width: 15%;">Age</th>
                    </tr>
                </thead>
                <tbody>
                    ${allTravelers.map((t: any, idx: number) => 
                      '<tr style="background: ' + (idx % 2 === 0 ? '#ffffff' : '#fafcff') + '; border-bottom: 1px solid #f0f3f8;">' +
                          '<td style="padding: 8px 10px; color: #94a3b8; text-align: center; font-weight: 500; font-size: 10px;">' + (idx + 1) + '</td>' +
                          '<td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">' +
                              '<span>' + (t.title ? t.title + '. ' : '') + t.name + '</span>' +
                              (idx === 0 ? '<span style="display: inline-block; vertical-align: middle; font-size: 7px; font-weight: 700; color: #1e40af; background: #dbeafe; border: 1px solid #bfdbfe; padding: 1px 7px; border-radius: 12px; margin-left: 6px; line-height: 1.6; text-transform: uppercase; letter-spacing: 0.3px;">Lead</span>' : '') +
                          '</td>' +
                          '<td style="padding: 8px 10px; color: #334155; font-family: \'SF Mono\', \'Courier New\', monospace; font-size: 9.5px; letter-spacing: 0.3px;">' + t.document + '</td>' +
                          '<td style="padding: 8px 10px; color: #334155; text-align: center; font-weight: 500;">' + t.age + '</td>' +
                      '</tr>'
                    ).join('')}
                </tbody>
            </table>
        </div>

        <!-- ===== TOTAL PAID ===== -->
        <div style="background: linear-gradient(145deg, #f0f7ff, #e6effa); border: 1px solid #c7ddf5; border-radius: 14px; padding: 16px 20px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(37,99,235,0.06);">

            <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 11px; font-weight: 700; color: #1e3a6f; text-transform: uppercase; letter-spacing: 0.06em;">Total Amount Paid</span>
                    <span style="font-size: 8px; font-weight: 500; color: #3b82f6; background: rgba(59,130,246,0.12); padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(59,130,246,0.15);">Escrow Locked</span>
                </div>
                <span style="font-size: 8.5px; color: #4b7bc9; opacity: 0.85;">Secured via Smart Escrow Contract</span>
            </div>

            <div style="text-align: right;">
                <span style="font-size: 26px; font-weight: 800; color: #0b1e4a; letter-spacing: -0.5px;">${formatCurrency(booking.amountUSD)}</span>
            </div>

        </div>

        <!-- ===== WEB3 TX HASH ===== -->
        <div style="background: #fafcff; border: 1px solid #e9edf4; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 10px;">

            <div style="flex-shrink: 0; background: #eef2f6; border-radius: 6px; padding: 4px 8px; font-size: 8px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;">TxHash</div>

            <div style="flex: 1; overflow: hidden;">
                <p style="margin: 0; font-family: 'SF Mono', 'Courier New', monospace; word-break: break-all; color: #1e293b; font-size: 8.5px; letter-spacing: 0.2px; opacity: 0.8;">${booking.txHash}</p>
            </div>

            <div style="flex-shrink: 0; width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.3);" title="Verified on-chain"></div>

        </div>

    </div>

    <!-- ===== FOOTER WITH BACKGROUND IMAGE ===== -->
    <div style="background: url('/assets/background.jpg') center/cover no-repeat, #0f172a; padding: 14px 28px; position: relative; overflow: hidden; display: flex; justify-content: space-between; align-items: center;">
        
        <!-- Subtle dark overlay for legibility -->
        <div style="position: absolute; inset: 0; background: rgba(15, 23, 42, 0.5); pointer-events: none;"></div>

        <span style="font-weight: 500; color: #f8fafc; font-size: 8.5px; letter-spacing: 0.04em; position: relative; z-index: 1;">
            © 2026 Explomate.ly · All rights reserved
        </span>

        <span style="font-weight: 600; color: #ffffff; font-size: 8px; letter-spacing: 0.04em; background: rgba(255,255,255,0.2); padding: 3px 12px; border-radius: 20px; backdrop-filter: blur(4px); position: relative; z-index: 1;">
            Secured by Smart Escrow
        </span>

    </div>

</div>
      `;

      receiptDiv.style.position = "absolute";
      receiptDiv.style.left = "-9999px";
      document.body.appendChild(receiptDiv);

      const canvas = await html2canvas(receiptDiv, { scale: 2 });
      document.body.removeChild(receiptDiv);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Explomate_Receipt_${booking.id}.pdf`);

      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("PDF generation failed", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleReviewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (guideImages.length + filesArray.length > 5) {
        toast.error("You can upload a maximum of 5 images");
        return;
      }
      filesArray.forEach((file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds the 5MB size limit`);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setGuideImages((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeReviewImage = (index: number) => {
    setGuideImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReviews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewBooking) return;
    setSubmittingReview(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: activeReviewBooking.id,
          rating: guideRating,
          comment: guideComment,
          images: guideImages,
          platformRating,
          platformComment,
        }),
      });

      if (res.ok) {
        toast.success("Thank you for your feedback!");
        setBookings((prev) =>
          prev.map((b) => (b.id === activeReviewBooking.id ? { ...b, hasReviewed: true } : b))
        );
        setReviewBooking(null);
        // Reset state
        setGuideRating(5);
        setGuideComment("");
        setGuideImages([]);
        setPlatformRating(5);
        setPlatformComment("");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to submit reviews");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting reviews");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
      case "CANCELLED":
      case "REJECTED":
        return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
      case "FUNDED":
      case "CONFIRMED":
        return "bg-blue-500/10 text-blue-600 border border-blue-500/20";
      default: // PENDING, AWAITING_PAYMENT, etc.
        return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
    }
  };

  const visibleBookings = bookings.filter(b => !hiddenBookingIds.includes(b.id));

  const activeBookingsCount = visibleBookings.filter(b => !["COMPLETED", "CANCELLED", "REJECTED"].includes(b.status)).length;
  const historyBookingsCount = visibleBookings.filter(b => ["COMPLETED", "CANCELLED", "REJECTED"].includes(b.status)).length;

  const unreviewedCompletedBooking = visibleBookings.find(b => b.status === "COMPLETED" && !b.hasReviewed);
  const activeReviewBooking = reviewBooking || unreviewedCompletedBooking;
  const isReviewMandatory = !!unreviewedCompletedBooking;

  const filteredBookings = visibleBookings.filter(b => {
    const isHistory = ["COMPLETED", "CANCELLED", "REJECTED"].includes(b.status);
    return activeTab === "history" ? isHistory : !isHistory;
  });

  return (
    <DashboardLayout role="tourist">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">My Bookings</h1>
          <p className="text-dark-500">Manage your tour reservations and release payments.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-dark-200 pb-px">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2.5 font-bold text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === "active"
                ? "border-primary text-primary"
                : "border-transparent text-dark-500 hover:text-dark-800"
            }`}
          >
            Active Bookings ({activeBookingsCount})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 font-bold text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-dark-500 hover:text-dark-800"
            }`}
          >
            Booking History ({historyBookingsCount})
          </button>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-dark-800 rounded-2xl border border-dark-200 dark:border-dark-700/80 space-y-3">
              <DotsLoader size="lg" />
              <span className="text-xs font-semibold text-slate-500 dark:text-dark-300">Loading bookings...</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-dark-500 bg-white rounded-2xl border border-dashed border-dark-200">
              No {activeTab} bookings found.
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="card p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center !overflow-visible">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-dark-900">{booking.tourName}</h3>
                    <span className={`badge text-xs font-bold px-2.5 py-1 rounded-lg ${getStatusBadgeStyle(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-dark-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {booking.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {booking.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Guide: {booking.guideName}
                    </div>
                  </div>

                  <div className="text-sm font-mono text-dark-400 flex items-center gap-1">
                    Tx: {booking.txHash !== "N/A" ? (
                      <>
                        <span className="truncate max-w-[150px]">{booking.txHash}</span>
                        {booking.txHash.startsWith("0xMOCK") ? (
                          <span className="text-[10px] bg-dark-100 text-dark-500 px-2 py-0.5 rounded-full ml-1">Sandbox</span>
                        ) : (
                          <a 
                            href={`https://sepolia.basescan.org/tx/${booking.txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-primary transition-colors flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </>
                    ) : "N/A"}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-2xl font-bold text-dark-900">{formatCurrency(booking.amountUSD)}</div>
                  
                  <div className="flex items-center gap-2 justify-end w-full mt-1">
                    {/* Cancellation X Button */}
                    {(booking.status === "PENDING" || booking.status === "FUNDED" || booking.status === "CONFIRMED") && (
                      <button 
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={isProcessing === booking.id}
                        className="text-dark-400 hover:text-danger hover:bg-danger/10 border border-dark-200 hover:border-danger/20 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 duration-200 hover:-translate-y-0.5"
                        title="Cancel Booking"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Primary Complete Tour Action */}
                    {(booking.status === "FUNDED" || booking.status === "CONFIRMED") && (
                      <button 
                        onClick={() => setCompletionBooking(booking)}
                        disabled={isProcessing === booking.id}
                        className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-3 rounded-xl text-xs whitespace-nowrap cursor-pointer flex items-center justify-center shadow-md shadow-primary-500/10 transition-all active:scale-95 duration-200 hover:-translate-y-0.5"
                      >
                        Complete Tour
                      </button>
                    )}

                    {/* Action Dropdown Menu - Put at the end ("di ujung") */}
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === booking.id ? null : booking.id);
                        }}
                        className={`flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer border transition-all active:scale-95 duration-200 hover:-translate-y-0.5 ${
                          openDropdownId === booking.id
                            ? "bg-dark-900 border-dark-900 text-white hover:bg-dark-950"
                            : "bg-white border-primary text-primary hover:bg-primary/5 focus:text-primary focus:bg-white focus:outline-none"
                        }`}
                      >
                        Actions <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      <AnimatePresence>
                        {openDropdownId === booking.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <motion.div 
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              className="absolute right-0 mt-1.5 w-48 bg-dark-950 border border-dark-800 rounded-xl shadow-2xl py-1.5 z-20"
                            >
                              <button
                                onClick={() => {
                                  handleDownloadPDF(booking);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-dark-100 hover:bg-dark-800 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                              >
                                <Download className="w-3.5 h-3.5 text-dark-400" /> Download PDF Receipt
                              </button>

                              <button
                                onClick={() => {
                                  handleChatWithGuide(booking);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-dark-100 hover:bg-dark-800 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-dark-400" /> Chat with Guide
                              </button>

                              {(booking.status === "FUNDED" || booking.status === "CONFIRMED") && (
                                <>
                                  <button
                                    onClick={() => {
                                      setVerificationBookingModal(booking);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs text-emerald-400 hover:bg-emerald-950/40 flex items-center gap-2 cursor-pointer font-bold transition-colors"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Safe Verification (QR+GPS)
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveMeetBooking(booking);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs text-blue-400 hover:bg-blue-950/40 flex items-center gap-2 cursor-pointer font-bold transition-colors"
                                  >
                                    <Compass className="w-3.5 h-3.5 text-blue-400" /> GPS Meetup Radar
                                  </button>
                                </>
                              )}

                              {["CANCELLED", "REJECTED"].includes(booking.status) && (
                                <button
                                  onClick={() => {
                                    handleHideBooking(booking.id);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs text-rose-500 border-t border-dark-800 hover:bg-dark-800 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete History
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    {booking.status === "COMPLETED" && (
                      booking.hasReviewed ? (
                        <button className="btn-outline w-full whitespace-nowrap opacity-50 cursor-not-allowed" disabled>
                          Done
                        </button>
                      ) : (
                        <button 
                          onClick={() => setReviewBooking(booking)}
                          className="btn-primary w-full whitespace-nowrap bg-emerald-600 border-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        >
                          Write Review
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))
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
                role="TOURIST"
                otherPartyName={activeMeetBooking.guideName || "Guide"}
                otherPartyAvatar={activeMeetBooking.guideAvatar}
              />
            </div>
          </div>
        </div>
      )}
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
              <p className="text-xs text-dark-500 mt-1">Help us improve by reviewing both your Tour Guide and your Explomate platform experience.</p>
            </div>

            <form onSubmit={handleSubmitReviews} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Section 1: Review for Tour Guide */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">1. Review for Tour Guide ({activeReviewBooking.guideName})</h3>
                
                {/* Rating selection */}
                <div>
                  <label className="block text-xs font-bold text-dark-600 uppercase mb-2">Guide Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setGuideRating(star)}
                        className="p-1 hover:scale-115 transition-transform cursor-pointer"
                      >
                        <Star 
                          className={`w-8 h-8 ${star <= guideRating ? "fill-accent text-accent" : "text-dark-200"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">Guide Review Comment</label>
                  <textarea
                    value={guideComment}
                    onChange={(e) => setGuideComment(e.target.value)}
                    rows={3}
                    placeholder="Share details of your experience with this guide..."
                    className="input py-2 px-3 text-sm resize-none"
                    required
                  />
                </div>

                {/* Images Upload */}
                <div>
                  <label className="block text-xs font-bold text-dark-600 uppercase mb-2">Attach Pictures (Max 5, up to 5MB each)</label>
                  <div className="grid grid-cols-5 gap-2">
                    {guideImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-dark-150 group">
                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeReviewImage(idx)}
                          className="absolute inset-0 bg-black/50 text-white font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs transition-opacity cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {guideImages.length < 5 && (
                      <label className="aspect-square rounded-lg border border-dashed border-dark-350 flex flex-col items-center justify-center cursor-pointer hover:bg-dark-50/50 transition-colors">
                        <Upload className="w-5 h-5 text-dark-400" />
                        <span className="text-[9px] text-dark-500 font-bold mt-1">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleReviewImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
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
                    placeholder="Tell us what you think of Explomate (escrow system, web speed, layouts)..."
                    className="input py-2 px-3 text-sm resize-none"
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

      {/* Tour Completion Modal */}
      {completionBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-dark-100 animate-in zoom-in duration-200">
            <button 
              onClick={() => { setCompletionBooking(null); setProofPhoto(""); }}
              className="absolute top-4 right-4 text-dark-400 hover:text-dark-900 p-2 hover:bg-dark-50 rounded-full transition-colors z-20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 border-b border-dark-100 bg-dark-50/50">
              <h2 className="text-xl font-bold text-dark-900">Verify Tour Completion</h2>
              <p className="text-xs text-dark-500 mt-1">Please upload a verification photo from your tour to release guide funds and complete the booking.</p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!proofPhoto) {
                  toast.error("Please upload a proof photo first.");
                  return;
                }
                handleMarkComplete(completionBooking.id, proofPhoto);
              }} 
              className="p-6 space-y-6"
            >
              <div>
                <label className="block text-xs font-bold text-dark-600 uppercase mb-2">Upload Tour Photo (Mandatory)</label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-dark-300 rounded-2xl p-6 hover:bg-dark-50/50 transition-colors relative">
                  {proofPhoto ? (
                    <div className="space-y-4 w-full">
                      <img src={proofPhoto} alt="Proof Preview" className="w-full h-40 object-cover rounded-xl border border-dark-200" />
                      <button 
                        type="button" 
                        onClick={() => setProofPhoto("")}
                        className="btn-outline w-full py-2 text-xs border-danger text-danger hover:bg-danger/5 cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer w-full h-32">
                      <Upload className="w-8 h-8 text-primary animate-pulse mb-2" />
                      <span className="text-xs font-bold text-dark-800">Select Image File</span>
                      <span className="text-[10px] text-dark-400 mt-1">PNG, JPG or WEBP up to 5MB</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("File size must be less than 5MB");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === "string") {
                                setProofPhoto(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        required
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setCompletionBooking(null); setProofPhoto(""); }}
                  className="btn-outline flex-1 py-3 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!proofPhoto || isProcessing === completionBooking.id}
                  className="btn-primary flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing === completionBooking.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Releasing...
                    </>
                  ) : (
                    "Complete & Release Payout"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3-Step Safe Verification Protocol Modal (QR + GPS + Mutual Confirm) */}
      {verificationBookingModal && (
        <TourVerificationModal
          booking={verificationBookingModal}
          userRole="TOURIST"
          onClose={() => setVerificationBookingModal(null)}
          onSuccess={() => {
            fetchBookings();
            toast.success("Tour Verified & Escrow Released Successfully!");
          }}
        />
      )}
    </DashboardLayout>
  );
}
