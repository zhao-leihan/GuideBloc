"use client";

import { useState } from "react";
import { Heart, X, Loader2, CheckCircle2 } from "lucide-react";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  guideName: string;
  bookingTotal: number;
  onTip?: (amount: number, message: string) => void;
}

export default function TipModal({
  isOpen,
  onClose,
  guideName,
  bookingTotal,
  onTip,
}: TipModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const suggestions = [
    Math.max(1, Math.round(bookingTotal * 0.05)),
    Math.max(2, Math.round(bookingTotal * 0.1)),
    Math.max(3, Math.round(bookingTotal * 0.15)),
    Math.max(5, Math.round(bookingTotal * 0.2)),
  ];

  const handleTip = async () => {
    if (amount <= 0) return;
    setProcessing(true);

    try {
      await new Promise((r) => setTimeout(r, 2000));
      setSuccess(true);
      onTip?.(amount, message);
    } catch {
      // Handle error
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-danger" />
            <h3 className="text-lg font-bold text-dark-900">Leave a Tip</h3>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!success ? (
            <>
              <p className="text-dark-600 mb-4 text-center">
                Show your appreciation to <strong>{guideName}</strong>
              </p>

              {/* Amount suggestions */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setAmount(s)}
                    className={`py-2 rounded-xl text-sm font-medium transition-all ${
                      amount === s
                        ? "bg-primary text-white"
                        : "bg-dark-100 text-dark-700 hover:bg-dark-200"
                    }`}
                  >
                    ${s}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="relative mb-4">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 font-medium">
                  $
                </span>
                <input
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="input pl-8 text-lg font-bold text-center"
                  placeholder="Custom amount"
                  min={1}
                />
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input mb-4 resize-none"
                rows={2}
                placeholder="Say thanks... (optional)"
                maxLength={200}
              />

              <button
                onClick={handleTip}
                disabled={amount <= 0 || processing}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Send {amount > 0 ? `$${amount}` : ""} Tip
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-secondary" />
              </div>
              <h4 className="text-lg font-bold text-dark-900 mb-1">Tip Sent!</h4>
              <p className="text-sm text-dark-500">
                ${amount} USDT sent to {guideName}
              </p>
              <button onClick={onClose} className="btn-primary w-full mt-4">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
