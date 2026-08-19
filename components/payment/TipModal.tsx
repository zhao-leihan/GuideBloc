"use client";

import { useState } from "react";
import { X, Loader2, ShieldCheck, CheckCircle2, AlertCircle, Heart } from "lucide-react";
import PaymentModal from "@/components/payment/PaymentModal";
import toast from "react-hot-toast";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  gigTitle: string;
}

const PRESET_AMOUNTS = [2, 5, 10, 20];

export default function TipModal({ isOpen, onClose, bookingId, gigTitle }: TipModalProps) {
  const [step, setStep] = useState<"amount" | "pay" | "done">("amount");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!isOpen) return null;

  const tipAmount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : 0);
  const isValidAmount = tipAmount > 0 && tipAmount <= 1000;

  const handleProceed = () => {
    if (!isValidAmount) return;
    setShowPayModal(true);
  };

  const handlePaymentConfirmed = async (hash: string, network: string) => {
    setShowPayModal(false);
    setConfirming(true);
    setTxHash(hash);

    try {
      const res = await fetch("/api/monetization/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: hash,
          amountUSD: tipAmount,
          bookingId,
          network,
        }),
      });

      if (res.ok) {
        setStep("done");
        toast.success("Tip sent. Thank you!");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to record tip");
      }
    } catch (e) {
      toast.error("Network error sending tip");
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    setStep("amount");
    setSelectedAmount(null);
    setCustomAmount("");
    setTxHash(null);
    setShowPayModal(false);
    setConfirming(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 text-dark-400 hover:text-dark-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Amount selection step */}
          {step === "amount" && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-dark-900">Tip the App</h3>
                </div>
                <p className="text-xs text-dark-400 leading-relaxed">
                  Your tip goes directly to Explomate to support platform development.
                  Pay any amount in USDC.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">
                  Quick Select
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      onClick={() => {
                        setSelectedAmount(a);
                        setCustomAmount("");
                      }}
                      className={`py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                        selectedAmount === a
                          ? "bg-primary text-white border-primary"
                          : "border-dark-200 text-dark-700 hover:border-primary hover:text-primary"
                      }`}
                    >
                      ${a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">
                  Custom Amount
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 font-semibold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    max="1000"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    placeholder="Enter amount..."
                    className="input pl-7 w-full text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 text-xs font-medium">
                    USDC
                  </span>
                </div>
              </div>

              {isValidAmount && (
                <div className="bg-dark-50 rounded-xl p-3 flex items-center justify-between text-sm">
                  <span className="text-dark-500">Tip amount</span>
                  <span className="font-bold text-dark-900">${tipAmount.toFixed(2)} USDC</span>
                </div>
              )}

              <button
                onClick={handleProceed}
                disabled={!isValidAmount}
                className="btn-primary w-full py-3 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Payment
              </button>

              <div className="flex items-start gap-2 text-xs text-dark-400">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-secondary" />
                <span>Paid on-chain via your Web3 wallet. No card required.</span>
              </div>
            </div>
          )}

          {/* Confirming step */}
          {confirming && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="font-semibold text-dark-900 text-sm">Recording tip...</p>
              <p className="text-xs text-dark-400 font-mono break-all">{txHash}</p>
            </div>
          )}

          {/* Done step */}
          {step === "done" && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-dark-900">Tip Sent</h3>
                <p className="text-sm text-dark-500 mt-1">
                  ${tipAmount.toFixed(2)} USDC sent to the Explomate platform. Thank you.
                </p>
              </div>
              {txHash && (
                <p className="text-xs text-dark-400 font-mono break-all bg-dark-50 p-2 rounded-lg">
                  {txHash.slice(0, 12)}...{txHash.slice(-8)}
                </p>
              )}
              <button
                onClick={handleClose}
                className="btn-primary w-full py-2.5 text-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested PaymentModal */}
      {showPayModal && (
        <PaymentModal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          amount={tipAmount}
          token="USDC"
          gigTitle={`Tip — ${gigTitle}`}
          bookingDate={new Date().toISOString().slice(0, 10)}
          bookingId={`TIP_${bookingId.slice(-6)}`}
          onConfirm={handlePaymentConfirmed}
        />
      )}
    </>
  );
}
