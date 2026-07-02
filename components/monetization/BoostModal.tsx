"use client";

import { useState } from "react";
import { Zap, X, Loader2, CheckCircle2 } from "lucide-react";
import { StarFilledIcon, ArrowUpIcon, LightningBoltIcon } from "@radix-ui/react-icons";
import { BOOST_OPTIONS, type BoostType } from "@/lib/monetization/boost";

const boostIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  StarFilledIcon,
  ArrowUpIcon,
  LightningBoltIcon,
};

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  gigId: string;
  gigTitle: string;
  onPurchase?: (boostType: BoostType, txHash: string) => void;
}

export default function BoostModal({
  isOpen,
  onClose,
  gigId,
  gigTitle,
  onPurchase,
}: BoostModalProps) {
  const [selected, setSelected] = useState<BoostType | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    if (!selected) return;
    setProcessing(true);

    try {
      // In production, this calls the crypto payment + boost API
      await new Promise((r) => setTimeout(r, 2000));
      const mockTxHash = "0x" + Math.random().toString(16).slice(2, 66);
      setSuccess(true);
      onPurchase?.(selected, mockTxHash);
    } catch {
      // Handle error
    } finally {
      setProcessing(false);
    }
  };

  const selectedBoost = BOOST_OPTIONS.find((b) => b.type === selected);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold text-dark-900">Boost Your Gig</h3>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!success ? (
            <>
              <p className="text-dark-600 mb-4">
                Get more visibility for <strong>{gigTitle}</strong>
              </p>

              <div className="space-y-3 mb-6">
                {BOOST_OPTIONS.map((boost) => (
                  <button
                    key={boost.type}
                    onClick={() => setSelected(boost.type)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selected === boost.type
                        ? "border-primary bg-primary/5"
                        : "border-dark-200 hover:border-dark-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const IconComp = boostIconMap[boost.icon];
                        return IconComp ? <IconComp className="w-6 h-6 text-secondary" /> : null;
                      })()}
                      <div className="flex-1">
                        <p className="font-medium text-dark-900">{boost.name}</p>
                        <p className="text-xs text-dark-500 mt-0.5">{boost.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-dark-900">${boost.priceUSD}</p>
                        <p className="text-xs text-dark-400">{boost.durationHours}h</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handlePurchase}
                disabled={!selected || processing}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Boost for ${selectedBoost?.priceUSD || "0"} USDT
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-secondary" />
              </div>
              <h4 className="text-lg font-bold text-dark-900 mb-1">Boost Active!</h4>
              <p className="text-sm text-dark-500 mb-4">
                Your gig is now {selectedBoost?.name.toLowerCase()} for the next {selectedBoost?.durationHours} hours
              </p>
              <button onClick={onClose} className="btn-primary w-full">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
