"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, X, Loader2, CheckCircle2, Camera, Upload, Info, Check, ExternalLink, Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { getNetworkConfig, getExplorerTxLink } from "@/lib/crypto/networkConfig";
import { releaseToGuide } from "@/lib/crypto/payment";

interface TourVerificationModalProps {
  booking: any;
  userRole: "TOURIST" | "GUIDE";
  onClose: () => void;
  onSuccess: () => void;
}

export default function TourVerificationModal({
  booking,
  userRole,
  onClose,
  onSuccess,
}: TourVerificationModalProps) {
  const isGuide = userRole === "GUIDE";
  const [photoUrl, setPhotoUrl] = useState<string>(booking?.proofPhoto || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedTxHash, setConfirmedTxHash] = useState<string | null>(null);

  // Financial calculations
  const totalPrice = Number(booking?.totalPriceUSD ?? booking?.amountUSD ?? 0);
  const guideEarnings = Number(
    booking?.guide_price ?? (totalPrice > 0 ? Math.round((totalPrice / 1.10) * 100) / 100 : 0)
  );
  const commission = Number(
    booking?.platform_fee ?? Math.max(0, Math.round((totalPrice - guideEarnings) * 100) / 100)
  );

  const tourTitle = booking?.tourName || booking?.gig?.title || "Tour Experience";

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setPhotoUrl(reader.result);
        toast.success("Proof photo attached successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAction = async () => {
    // Photo proof is optional per user specification (only needed for dispute evidence)
    setIsProcessing(true);

    if (isGuide) {
      // Guide flow: Submit tour completion with proof photo
      const toastId = toast.loading("Submitting tour completion with proof photo...");
      try {
        const res = await fetch("/api/bookings/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            action: "GUIDE_COMPLETE",
            proofPhoto: photoUrl || "TOUR_COMPLETED_BY_GUIDE",
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to submit completion status");
        }

        setIsSuccess(true);
        toast.dismiss(toastId);
        toast.success("Tour marked as completed with proof! Awaiting tourist escrow release.");

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } catch (err: any) {
        toast.dismiss(toastId);
        console.error("Guide completion error:", err);
        toast.error(err.message || "Failed to submit tour completion.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Tourist flow: Sponsored on-chain escrow release (0 AVAX needed!)
      const toastId = toast.loading("Processing sponsored on-chain escrow release...");
      try {
        const res = await fetch("/api/bookings/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            action: "TOURIST_RELEASE",
            proofPhoto: photoUrl || booking?.proofPhoto,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to finalize escrow release records");
        }

        const data = await res.json();
        if (data.releaseHash) {
          setConfirmedTxHash(data.releaseHash);
        }

        setIsSuccess(true);
        toast.dismiss(toastId);
        toast.success(`Escrow released! $${guideEarnings.toFixed(2)} USDC sent to Guide on Avalanche.`);

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } catch (err: any) {
        toast.dismiss(toastId);
        console.error("Tourist release error:", err);
        toast.error(err.reason || err.message || "Failed to release escrow funds.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/70 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white border border-dark-100 rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-5 text-dark-900 my-8"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-dark-50 border border-dark-200 text-dark-500 hover:text-dark-900 hover:bg-dark-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark-900">
              {isGuide ? "Tour Completion & Proof Upload" : "Confirm Tour & Release Escrow"}
            </h2>
            <p className="text-xs text-dark-500 mt-0.5">
              {isGuide 
                ? "Upload proof photo of the tour to complete experience and claim payout." 
                : "Verify tour proof photo and release escrow funds directly to your guide."}
            </p>
          </div>
        </div>

        {/* Financial Distribution Card */}
        <div className="bg-dark-50 border border-dark-200/80 p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs text-dark-500 pb-2 border-b border-dark-200/60">
            <span>Tour Experience</span>
            <span className="font-bold text-dark-900 truncate max-w-[240px]">
              {tourTitle}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-dark-200/60">
            <span className="text-dark-500">Blockchain Network</span>
            <span className="font-bold text-emerald-700">
              {getNetworkConfig().badgeLabel}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-500">Total Locked in Escrow</span>
            <span className="font-mono font-bold text-dark-900">${totalPrice.toFixed(2)} USDC</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-bold">Guide Net Earnings (100% Net)</span>
            <span className="font-mono font-bold text-emerald-700">+{guideEarnings.toFixed(2)} USDC</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-600 font-bold">Platform Fee (10%)</span>
            <span className="font-mono font-bold text-blue-600">+{commission.toFixed(2)} USDC</span>
          </div>
        </div>

        {/* Optional Proof Photo Upload Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-dark-800 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-primary" />
              Tour Photo (Dispute Evidence)
            </label>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              Optional
            </span>
          </div>

          <div className="border-2 border-dashed border-dark-200 hover:border-primary/60 rounded-2xl p-4 text-center transition-all bg-dark-50/50 relative overflow-hidden">
            {photoUrl ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-dark-200 max-h-48 bg-black/5 flex items-center justify-center">
                  <img 
                    src={photoUrl} 
                    alt="Proof of Tour Preview" 
                    className="w-full h-44 object-cover rounded-xl"
                  />
                  <div className="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-xs">
                    <CheckCircle2 className="w-3 h-3" /> Photo Attached
                  </div>
                </div>
                <label className="btn-outline w-full py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer font-semibold">
                  <Upload className="w-3.5 h-3.5" /> Change Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-6 cursor-pointer group">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-dark-800">
                  Upload Photo of Tourist & Tour Guide Together
                </span>
                <span className="text-[10px] text-dark-400 mt-1">
                  JPG, PNG, or WEBP (Max 5MB)
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                  required
                />
              </label>
            )}
          </div>
        </div>

        {confirmedTxHash && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
            <span className="text-emerald-800 font-semibold truncate max-w-[280px]">
              Tx: {confirmedTxHash}
            </span>
            <a 
              href={getExplorerTxLink(confirmedTxHash)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              View <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAction}
          disabled={isProcessing || isSuccess || (!photoUrl && !booking?.proofPhoto)}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isGuide ? "Submitting Completion..." : "Signing Release in MetaMask..."}
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {isGuide ? "Tour Marked as Completed" : "Escrow Released Successfully!"}
            </>
          ) : !photoUrl && !booking?.proofPhoto ? (
            <>
              <Camera className="w-4 h-4" />
              Upload Tour Proof Photo to Enable Release
            </>
          ) : isGuide ? (
            <>
              <Check className="w-5 h-5" />
              Complete Tour with Attached Proof
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              Confirm & Release ${guideEarnings.toFixed(2)} USDC via MetaMask
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
