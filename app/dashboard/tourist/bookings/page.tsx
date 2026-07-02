"use client";

import { useState, useEffect } from "react";
import { CheckCircle, MapPin, Calendar, ExternalLink, Download, Loader2, MessageSquare, Compass, X } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MeetInterface from "@/components/meet/MeetInterface";

export default function TouristBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [activeMeetBooking, setActiveMeetBooking] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
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
        }));
        setBookings(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (bookingId: string) => {
    setIsProcessing(bookingId);
    toast.info("Processing automated payout on the blockchain...");
    
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
        }),
      });

      if (res.ok) {
        setBookings(prev => 
          prev.map(b => b.id === bookingId ? { ...b, status: "COMPLETED" } : b)
        );
        toast.success("Tour marked as complete! Funds automatically sent to Guide & Treasury.");
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
    <div style="background: linear-gradient(145deg, #0b1e4a, #1a3a7a, #2563eb); padding: 28px 30px 22px 30px; position: relative; overflow: hidden;">

        <!-- Subtle decorative pattern overlay -->
        <div style="position: absolute; top: -60px; right: -40px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.03); pointer-events: none;"></div>
        <div style="position: absolute; bottom: -80px; left: -30px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.02); pointer-events: none;"></div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1;">

            <!-- Left: Logo & Title -->
            <div>
                <img src="/assets/Navbar-logo.webp" alt="Explomate" style="height: 32px; display: block; filter: brightness(0) invert(1);" />
                <p style="margin: 6px 0 0 0; font-size: 9px; color: #93b5f0; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600; opacity: 0.9;">Official Booking Receipt</p>
            </div>

            <!-- Right: Stamp -->
            <div style="margin-top: -6px;">
                <div style="border: 3px double ${stampColor}; color: ${stampColor}; padding: 5px 14px; font-size: 11px; font-weight: 900; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; letter-spacing: 1.5px; border-radius: 8px; transform: rotate(-6deg); background: rgba(255,255,255,0.96); box-shadow: 0 0 0 2px ${stampColor}, 0 4px 12px rgba(0,0,0,0.10); display: inline-block; text-align: center; line-height: 1.3;">
                    ${stampText}
                </div>
            </div>

        </div>

        <!-- Decorative divider line -->
        <div style="position: relative; z-index: 1; margin-top: 16px; border-bottom: 1px solid rgba(255,255,255,0.10);"></div>
    </div>

    <!-- ===== MAIN CONTENT ===== -->
    <div style="padding: 24px 28px 16px 28px;">

        <!-- ===== INFO GRID: 2 Columns ===== -->
        <div style="display: table; width: 100%; font-size: 11.5px; margin-bottom: 22px; border-collapse: separate; border-spacing: 0;">

            <!-- Column 1: Booker -->
            <div style="display: table-cell; width: 50%; vertical-align: top; padding-right: 18px; box-sizing: border-box;">

                <div style="background: #f8fafc; border-radius: 12px; padding: 14px 16px; border: 1px solid #eef2f6;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                        <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em;">👤 Booker</span>
                        <span style="flex: 1; border-bottom: 1px dashed #dce1e9;"></span>
                    </div>
                    <div style="display: grid; grid-template-columns: 80px 1fr; gap: 2px 6px; font-size: 11px;">
                        <span style="color: #64748b;">Lead</span>
                        <span style="font-weight: 600; color: #0f172a;">${booking.tourist?.title ? booking.tourist.title + '. ' : ''}${booking.tourist?.name || 'Customer'}</span>
                        <span style="color: #64748b;">Email</span>
                        <span style="font-weight: 500; color: #0f172a; word-break: break-all;">${booking.tourist?.email || 'N/A'}</span>
                        <span style="color: #64748b;">Guide</span>
                        <span style="font-weight: 500; color: #0f172a;">${booking.guideName}</span>
                    </div>
                </div>

            </div>

            <!-- Column 2: Tour Details -->
            <div style="display: table-cell; width: 50%; vertical-align: top; padding-left: 18px; box-sizing: border-box;">

                <div style="background: #f8fafc; border-radius: 12px; padding: 14px 16px; border: 1px solid #eef2f6;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                        <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em;">📋 Tour</span>
                        <span style="flex: 1; border-bottom: 1px dashed #dce1e9;"></span>
                    </div>
                    <div style="display: grid; grid-template-columns: 80px 1fr; gap: 2px 6px; font-size: 11px;">
                        <span style="color: #64748b;">Booking ID</span>
                        <span style="font-weight: 600; color: #0f172a; font-family: 'SF Mono', 'Courier New', monospace; font-size: 10px;">${booking.id}</span>
                        <span style="color: #64748b;">Tour</span>
                        <span style="font-weight: 600; color: #0f172a;">${booking.tourName}</span>
                        <span style="color: #64748b;">Date</span>
                        <span style="font-weight: 600; color: #0f172a;">${booking.date} ${booking.bookingTime ? '· ' + booking.bookingTime : ''}</span>
                        <span style="color: #64748b;">Location</span>
                        <span style="font-weight: 600; color: #0f172a;">${booking.location}</span>
                    </div>
                </div>

            </div>
        </div>

        <!-- ===== TRAVELERS TABLE ===== -->
        <div style="margin-bottom: 22px;">

            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em;">🧳 Travelers</span>
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
                    ${allTravelers.map((t: any, idx: number) => `
                    <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#fafcff'}; border-bottom: 1px solid #f0f3f8;">
                        <td style="padding: 8px 10px; color: #94a3b8; text-align: center; font-weight: 500; font-size: 10px;">${idx + 1}</td>
                        <td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">
                            <span>${t.title ? t.title + '. ' : ''}${t.name}</span>
                            ${idx === 0 ? `<span style="display: inline-block; vertical-align: middle; font-size: 7px; font-weight: 700; color: #1e40af; background: #dbeafe; border: 1px solid #bfdbfe; padding: 1px 7px; border-radius: 12px; margin-left: 6px; line-height: 1.6; text-transform: uppercase; letter-spacing: 0.3px;">Lead</span>` : ''}
                        </td>
                        <td style="padding: 8px 10px; color: #334155; font-family: 'SF Mono', 'Courier New', monospace; font-size: 9.5px; letter-spacing: 0.3px;">${t.document}</td>
                        <td style="padding: 8px 10px; color: #334155; text-align: center; font-weight: 500;">${t.age}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- ===== TOTAL PAID ===== -->
        <div style="background: linear-gradient(145deg, #f0f7ff, #e6effa); border: 1px solid #c7ddf5; border-radius: 14px; padding: 16px 20px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(37,99,235,0.06);">

            <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 11px; font-weight: 700; color: #1e3a6f; text-transform: uppercase; letter-spacing: 0.06em;">💰 Total Paid</span>
                    <span style="font-size: 8px; font-weight: 500; color: #3b82f6; background: rgba(59,130,246,0.12); padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(59,130,246,0.15);">Escrow</span>
                </div>
                <span style="font-size: 8.5px; color: #4b7bc9; opacity: 0.85;">Secured via Smart Contract</span>
            </div>

            <div style="text-align: right;">
                <span style="font-size: 26px; font-weight: 800; color: #0b1e4a; letter-spacing: -0.5px;">${formatCurrency(booking.amountUSD)}</span>
            </div>

        </div>

        <!-- ===== WEB3 TX HASH ===== -->
        <div style="background: #fafcff; border: 1px solid #e9edf4; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 10px;">

            <div style="flex-shrink: 0; background: #eef2f6; border-radius: 6px; padding: 4px 8px; font-size: 8px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;">🔗 Tx</div>

            <div style="flex: 1; overflow: hidden;">
                <p style="margin: 0; font-family: 'SF Mono', 'Courier New', monospace; word-break: break-all; color: #1e293b; font-size: 8.5px; letter-spacing: 0.2px; opacity: 0.8;">${booking.txHash}</p>
            </div>

            <div style="flex-shrink: 0; width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.3);" title="Verified on-chain"></div>

        </div>

    </div>

    <!-- ===== FOOTER ===== -->
    <div style="position: relative; margin-top: 6px; padding: 14px 28px 16px 28px; border-top: 1px solid #eef2f6; background: #fafcff; display: flex; justify-content: space-between; align-items: center;">

        <span style="font-weight: 500; color: #94a3b8; font-size: 8.5px; letter-spacing: 0.04em;">
            © 2026 Explomate.ly · All rights reserved
        </span>

        <span style="font-weight: 500; color: #94a3b8; font-size: 8px; letter-spacing: 0.04em; background: #f1f5f9; padding: 3px 12px; border-radius: 20px;">
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

  const activeBookingsCount = bookings.filter(b => !["COMPLETED", "CANCELLED", "REJECTED"].includes(b.status)).length;
  const historyBookingsCount = bookings.filter(b => ["COMPLETED", "CANCELLED", "REJECTED"].includes(b.status)).length;

  const filteredBookings = bookings.filter(b => {
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
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-dark-200">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-dark-500">Loading bookings...</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-dark-500 bg-white rounded-2xl border border-dashed border-dark-200">
              No {activeTab} bookings found.
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="card p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
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
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <button 
                      onClick={() => handleDownloadPDF(booking)}
                      className="btn-outline flex items-center justify-center gap-2 w-full whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" /> PDF
                    </button>

                    <button 
                      onClick={() => handleChatWithGuide(booking)}
                      className="btn-outline flex items-center justify-center gap-2 w-full whitespace-nowrap cursor-pointer text-primary hover:bg-primary/5 hover:border-primary"
                    >
                      <MessageSquare className="w-4 h-4" /> Chat Guide
                    </button>

                    {(booking.status === "FUNDED" || booking.status === "CONFIRMED") && (
                      <button 
                        onClick={() => setActiveMeetBooking(booking)}
                        className="btn-outline flex items-center justify-center gap-2 w-full whitespace-nowrap text-secondary border-secondary hover:bg-secondary/5 hover:border-secondary cursor-pointer"
                      >
                        <Compass className="w-4 h-4" /> Meet Radar
                      </button>
                    )}

                    {(booking.status === "FUNDED" || booking.status === "CONFIRMED") && (
                      <button 
                        onClick={() => handleMarkComplete(booking.id)}
                        disabled={isProcessing === booking.id}
                        className="btn-primary w-full whitespace-nowrap cursor-pointer"
                      >
                        {isProcessing === booking.id ? "Releasing..." : "Complete Tour"}
                      </button>
                    )}
                    {booking.status === "COMPLETED" && (
                      <button className="btn-outline w-full whitespace-nowrap opacity-50 cursor-not-allowed" disabled>
                        Done
                      </button>
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
    </DashboardLayout>
  );
}
