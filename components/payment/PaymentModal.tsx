"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, ExternalLink, CreditCard, DollarSign, Wallet, ArrowLeft, ShieldCheck } from "lucide-react";
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
  const [step, setStep] = useState<"select_method" | "connect" | "confirm" | "processing" | "success" | "error" | "moonpay" | "paypal_flow">("select_method");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState<"metamask" | "coinbase" | "solflare" | null>(null);

  // MoonPay destination wallet
  const [moonpayWallet, setMoonpayWallet] = useState("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [showMoonpayIframe, setShowMoonpayIframe] = useState(false);

  // PayPal checkout variables
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalPassword, setPaypalPassword] = useState("");
  const [paypalStep, setPaypalStep] = useState<"login" | "review" | "processing">("login");
  const [paypalProcessingStatus, setPaypalProcessingStatus] = useState("");

  if (!isOpen) return null;

  const handleConnectWallet = async (providerType: "metamask" | "coinbase" | "solflare") => {
    setConnecting(true);
    setWalletType(providerType);
    setError(null);
    try {
      const { address } = await connectWallet("base", providerType);
      setWalletAddress(address);
      setMoonpayWallet(address); // Sync moonpay wallet with connected wallet
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
      setError(err.message || "Payment failed");
      setStep("error");
    }
  };

  const handleMoonpayConfirm = async () => {
    setStep("processing");
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 2000));
      const mockTxHash = "0xMOCK_MOONPAY_" + Array.from({length: 48}, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setTxHash(mockTxHash);
      setStep("success");
      onConfirm?.(mockTxHash);
    } catch (err: any) {
      setError(err.message || "MoonPay verification failed");
      setStep("error");
    }
  };

  const handlePaypalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paypalStep === "login") {
      setPaypalStep("review");
    }
  };

  const handlePaypalPay = async () => {
    setPaypalStep("processing");
    setPaypalProcessingStatus("Verifying PayPal credentials...");
    await new Promise((r) => setTimeout(r, 1500));
    setPaypalProcessingStatus("PayPal payment approved. Converting USD to Web3 liquidity...");
    await new Promise((r) => setTimeout(r, 1500));
    setPaypalProcessingStatus(`Minting smart escrow contract lock for ${amount} ${token} on Polygon...`);
    await new Promise((r) => setTimeout(r, 1500));

    try {
      const mockTxHash = "0xMOCK_PAYPAL_" + Array.from({length: 48}, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setTxHash(mockTxHash);
      setStep("success");
      onConfirm?.(mockTxHash);
    } catch (err: any) {
      setError(err.message || "PayPal Web3 bridge failed");
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
                  setShowMoonpayIframe(false);
                  setPaypalStep("login");
                }}
                className="text-dark-500 hover:text-dark-900 mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-lg font-bold text-dark-900">
              {step === "moonpay" ? "MoonPay Checkout" : step === "paypal_flow" ? "PayPal Bridged Checkout" : "Checkout Payment"}
            </h3>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Order Summary */}
          {step !== "paypal_flow" || paypalStep !== "processing" ? (
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
                className="w-full flex items-center gap-4 p-4 border border-dark-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-dark-900 text-sm block">Direct Web3 Wallet</span>
                  <span className="text-xs text-dark-400 block truncate">Pay with MetaMask, Coinbase, or Solflare</span>
                </div>
              </button>

              {/* Option B: MoonPay Fiat-to-Crypto */}
              <button
                onClick={() => setStep("moonpay")}
                className="w-full flex items-center gap-4 p-4 border border-dark-200 rounded-xl hover:border-[#7A00FF] hover:bg-[#7A00FF]/5 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#7A00FF]/10 text-[#7A00FF] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-dark-900 text-sm block">Credit Card (via MoonPay)</span>
                  <span className="text-xs text-dark-400 block truncate">Buy crypto instantly with credit card/Apple Pay</span>
                </div>
              </button>

              {/* Option C: PayPal Web3 Bridged */}
              <button
                onClick={() => setStep("paypal_flow")}
                className="w-full flex items-center gap-4 p-4 border border-dark-200 rounded-xl hover:border-[#003087] hover:bg-[#003087]/5 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#003087]/10 text-[#003087] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-dark-900 text-sm block">PayPal (Web3 Bridged)</span>
                  <span className="text-xs text-dark-400 block truncate">Pay with PayPal; Guide receives USDT/USDC</span>
                </div>
              </button>
            </div>
          )}

          {/* 2. STEP: CONNECT WALLET */}
          {step === "connect" && (
            <div className="space-y-4">
              <p className="text-xs text-dark-500 text-center mb-4">
                Select your crypto wallet to pay on Polygon:
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

          {/* 4. STEP: MOONPAY FIAT ON-RAMP */}
          {step === "moonpay" && (
            <div className="space-y-4">
              {!showMoonpayIframe ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-1.5">Polygon Wallet Address (to receive USDT/USDC)</label>
                    <input 
                      type="text" 
                      value={moonpayWallet} 
                      onChange={e => setMoonpayWallet(e.target.value)}
                      className="w-full p-3 border border-dark-200 rounded-xl focus:border-[#7A00FF] focus:ring-1 focus:ring-[#7A00FF] outline-none font-mono text-xs text-dark-900"
                      placeholder="0x..."
                      required
                    />
                    <p className="text-[10px] text-dark-400 mt-1">Prefilled with DApp address. Replace if you want to use a custom address.</p>
                  </div>
                  <button 
                    onClick={() => setShowMoonpayIframe(true)}
                    className="w-full bg-[#7A00FF] hover:bg-[#6400d1] text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-[#7A00FF]/25 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" /> Open MoonPay Sandbox
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="border border-dark-200 rounded-2xl overflow-hidden shadow-inner">
                    <iframe 
                      src={`https://buy-sandbox.moonpay.com?apiKey=pk_test_Ol50lJrgbXKJ6vGqRQ7T1ePRjtdTsqF&currencyCode=${token.toLowerCase()}&walletAddress=${moonpayWallet}&baseCurrencyCode=usd&baseCurrencyAmount=${amount}`}
                      className="w-full h-[380px] border-0"
                      allow="accelerometer; autoplay; camera; gyroscope; payment"
                    ></iframe>
                  </div>
                  <button 
                    onClick={handleMoonpayConfirm}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5" /> I Have Completed MoonPay Checkout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. STEP: PAYPAL FLOW */}
          {step === "paypal_flow" && (
            <div className="animate-in fade-in zoom-in duration-200">
              {paypalStep === "login" && (
                <form onSubmit={handlePaypalSubmit} className="space-y-4">
                  <div className="bg-[#003087] text-white p-4 rounded-xl flex items-center justify-between mb-4">
                    <span className="font-bold text-sm">PayPal Sandbox</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Web3 Liquidity Bridge</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark-600 uppercase mb-1">PayPal Email Address</label>
                    <input 
                      type="email" 
                      value={paypalEmail}
                      onChange={e => setPaypalEmail(e.target.value)}
                      placeholder="buyer@paypal.com"
                      className="w-full p-3 border border-dark-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark-600 uppercase mb-1">PayPal Password</label>
                    <input 
                      type="password" 
                      value={paypalPassword}
                      onChange={e => setPaypalPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-3 border border-dark-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#0079C1] hover:bg-[#00457C] text-white font-bold py-3 rounded-xl transition-all shadow-md mt-2">
                    Log In to PayPal
                  </button>
                </form>
              )}

              {paypalStep === "review" && (
                <div className="space-y-4">
                  <div className="bg-[#f8fafc] border border-dark-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-dark-100 pb-2">
                      <span className="text-dark-500">Destination</span>
                      <span className="font-bold text-dark-900">Explomate.ly Escrow Pool</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-dark-100 pb-2">
                      <span className="text-dark-500">Payment Source</span>
                      <span className="font-medium text-dark-900 flex items-center gap-1.5">
                        💳 Visa •••• 4242
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-dark-500">Amount to Charge</span>
                      <span className="font-extrabold text-dark-900 text-sm">${amount.toFixed(2)} USD</span>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-[11px] text-primary-700 leading-normal">
                    <strong>Fiat-to-Crypto Bridge Notice:</strong> Explomate&apos;s automated liquidity pool automatically locks the corresponding {amount.toFixed(2)} {token} in the smart contract escrow on Polygon once your PayPal payment is completed.
                  </div>

                  <button 
                    onClick={handlePaypalPay}
                    className="w-full bg-[#0079C1] hover:bg-[#00457C] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4.5 h-4.5" /> Agree &amp; Pay Now
                  </button>
                </div>
              )}

              {paypalStep === "processing" && (
                <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
                  <Loader2 className="w-10 h-10 text-[#0079C1] animate-spin mx-auto" />
                  <div>
                    <p className="text-dark-900 font-semibold text-sm">Executing Bridge...</p>
                    <p className="text-xs text-dark-500 mt-1">{paypalProcessingStatus}</p>
                  </div>
                </div>
              )}
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
                  href={`https://amoy.polygonscan.com/tx/${txHash}`}
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
