"use client";

import React, { useState, useEffect } from "react";
import { 
  QrCode, X, Copy, Check, Clock, ShieldCheck, 
  Camera, Upload, AlertCircle, RefreshCw, CheckCircle2,
  ExternalLink, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import DotsLoader from "@/components/ui/DotsLoader";

interface GuideQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess: () => void;
}

export default function GuideQRModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: GuideQRModalProps) {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<{
    token: string;
    qrUrl: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>(booking?.proofPhoto || "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoSection, setShowPhotoSection] = useState(false);

  // Generate or fetch the one-time QR token when modal opens
  useEffect(() => {
    if (isOpen && booking?.id) {
      generateQRToken();
    } else {
      setQrData(null);
      setIsCompleted(false);
    }
  }, [isOpen, booking?.id]);

  const generateQRToken = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/complete-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to generate completion token");
      }

      const data = await res.json();
      setQrData({
        token: data.token,
        qrUrl: data.qrUrl,
        expiresAt: data.expiresAt,
      });
    } catch (err: any) {
      console.error("QR Generation error:", err);
      toast.error(err.message || "Could not generate QR code");
    } finally {
      setLoading(false);
    }
  };

  // Poll booking status every 3.5 seconds to detect tourist scan
  useEffect(() => {
    if (!isOpen || !booking?.id || isCompleted) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/bookings?role=guide`);
        if (res.ok) {
          const bookings = await res.json();
          const current = bookings.find((b: any) => b.id === booking.id);
          if (current && current.status === "COMPLETED") {
            setIsCompleted(true);
            toast.success("Tour confirmed by tourist! Escrow released to your wallet.");
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 2500);
          }
        }
      } catch (pollErr) {
        // non-fatal
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, booking?.id, isCompleted]);

  // Token countdown timer
  useEffect(() => {
    if (!qrData?.expiresAt) return;

    const updateTimer = () => {
      const target = new Date(qrData.expiresAt).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const mins = Math.floor(diff / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [qrData?.expiresAt]);

  const handleCopyLink = () => {
    if (!qrData?.qrUrl) return;
    navigator.clipboard.writeText(qrData.qrUrl);
    setCopied(true);
    toast.success("Completion link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === "string") {
        const base64 = reader.result;
        setPhotoUrl(base64);
        try {
          await fetch(`/api/bookings/${booking.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: booking.status,
              proofPhoto: base64,
            }),
          });
          toast.success("Dispute evidence photo saved (optional archive).");
        } catch (saveErr) {
          console.warn("Failed to persist photo:", saveErr);
        } finally {
          setUploadingPhoto(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const qrImageUrl = qrData?.qrUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrData.qrUrl)}`
    : "";

  const guideEarnings = booking?.guide_price || (booking?.totalPriceUSD * 0.9) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark-900 flex items-center gap-2">
              Tour Completion Handshake
              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                Dynamic QR
              </span>
            </h2>
            <p className="text-xs text-dark-500 mt-0.5">
              Tourist scans this one-time QR code to trigger immediate escrow release.
            </p>
          </div>
        </div>

        {/* Financial Badge */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-800 font-semibold block">Payout Upon Scan</span>
            <span className="text-lg font-black text-emerald-700 font-mono">
              ${guideEarnings.toFixed(2)} USDC
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 100% Direct Payout
            </span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200/80 rounded-2xl relative overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <DotsLoader size="lg" />
              <span className="text-xs font-semibold text-slate-500">Generating encrypted one-time QR...</span>
            </div>
          ) : isCompleted ? (
            <div className="py-12 flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-dark-900">Tour Completed!</h3>
              <p className="text-xs text-dark-500 max-w-xs">
                Escrow funds have been successfully released to your wallet.
              </p>
            </div>
          ) : qrData ? (
            <div className="flex flex-col items-center space-y-4">
              {/* QR Image with white frame */}
              <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 relative group">
                <img
                  src={qrImageUrl}
                  alt="Dynamic Tour Handshake QR Code"
                  className="w-56 h-56 object-contain rounded-xl"
                />
              </div>

              {/* Countdown & Live Indicator */}
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-semibold border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Listening for Tourist scan...
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200/70 text-slate-700 font-mono text-[11px] font-semibold">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {timeLeft}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 w-full justify-center">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn-outline py-2 px-4 text-xs font-semibold flex items-center gap-1.5 rounded-xl cursor-pointer hover:bg-slate-100"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Link Copied!" : "Copy Completion Link"}
                </button>
                <button
                  type="button"
                  onClick={generateQRToken}
                  className="btn-ghost py-2 px-3 text-xs font-semibold flex items-center gap-1 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Regenerate QR"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Failed to load QR code.
              <button onClick={generateQRToken} className="block mx-auto mt-2 text-primary font-bold">
                Retry
              </button>
            </div>
          )}
        </div>

        {/* 24-Hour Time-lock Fallback Explanation */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-amber-900 block">24-Hour Fallback Safety Net</span>
            <p className="text-amber-800/90 leading-relaxed text-[11px]">
              If the tourist cannot scan or goes offline, funds will <strong>automatically unlock and release to your wallet in 24 hours</strong> provided no dispute is raised.
            </p>
          </div>
        </div>

        {/* Optional Tour Photo for Dispute Evidence */}
        <div className="border-t border-dark-100 pt-3">
          <button
            type="button"
            onClick={() => setShowPhotoSection(!showPhotoSection)}
            className="text-xs text-dark-500 hover:text-dark-900 font-semibold flex items-center justify-between w-full py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              Optional: Attach Tour Photo (Dispute Evidence)
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {photoUrl ? "Attached" : "Optional"}
            </span>
          </button>

          {showPhotoSection && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Photos are completely optional. They are only reviewed in the event that the tourist opens a dispute.
              </p>
              {photoUrl ? (
                <div className="flex items-center gap-3">
                  <img src={photoUrl} alt="Dispute evidence" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                  <label className="text-xs text-primary font-bold cursor-pointer hover:underline">
                    Change Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <label className="btn-outline w-full py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer font-semibold">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingPhoto ? "Attaching..." : "Upload Photo (Optional)"}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
