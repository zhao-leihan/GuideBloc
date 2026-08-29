"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, X, Loader2, CheckCircle2, Camera, Info, Check
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { releaseToGuide } from "@/lib/crypto/payment";
import { getNetworkConfig } from "@/lib/crypto/networkConfig";

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const totalPrice = booking?.totalPriceUSD || 0;
  const commission = booking?.platform_fee || totalPrice * 0.1;
  const guideEarnings = totalPrice - commission;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "explomate");

    try {
      setPhotoUrl(URL.createObjectURL(file));
      toast.success("Tour proof photo selected successfully.");
    } catch (err) {
      toast.error("Failed to process photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAction = async () => {
    setIsProcessing(true);

    if (isGuide) {
      // Guide flow: ZERO MetaMask, ZERO Gas Fee. Pure Web completion.
      const toastId = toast.loading("Submitting tour completion...");
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
        toast.success("Tour marked as completed. Awaiting tourist escrow release.");

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
      // Tourist flow: On-chain release via Tourist MetaMask (Tourist pays tiny ~Rp 150 gas fee)
      const toastId = toast.loading("Processing escrow disbursement from smart contract...");
      try {
        const txHash = await releaseToGuide(booking.id, "avalanche");

        const res = await fetch("/api/bookings/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            action: "TOURIST_RELEASE",
            txHash,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update booking status");
        }

        setIsSuccess(true);
        toast.dismiss(toastId);
        toast.success("Escrow funds successfully disbursed to Guide.");

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } catch (err: any) {
        toast.dismiss(toastId);
        console.error("Tourist release error:", err);
        toast.error(err.message || "Failed to release escrow funds.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-dark-900 border border-dark-700 rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 text-white"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-dark-800 text-dark-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isGuide ? "Tour Completion Confirmation" : "Confirm Tour & Release Escrow"}
            </h2>
            <p className="text-xs text-dark-400">
              {isGuide 
                ? "Mark tour as finished. Your 90% payout will be sent directly to your wallet." 
                : "Release escrow funds from smart contract directly to your guide."}
            </p>
          </div>
        </div>

        {/* Financial Distribution Card */}
        <div className="bg-dark-850 border border-dark-750 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs text-dark-400 pb-2 border-b border-dark-750">
            <span>Tour Experience</span>
            <span className="font-semibold text-white truncate max-w-[220px]">
              {booking?.gig?.title || "Tour Booking"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-dark-750">
            <span className="text-dark-400">Blockchain Network</span>
            <span className="font-semibold text-emerald-400">
              {getNetworkConfig().badgeLabel}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400">Total Locked in Escrow</span>
            <span className="font-mono font-bold text-white">${totalPrice.toFixed(2)} USDC</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-400">Guide Net Earnings (90%)</span>
            <span className="font-mono font-bold text-emerald-400">+{guideEarnings.toFixed(2)} USDC</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-400">Platform Fee (10%)</span>
            <span className="font-mono font-bold text-blue-400">+{commission.toFixed(2)} USDC</span>
          </div>
        </div>

        {/* Guide Notice Box */}
        {isGuide && (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <p className="font-bold text-emerald-200">Zero Gas Fee Guarantee</p>
              <p className="text-emerald-400/90 mt-0.5">
                You do not need crypto or gas fees to claim your earnings. Your +${guideEarnings.toFixed(2)} USDC payout is automatically transferred directly to your payout wallet.
              </p>
            </div>
          </div>
        )}

        {/* Photo Proof Upload (Optional for Guide) */}
        {isGuide && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider">
              Tour Documentation Photo (Optional)
            </label>
            <div className="border border-dashed border-dark-700 hover:border-dark-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-dark-800/40 relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {photoUrl ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Proof photo selected
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-dark-400">
                  <Camera className="w-6 h-6 text-dark-400" />
                  <span className="text-xs">Click to select documentation photo</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAction}
          disabled={isProcessing || isSuccess}
          className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isGuide ? "Submitting Completion..." : "Disbursing Escrow via MetaMask..."}
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {isGuide ? "Tour Marked as Completed" : "Escrow Released Successfully"}
            </>
          ) : isGuide ? (
            <>
              <Check className="w-5 h-5" />
              Mark Tour as Completed (Zero Gas)
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              Release ${guideEarnings.toFixed(2)} USDC to Guide
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
