"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, ExternalLink, CreditCard, DollarSign, Wallet, ArrowLeft, ShieldCheck, ArrowRightLeft } from "lucide-react";
import { connectWallet } from "@/lib/crypto/payment";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  token?: "USDT" | "USDC";
  gigTitle: string;
  bookingDate: string;
  onConfirm?: (txHash: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  token = "USDT",
  gigTitle,
  bookingDate,
  onConfirm,
}: PaymentModalProps) {
  const [step, setStep] = useState<"select_method" | "connect" | "confirm" | "processing" | "success" | "error" | "alchemypay" | "transak">("select_method");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState<"metamask" | "coinbase" | "solflare" | null>(null);

  // Alchemy Pay destination wallet
  const [alchemypayWallet, setAlchemypayWallet] = useState("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [showAlchemypayIframe, setShowAlchemypayIframe] = useState(false);

  // Transak destination wallet
  const [transakWallet, setTransakWallet] = useState("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [showTransakIframe, setShowTransakIframe] = useState(false);
  const [transakOrderId, setTransakOrderId] = useState("");

  if (!isOpen) return null;

  const handleConnectWallet = async (providerType: "metamask" | "coinbase" | "solflare") => {
    setConnecting(true);
    setWalletType(providerType);
    setError(null);
    try {
      const { address } = await connectWallet("base", providerType);
      setWalletAddress(address);
      setAlchemypayWallet(address); // Sync alchemy wallet with connected wallet
      setTransakWallet(address); // Sync transak wallet with connected wallet
      setStep("confirm");
    } catch (err: any) {
      setError(err.reason || err.message || "Connection failed");
      setStep("error");
    } finally {
      setConnecting(false);
      setWalletType(null);
    }
  };

  const handlePay = async () => {
    setStep("processing");
    setError(null);

    try {
      // Simulate direct blockchain smart contract deposit
      await new Promise((r) => setTimeout(r, 2500));
      const mockTxHash = "0xMOCK_WALLET_" + Array.from({length: 48}, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setTxHash(mockTxHash);
      setStep("success");
      onConfirm?.(mockTxHash);
    } catch (err: any) {
      setError(err.message || "Direct deposit transaction failed");
      setStep("error");
    }
  };

  const handleAlchemypayConfirm = async () => {
    setStep("processing");
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 2000));
      const mockTxHash = "0xMOCK_ALCHEMY_" + Array.from({length: 48}, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setTxHash(mockTxHash);
      setStep("success");
      onConfirm?.(mockTxHash);
    } catch (err: any) {
      setError(err.message || "Alchemy Pay verification failed");
      setStep("error");
    }
  };

  const handleTransakConfirm = async () => {
    if (!transakOrderId.trim()) {
      setError("Please enter your Transak Order ID.");
      return;
    }
    setStep("processing");
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setTxHash(transakOrderId.trim());
      setStep("success");
      onConfirm?.(transakOrderId.trim());
    } catch (err: any) {
      setError(err.message || "Transak verification failed");
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 bg-dark-50/50">
          <div className="flex items-center gap-2">
            {step !== "select_method" && step !== "success" && step !== "processing" && (
              <button 
                onClick={() => {
                  setError(null);
                  setStep("select_method");
                  setShowAlchemypayIframe(false);
                  setShowTransakIframe(false);
                }}
                className="text-dark-500 hover:text-dark-900 mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-lg font-bold text-dark-900">
              {step === "alchemypay" ? "Alchemy Pay Checkout" : step === "transak" ? "Transak Checkout" : "Checkout Payment"}
            </h3>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Order Summary */}
          {step !== "processing" ? (
            <div className="bg-dark-50 rounded-xl p-4 mb-6">
              <p className="text-[10px] uppercase font-bold tracking-wider text-dark-400 mb-1">Booking Details</p>
              <p className="font-semibold text-dark-900 text-sm">{gigTitle}</p>
              <p className="text-xs text-dark-500 mt-0.5">{bookingDate}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-200">
                <span className="text-dark-600 text-sm">Total Price</span>
                <span className="text-lg font-bold text-primary">
                  {amount.toFixed(2)} {token}
                </span>
              </div>
            </div>
          ) : null}

          {/* 1. STEP: SELECT METHOD */}
          {step === "select_method" && (
            <div className="space-y-3">
              <p className="text-xs text-dark-500 font-medium mb-3">Select your preferred payment gateway:</p>
              
              {/* Option A: Direct Web3 Wallet */}
              <button
                onClick={() => setStep("connect")}
                className="w-full flex items-center gap-4 p-4 border border-dark-200 rounded-xl hover:border-[#003087] hover:bg-[#003087]/5 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#003087]/10 text-[#003087] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-dark-900 text-sm block">Direct Web3 Wallet</span>
                  <span className="text-xs text-dark-400 block truncate">Pay with MetaMask, Coinbase, or Solflare</span>
                </div>
              </button>

              {/* Option B: Transak Gateway */}
              <button
                onClick={() => setStep("transak")}
                className="w-full flex items-center gap-4 p-4 border border-dark-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-dark-900 text-sm block">Credit Card (via Transak)</span>
                  <span className="text-xs text-dark-400 block truncate">Buy crypto instantly with credit card/Apple Pay</span>
                </div>
              </button>

              {/* Option C: Alchemy Pay Gateway */}
              <button
                onClick={() => setStep("alchemypay")}
                className="w-full flex items-center gap-4 p-4 border border-dark-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-dark-900 text-sm block">Credit Card (via Alchemy Pay)</span>
                  <span className="text-xs text-dark-400 block truncate">Alternative card checkout on Base</span>
                </div>
              </button>
            </div>
          )}

          {/* 2. STEP: CONNECT WALLET */}
          {step === "connect" && (
            <div className="space-y-4">
              <p className="text-xs text-dark-500 text-center mb-4">
                Select your crypto wallet to pay on Base:
              </p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleConnectWallet("metamask")}
                  disabled={connecting}
                  className="flex items-center gap-4 p-4 bg-white border border-dark-200 rounded-xl hover:border-primary hover:bg-dark-50 transition-all text-left group disabled:opacity-50 w-full"
                >
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/960px-MetaMask_Fox.svg.png" alt="MetaMask" className="w-8 h-8 object-contain" />
                  </div>
                  <div className="flex-grow">
                    <span className="font-semibold text-dark-900 text-sm block">MetaMask</span>
                    <span className="text-xs text-dark-400">Connect MetaMask extension</span>
                  </div>
                </button>

                <button
                  onClick={() => handleConnectWallet("coinbase")}
                  disabled={connecting}
                  className="flex items-center gap-4 p-4 bg-white border border-dark-200 rounded-xl hover:border-primary hover:bg-dark-50 transition-all text-left group disabled:opacity-50 w-full"
                >
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <img src="https://s3-symbol-logo.tradingview.com/coinbase--600.png" alt="Coinbase" className="w-8 h-8 object-contain rounded-lg" />
                  </div>
                  <div className="flex-grow">
                    <span className="font-semibold text-dark-900 text-sm block">Coinbase Wallet</span>
                    <span className="text-xs text-dark-400">Connect Coinbase extension or app</span>
                  </div>
                </button>

                <button
                  onClick={() => handleConnectWallet("solflare")}
                  disabled={connecting}
                  className="flex items-center gap-4 p-4 bg-white border border-dark-200 rounded-xl hover:border-primary hover:bg-dark-50 transition-all text-left group disabled:opacity-50 w-full"
                >
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <img src="https://www.solflare.com/wp-content/uploads/2024/11/App-Icon.svg" alt="Solflare" className="w-8 h-8 object-contain" />
                  </div>
                  <div className="flex-grow">
                    <span className="font-semibold text-dark-900 text-sm block">Solflare Wallet</span>
                    <span className="text-xs text-dark-400">Connect Solflare EVM wallet</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 3. STEP: CONFIRM WALLET */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-secondary font-medium">
                <CheckCircle2 className="w-4.5 h-4.5" />
                Wallet connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </div>
              <p className="text-xs text-dark-600 leading-relaxed">
                This will approve {amount.toFixed(2)} {token} and lock it in the smart contract escrow on the Base network. Gas fees are minimal (~$0.01).
              </p>
              <button onClick={handlePay} className="btn-primary w-full py-3 mt-2">
                Confirm & Pay Now
              </button>
            </div>
          )}

          {/* 4. STEP: ALCHEMY PAY FIAT ON-RAMP */}
          {step === "alchemypay" && (
            <div className="space-y-4 text-center py-6 animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-yellow-500/10 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-dark-900">Alchemy Pay Under Maintenance</h3>
              <p className="text-sm text-dark-600 max-w-xs mx-auto leading-relaxed">
                Alchemy Pay is currently undergoing scheduled platform upgrades. We will be back online on <strong className="text-dark-900 font-bold">July 20, 2026</strong>.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStep("select_method")}
                  className="btn-outline px-6 py-2.5 text-xs font-semibold rounded-xl"
                >
                  Choose Another Method
                </button>
              </div>
            </div>
          )}

          {/* 5. STEP: TRANSAK FLOW */}
          {step === "transak" && (
            <div className="space-y-4 text-center py-6 animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-yellow-500/10 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-dark-900">Transak Under Maintenance</h3>
              <p className="text-sm text-dark-600 max-w-xs mx-auto leading-relaxed">
                Transak Gateway is currently undergoing scheduled platform upgrades. We will be back online on <strong className="text-dark-900 font-bold">July 20, 2026</strong>.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStep("select_method")}
                  className="btn-outline px-6 py-2.5 text-xs font-semibold rounded-xl"
                >
                  Choose Another Method
                </button>
              </div>
            </div>
          )}

          {/* 6. STEP: GENERAL PROCESSING */}
          {step === "processing" && (
            <div className="text-center py-6">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-dark-700 font-medium">Processing payment...</p>
              <p className="text-sm text-dark-500 mt-1">Please wait while we lock funds in smart escrow</p>
            </div>
          )}

          {/* 7. STEP: SUCCESS */}
          {step === "success" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-secondary" />
              </div>
              <h4 className="text-lg font-bold text-dark-900 mb-1">Payment Successful!</h4>
              <p className="text-sm text-dark-500 mb-4">Your booking has been created in escrow</p>
              {txHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  View transaction <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button onClick={onClose} className="btn-primary w-full mt-4">
                Done
              </button>
            </div>
          )}

          {/* 8. STEP: ERROR */}
          {step === "error" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-danger" />
              </div>
              <h4 className="text-lg font-bold text-dark-900 mb-1">Payment Failed</h4>
              <p className="text-sm text-danger mb-4">{error}</p>
              <button
                onClick={() => setStep("select_method")}
                className="btn-primary w-full"
              >
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
