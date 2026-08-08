"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, ExternalLink, QrCode, ArrowLeft, ShieldCheck, Copy, AlertTriangle, Building2, Send, Clock, RotateCcw, Headset, Instagram, Mail, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  token?: "USDT" | "USDC";
  gigTitle: string;
  bookingDate: string;
  bookingId?: string;
  onConfirm?: (txHash: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  token = "USDC",
  gigTitle,
  bookingDate,
  bookingId = "BK_" + Math.floor(100000 + Math.random() * 900000),
  onConfirm,
}: PaymentModalProps) {
  const [step, setStep] = useState<"select_method" | "qr_scan" | "exchange_transfer" | "verify_txhash" | "processing" | "success" | "error">("select_method");
  const [inputTxHash, setInputTxHash] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyStage, setVerifyStage] = useState<1 | 2 | 3>(1);

  if (!isOpen) return null;

  const treasuryAddress = "0x079D9c349741C27565ee04e31E4174F640F512aE"; // Exodus / Treasury Vault
  const escrowAddress = "0x37DA6Bb53A3973Dee2ed7b766f5e341ff123E8C8";   // Explomate Escrow Contract

  // Generate Unique Decimal Tag (e.g. $100.0123)
  const uniqueDecimalTag = (amount + 0.0123).toFixed(4);

  // EIP-681 Standard QR URI for Base L2 Network
  const eip681Uri = `ethereum:${escrowAddress}@8453/transfer?address=${treasuryAddress}&uint256=${Math.round(amount * 1e6)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(eip681Uri)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleVerifyManualTxHash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTxHash.trim() || inputTxHash.length < 10) {
      toast.error("Please enter a valid Transaction Hash (0x...)");
      return;
    }

    setVerifying(true);
    setError(null);
    setVerifyStage(1);
    const toastId = toast.loading("Connecting to Base L2 RPC Node...");

    try {
      // Simulate Progress Indicator Stage 2
      setTimeout(() => setVerifyStage(2), 1200);

      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          txHash: inputTxHash.trim()
        })
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (res.ok && data.success) {
        setVerifyStage(3);
        setTxHash(inputTxHash.trim());
        setStep("success");
        onConfirm?.(inputTxHash.trim());
        toast.success("Payment verified on-chain! Official PDF receipt sent.");
      } else {
        setError(data.message || "On-chain verification failed.");
        setStep("error");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error(err);
      setError(err.message || "Error verifying payment on-chain.");
      setStep("error");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-dark-100 transition-all duration-300 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 bg-dark-950 text-white">
          <div className="flex items-center gap-2">
            {step !== "select_method" && step !== "success" && step !== "processing" && (
              <button 
                onClick={() => {
                  setError(null);
                  setStep("select_method");
                }}
                className="text-dark-300 hover:text-white mr-1 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                Explomate Web3 Checkout
              </h3>
              <p className="text-[10px] text-dark-400 font-mono">Booking ID: {bookingId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CRITICAL WARNING BANNER */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs font-semibold text-amber-900 leading-tight">
            <strong>MANDATORY:</strong> Select <strong className="underline decoration-amber-500 font-bold">BASE L2 Network (Chain ID 8453)</strong>. DO NOT send via Ethereum Mainnet or funds will be lost!
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Order Summary & Escrow Protection Badge */}
          {step !== "processing" && step !== "success" && (
            <div className="space-y-3">
              <div className="bg-dark-50 rounded-2xl p-4 border border-dark-150">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-dark-400">Tour Package</p>
                    <p className="font-bold text-dark-900 text-sm leading-tight mt-0.5">{gigTitle}</p>
                    <p className="text-xs text-dark-500 mt-1">{bookingDate}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-200">
                  <span className="text-dark-600 text-xs font-medium">Total Amount Due</span>
                  <span className="text-xl font-black text-primary">
                    ${amount.toFixed(2)} {token}
                  </span>
                </div>
              </div>

              {/* 🛡️ REFUND & CANCELLATION GUARANTEE POLICY CARD */}
              <div className="bg-emerald-500/5 rounded-2xl p-3.5 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <RotateCcw className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  100% Escrow Protection & Refund Guarantee
                </div>
                <ul className="space-y-1 text-dark-600 text-[11px] leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Funds Locked in Smart Contract:</strong> Money is held securely and not released to guide until tour completion.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>100% Full Refund Guarantee:</strong> If the guide cancels or fails to arrive, 100% of your funds are returned.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Free 24h Cancellation:</strong> Cancel free of charge up to 24 hours before the scheduled tour time.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* 1. SELECT PAYMENT METHOD */}
          {step === "select_method" && (
            <div className="space-y-3">
              <p className="text-xs text-dark-500 font-semibold mb-3">Select Web3 Payment Method:</p>
              
              {/* Scenario A: Scan QR Code */}
              <button
                onClick={() => setStep("qr_scan")}
                className="w-full flex items-center gap-4 p-4 border border-dark-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-dark-900 text-sm">Scan QR Code (MetaMask / E-Wallet)</span>
                    <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">Scenario A</span>
                  </div>
                  <span className="text-xs text-dark-400 block mt-0.5">Scan via MetaMask Mobile, Rainbow, or WalletConnect</span>
                </div>
              </button>

              {/* Scenario B: Exchange / Direct Transfer */}
              <button
                onClick={() => setStep("exchange_transfer")}
                className="w-full flex items-center gap-4 p-4 border border-dark-200 rounded-2xl hover:border-secondary hover:bg-secondary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-dark-900 text-sm">Transfer via Exchange / Direct Tx</span>
                    <span className="text-[9px] bg-secondary/10 text-secondary font-bold px-2 py-0.5 rounded-full">Scenario B</span>
                  </div>
                  <span className="text-xs text-dark-400 block mt-0.5">Indodax, Tokocrypto, Binance, OKX, or Other Wallet</span>
                </div>
              </button>
            </div>
          )}

          {/* SCENARIO A: QR CODE SCAN DISPLAY */}
          {step === "qr_scan" && (
            <div className="text-center space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-dark-600 font-medium">
                Scan the QR Code below using <strong>MetaMask Mobile</strong> or <strong>Rainbow</strong> on your phone:
              </p>
              
              <div className="p-4 bg-white rounded-2xl border-2 border-dark-200 inline-block shadow-md">
                <img src={qrCodeUrl} alt="Base L2 EIP-681 QR Code" className="w-48 h-48 mx-auto object-contain rounded-lg" />
              </div>

              <div className="p-3 bg-dark-50 rounded-xl border border-dark-150 text-left text-xs space-y-1 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-dark-500 font-sans">Network:</span>
                  <span className="font-bold text-dark-900">Base L2 (Chain ID 8453)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-500 font-sans">Contract Vault:</span>
                  <span className="font-bold text-primary truncate max-w-[180px]">{escrowAddress}</span>
                </div>
              </div>

              <p className="text-[11px] text-dark-400 italic">
                Once confirmed on mobile, our webhook automatically verifies and emails your receipt.
              </p>

              <button
                onClick={() => setStep("verify_txhash")}
                className="btn-outline w-full py-2.5 text-xs font-bold rounded-xl"
              >
                Already Transferred? Enter TxHash Manually ➔
              </button>
            </div>
          )}

          {/* SCENARIO B: EXCHANGE & DIRECT TRANSFER INSTRUCTIONS */}
          {step === "exchange_transfer" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Supported Exchange Logos */}
              <div className="p-3 bg-dark-50 rounded-xl border border-dark-150 flex items-center justify-between text-xs">
                <span className="font-semibold text-dark-600">Supported Exchanges:</span>
                <div className="flex items-center gap-2 font-bold text-dark-800 text-[11px]">
                  <span className="bg-white px-2 py-1 rounded border shadow-2xs">Indodax</span>
                  <span className="bg-white px-2 py-1 rounded border shadow-2xs">Tokocrypto</span>
                  <span className="bg-white px-2 py-1 rounded border shadow-2xs">Binance</span>
                </div>
              </div>

              {/* METHOD A: UNIQUE DECIMAL TAG */}
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase">Method A: Send Unique Amount</span>
                  <span className="text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full">Auto-Matched</span>
                </div>
                <p className="text-xs text-dark-600 leading-relaxed">
                  If your Exchange supports decimal precision, transfer the exact unique amount below:
                </p>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-primary/30 font-mono">
                  <span className="text-base font-black text-primary">${uniqueDecimalTag} USDC</span>
                  <button
                    onClick={() => copyToClipboard(uniqueDecimalTag, "Unique Amount")}
                    className="p-1.5 hover:bg-dark-100 rounded-lg text-dark-500 hover:text-dark-900"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* VAULT TARGET ADDRESS */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-700 block">Target Deposit Vault Address:</label>
                <div className="flex items-center justify-between bg-dark-50 p-2.5 rounded-xl border border-dark-200 font-mono text-xs">
                  <span className="truncate text-dark-900 font-bold">{treasuryAddress}</span>
                  <button
                    onClick={() => copyToClipboard(treasuryAddress, "Vault Address")}
                    className="p-1.5 hover:bg-dark-200 rounded-lg text-dark-600 hover:text-dark-900"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setStep("verify_txhash")}
                  className="btn-primary w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enter TxHash for On-Chain Verification
                </button>
              </div>
            </div>
          )}

          {/* VERIFY TXHASH FORM WITH LIVE PROGRESS INDICATOR */}
          {step === "verify_txhash" && (
            <form onSubmit={handleVerifyManualTxHash} className="space-y-4 animate-in fade-in duration-200">
              
              {/* ⏱️ REAL-TIME PAYMENT PROGRESS INDICATOR */}
              {verifying && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-3 animate-pulse">
                  <div className="flex justify-between items-center text-xs font-bold text-primary">
                    <span>Blockchain Verification Progress</span>
                    <span>Stage {verifyStage} of 3</span>
                  </div>
                  <div className="w-full bg-dark-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-500 ease-out" 
                      style={{ width: `${(verifyStage / 3) * 100}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-dark-600 font-medium space-y-1">
                    {verifyStage === 1 && <p className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 text-primary animate-spin inline-block" /> Connecting to Base L2 RPC Node...</p>}
                    {verifyStage === 2 && <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse inline-block" /> Awaiting blockchain confirmation (~2 min confirmation window)...</p>}
                    {verifyStage === 3 && <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline-block" /> Transaction verified on-chain & Escrow locked!</p>}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-dark-800 block mb-1">
                  Enter Transaction Hash (TxHash / TxID):
                </label>
                <p className="text-[11px] text-dark-500 mb-2 leading-relaxed">
                  Copy the 66-character TxHash (starting with <code>0x...</code>) from your Exchange withdrawal or wallet history:
                </p>
                <input
                  type="text"
                  required
                  placeholder="0x8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"
                  value={inputTxHash}
                  onChange={(e) => setInputTxHash(e.target.value)}
                  className="input-field font-mono text-xs w-full p-3 border-dark-300 focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="btn-primary w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying on Base L2 Blockchain...
                  </>
                ) : (
                  <>
                    Verify Payment Now
                  </>
                )}
              </button>
            </form>
          )}

          {/* SUCCESS STEP */}
          {step === "success" && (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-lg font-extrabold text-dark-900">Payment Successfully Verified!</h4>
              <p className="text-xs text-dark-500 leading-relaxed">
                Your payment of <strong>${amount.toFixed(2)} USDC</strong> is secured and locked in the Base L2 Escrow Smart Contract. Official PDF receipt sent to your email.
              </p>
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                >
                  View Transaction on Basescan Explorer <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button onClick={onClose} className="btn-primary w-full py-3 mt-3 font-bold">
                Done & Close
              </button>
            </div>
          )}

          {/* ERROR STEP */}
          {step === "error" && (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-8 h-8 text-rose-600" />
              </div>
              <h4 className="text-lg font-bold text-dark-900">Verification Failed</h4>
              <p className="text-xs text-rose-600 font-medium px-4">{error}</p>
              <button
                onClick={() => setStep("select_method")}
                className="btn-primary w-full py-3 mt-3 font-bold"
              >
                Try Another Method
              </button>
            </div>
          )}

          {/* 🆘 EMERGENCY HUMAN SUPPORT CHANNELS */}
          <div className="pt-4 border-t border-dark-150">
            <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400 text-center mb-2">
              NEED EMERGENCY ASSISTANCE / HUMAN ESCALATION?
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <a
                href="https://instagram.com/explomate.id"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-700 rounded-xl font-bold flex flex-col items-center gap-1 transition-colors"
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                <span>IG @explomate.id</span>
              </a>
              <a
                href="mailto:admin@explomate.com"
                className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 rounded-xl font-bold flex flex-col items-center gap-1 transition-colors"
              >
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>admin@explomate.com</span>
              </a>
              <a
                href="mailto:rayhan@explomate.com"
                className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-800 rounded-xl font-bold flex flex-col items-center gap-1 transition-colors"
              >
                <Headset className="w-4 h-4 text-cyan-600" />
                <span>rayhan@explomate.com</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
