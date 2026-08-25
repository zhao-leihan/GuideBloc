"use client";

import { useState } from "react";
import { 
  X, Loader2, CheckCircle2, AlertCircle, ArrowLeft, 
  ShieldCheck, Copy, AlertTriangle, QrCode, 
  ChevronRight, RefreshCw, Check, Sparkles, ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import DotsLoader from "@/components/ui/DotsLoader";
import { 
  fetchConnectedAccountsDetails, 
  WalletAccountDetails, 
  SupportedWalletType, 
  SupportedNetwork,
  isMobileBrowser, 
  openMobileWalletDeepLink,
  getTokenAddress,
  getEscrowAddress
} from "@/lib/crypto/payment";
import { ethers } from "ethers";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  token?: "USDT" | "USDC";
  gigTitle: string;
  bookingDate: string;
  bookingId?: string;
  onConfirm?: (txHash: string, network: string) => void;
}

// Exact USDC & USDT Token Logos
const USDCLogo = (
  <img 
    src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Circle_USDC_Logo.svg/1280px-Circle_USDC_Logo.svg.png" 
    alt="USDC" 
    className="w-5 h-5 object-contain flex-shrink-0" 
  />
);

const USDTLogo = (
  <img 
    src="https://upload.wikimedia.org/wikipedia/commons/0/01/USDT_Logo.png" 
    alt="USDT" 
    className="w-5 h-5 object-contain flex-shrink-0" 
  />
);

// Official Avalanche C-Chain Network Logo
const AvaxLogo = (
  <img 
    src="https://cryptologos.cc/logos/avalanche-avax-logo.png?v=032" 
    alt="AVAX" 
    className="w-4 h-4 object-contain flex-shrink-0" 
  />
);

// High-Definition Official Web3 Wallet Logos
const WalletLogos: Record<string, React.ReactNode> = {
  metamask: (
    <img 
      src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
      alt="MetaMask" 
      className="w-7 h-7 flex-shrink-0 object-contain" 
    />
  ),
  walletconnect: (
    <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#3B99FC"/>
      <path d="M9.8 12.8C13.2 9.4 18.8 9.4 22.2 12.8L22.8 13.4C23.1 13.7 23.1 14.1 22.8 14.4L21.4 15.8C21.3 15.9 21.0 15.9 20.9 15.8L20.0 14.9C17.8 12.7 14.2 12.7 12.0 14.9L11.0 15.8C10.9 15.9 10.7 15.9 10.5 15.8L9.2 14.4C8.9 14.1 8.9 13.7 9.2 13.4L9.8 12.8ZM25.0 15.6L26.2 16.8C26.5 17.1 26.5 17.5 26.2 17.8L20.8 23.2C20.5 23.5 20.1 23.5 19.8 23.2L16.0 19.4C15.9 19.3 15.8 19.3 15.7 19.4L11.9 23.2C11.6 23.5 11.2 23.5 10.9 23.2L5.5 17.8C5.2 17.5 5.2 17.1 5.5 16.8L6.7 15.6C7.0 15.3 7.4 15.3 7.7 15.6L11.5 19.4C11.6 19.5 11.7 19.5 11.8 19.4L15.6 15.6C15.9 15.3 16.3 15.3 16.6 15.6L20.4 19.4C20.5 19.5 20.6 19.5 20.7 19.4L24.5 15.6C24.8 15.3 25.0 15.3 25.0 15.6Z" fill="white"/>
    </svg>
  ),
  coinbase: (
    <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0052FF"/>
      <rect x="9" y="9" width="14" height="14" rx="3" fill="white"/>
      <rect x="12" y="12" width="8" height="8" rx="1.5" fill="#0052FF"/>
    </svg>
  ),
  trust: (
    <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0500FF"/>
      <path d="M16 6L7 11V17C7 22.5 10.8 27.6 16 29C21.2 27.6 25 22.5 25 17V11L16 6Z" fill="#3375BB"/>
      <path d="M16 8L9 11.9V16.8C9 21.1 12 25 16 26.1V8Z" fill="white"/>
    </svg>
  ),
  rainbow: (
    <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#1C1C1E"/>
      <path d="M7 23C7 18.0294 11.0294 14 16 14C20.9706 14 25 18.0294 25 23" stroke="#FF453A" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M10 23C10 19.6863 12.6863 17 16 17C19.3137 17 22 19.6863 22 23" stroke="#FF9F0A" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M13 23C13 21.3431 14.3431 20 16 20C17.6569 20 19 21.3431 19 23" stroke="#30D158" strokeWidth="3.5" strokeLinecap="round"/>
    </svg>
  ),
  okx: (
    <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="16" fill="#000000"/>
      <rect x="7" y="7" width="6" height="6" fill="white"/>
      <rect x="19" y="7" width="6" height="6" fill="white"/>
      <rect x="13" y="13" width="6" height="6" fill="white"/>
      <rect x="7" y="19" width="6" height="6" fill="white"/>
      <rect x="19" y="19" width="6" height="6" fill="white"/>
    </svg>
  ),
  phantom: (
    <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#AB9FF2"/>
      <path d="M22.5 16.5C22.5 12.9101 19.5899 10 16 10C12.4101 10 9.5 12.9101 9.5 16.5C9.5 20.0899 12.4101 23 16 23C16.8 23 17.5 22.8 18.2 22.5L20 24L21.5 22.5L20 21C21.5 19.8 22.5 18.2 22.5 16.5Z" fill="white"/>
      <circle cx="13.5" cy="15.5" r="1.5" fill="#AB9FF2"/>
      <circle cx="18.5" cy="15.5" r="1.5" fill="#AB9FF2"/>
    </svg>
  ),
  zerion: (
    <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#2962FF"/>
      <path d="M8 10H24L14 18H24V22H8L18 14H8V10Z" fill="white"/>
    </svg>
  ),
};

const WALLET_OPTIONS: {
  id: SupportedWalletType;
  name: string;
  desc: string;
  badge?: string;
}[] = [
  { id: "metamask", name: "MetaMask", desc: "Popular Web3 Extension & Mobile App", badge: "Popular" },
  { id: "walletconnect", name: "WalletConnect", desc: "Connect any mobile or desktop wallet via QR", badge: "Universal" },
  { id: "coinbase", name: "Coinbase Wallet", desc: "Self-Custody Web3 & Mobile Wallet", badge: "Recommended" },
  { id: "trust", name: "Trust Wallet", desc: "Multi-Chain Crypto Mobile App" },
  { id: "rainbow", name: "Rainbow Wallet", desc: "Simple & modern EVM mobile wallet" },
  { id: "okx", name: "OKX Wallet", desc: "Multi-Chain Web3 & Exchange Wallet" },
  { id: "phantom", name: "Phantom (EVM)", desc: "Multi-Chain Solana & EVM Wallet" },
  { id: "zerion", name: "Zerion Wallet", desc: "Smart Web3 Portfolio & DeFi Wallet" },
];

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  token: initialToken = "USDC",
  gigTitle,
  bookingDate,
  bookingId = "BK_" + Math.floor(100000 + Math.random() * 900000),
  onConfirm,
}: PaymentModalProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<SupportedNetwork>("avalanche");
  const [selectedToken, setSelectedToken] = useState<"USDT" | "USDC">(initialToken);
  const [step, setStep] = useState<
    "select_wallet" | "select_account" | "qr_scan" | "verify_txhash" | "processing" | "success" | "error"
  >("select_wallet");

  const [selectedWalletType, setSelectedWalletType] = useState<SupportedWalletType>("metamask");
  const [connecting, setConnecting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<WalletAccountDetails[]>([]);
  const [selectedAccountAddress, setSelectedAccountAddress] = useState<string>("");
  const [browserProvider, setBrowserProvider] = useState<ethers.BrowserProvider | null>(null);

  const [inputTxHash, setInputTxHash] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyStage, setVerifyStage] = useState<1 | 2 | 3>(1);

  if (!isOpen) return null;

  const escrowAddress = getEscrowAddress(selectedNetwork);
  const chainIdNum = selectedNetwork === "avalanche" ? 43114 : 8453;
  const eip681Uri = `ethereum:${escrowAddress}@${chainIdNum}/transfer?address=${escrowAddress}&uint256=${Math.round(amount * 1e6)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(eip681Uri)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleConnectWalletType = async (
    walletType: SupportedWalletType, 
    tokenOverride?: "USDT" | "USDC",
    networkOverride?: SupportedNetwork
  ) => {
    const activeToken = tokenOverride || selectedToken;
    const activeNetwork = networkOverride || selectedNetwork;
    setSelectedWalletType(walletType);
    setConnecting(true);
    setError(null);
    const toastId = toast.loading(`Connecting to ${walletType}...`);

    try {
      const res = await fetchConnectedAccountsDetails(activeNetwork, amount, walletType, activeToken);
      toast.dismiss(toastId);

      setConnectedAccounts(res.accounts);
      setSelectedAccountAddress(res.selectedAddress || res.accounts[0]?.address || "");
      setBrowserProvider(res.provider);
      setStep("select_account");
      toast.success(`Connected to ${walletType}!`);
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error(err);
      
      if (isMobileBrowser()) {
        const redirected = openMobileWalletDeepLink(walletType);
        if (redirected) {
          toast.loading(`Opening ${walletType} Mobile App...`);
          return;
        }
      }
      toast.error(err.message || `Failed to connect to ${walletType}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleSwitchNetwork = async (newNetwork: SupportedNetwork) => {
    setSelectedNetwork(newNetwork);
    if (step === "select_account" && selectedWalletType) {
      await handleConnectWalletType(selectedWalletType, selectedToken, newNetwork);
    }
  };

  const handleSwitchToken = async (newToken: "USDT" | "USDC") => {
    setSelectedToken(newToken);
    if (step === "select_account" && selectedWalletType) {
      await handleConnectWalletType(selectedWalletType, newToken, selectedNetwork);
    }
  };

  const handleExecutePayment = async () => {
    if (!browserProvider || !selectedAccountAddress) {
      toast.error("Please select a Web3 account first");
      return;
    }

    const numAmount = Number(amount) || 0;
    const safeAmountStr = (Math.round(numAmount * 100) / 100).toFixed(2);

    const currentAcc = connectedAccounts.find(a => a.address.toLowerCase() === selectedAccountAddress.toLowerCase());
    if (currentAcc && currentAcc.usdcBalance < numAmount) {
      toast.error(`Insufficient balance. Required: ${safeAmountStr} ${selectedToken}.`);
      return;
    }

    setStep("processing");
    setVerifyStage(1);
    const toastId = toast.loading(`Confirming ${selectedToken} transaction...`);

    try {
      const signer = await browserProvider.getSigner(selectedAccountAddress);
      const tokenAddress = getTokenAddress(selectedToken, selectedNetwork);
      
      const erc20Abi = [
        "function transfer(address to, uint256 amount) external returns (bool)"
      ];

      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
      const amountUnits = ethers.parseUnits(safeAmountStr, 6);

      setVerifyStage(2);
      const tx = await tokenContract.transfer(escrowAddress, amountUnits);

      toast.loading(`Awaiting ${selectedNetwork.toUpperCase()} block confirmation...`, { id: toastId });
      const receipt = await tx.wait();

      setVerifyStage(3);
      setTxHash(receipt.hash);

      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          txHash: receipt.hash,
          token: selectedToken,
          network: selectedNetwork
        })
      }).catch(err => {
        console.warn("Backend verify API non-blocking warning:", err);
        return null;
      });

      if (verifyRes) {
        const verifyData = await verifyRes.json().catch(() => ({}));
        console.log("Backend verification status:", verifyData);
      }

      toast.dismiss(toastId);
      setStep("success");
      onConfirm?.(receipt.hash, selectedNetwork);
      toast.success(`${selectedToken} payment confirmed!`);
    } catch (payErr: any) {
      toast.dismiss(toastId);
      console.error("Web3 payment error:", payErr);
      setError(payErr.reason || payErr.message || "Web3 transaction was rejected or failed.");
      setStep("error");
    }
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
    const toastId = toast.loading(`Verifying transaction...`);

    try {
      setTimeout(() => setVerifyStage(2), 1200);

      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          txHash: inputTxHash.trim(),
          token: selectedToken,
          network: selectedNetwork
        })
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (res.ok && data.success) {
        setVerifyStage(3);
        setTxHash(inputTxHash.trim());
        setStep("success");
        onConfirm?.(inputTxHash.trim(), selectedNetwork);
        toast.success("Payment verified on-chain!");
      } else {
        setError(data.message || "On-chain verification failed.");
        setStep("error");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error(err);
      setError("Network error while connecting to RPC. Please try again.");
      setStep("error");
    } finally {
      setVerifying(false);
    }
  };

  const selectedAccObj = connectedAccounts.find(a => a.address.toLowerCase() === selectedAccountAddress.toLowerCase());

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white text-dark-900 rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-dark-100 transition-all duration-300">
        
        {/* Clean Modern Web2 Light Header */}
        <div className="bg-white border-b border-dark-100 p-5 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step !== "select_wallet" && step !== "success" && step !== "processing" && (
                <button 
                  onClick={() => {
                    setError(null);
                    setStep("select_wallet");
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-dark-50 border border-dark-200 flex items-center justify-center text-dark-700 hover:bg-dark-100 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Escrow Protected
                </div>
                <h3 className="text-base sm:text-lg font-bold text-dark-900 leading-snug">
                  Complete Tour Booking
                </h3>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-dark-50 border border-dark-200 flex items-center justify-center text-dark-500 hover:text-dark-900 hover:bg-dark-100 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Clean Order Summary & Network/Token Switcher */}
          <div className="mt-4 p-4 bg-dark-50 rounded-2xl border border-dark-100 space-y-3">
            
            {/* Row 1: Network Display */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-dark-500 uppercase tracking-wider">Payment Network:</span>
              <div className="bg-white px-3 py-1.5 rounded-xl flex items-center gap-2 border border-dark-200 shadow-sm text-xs font-bold text-dark-900">
                {AvaxLogo} Avalanche C-Chain (Mainnet)
              </div>
            </div>

            {/* Row 2: Token Switcher & Amount */}
            <div className="pt-3 border-t border-dark-200/60 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Tour Experience</p>
                <p className="font-bold text-dark-900 text-sm truncate max-w-[150px] sm:max-w-[240px] mt-0.5">{gigTitle}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded-xl flex items-center gap-1 border border-dark-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleSwitchToken("USDC")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedToken === "USDC" ? "bg-primary/10 text-primary border border-primary/30" : "text-dark-600 hover:text-dark-900"
                    }`}
                  >
                    {USDCLogo} USDC
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchToken("USDT")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedToken === "USDT" ? "bg-primary/10 text-primary border border-primary/30" : "text-dark-600 hover:text-dark-900"
                    }`}
                  >
                    {USDTLogo} USDT
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-primary font-mono tracking-tight block leading-none">
                    ${amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 bg-white overflow-y-auto flex-1">

          {/* STEP 1: SELECT WEB3 WALLET */}
          {step === "select_wallet" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-dark-700">Choose Payment Method:</span>
                <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {selectedNetwork.toUpperCase()} • {selectedToken}
                </span>
              </div>

              {/* Wallet Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {WALLET_OPTIONS.map((w) => (
                  <button
                    key={w.id}
                    disabled={connecting}
                    onClick={() => handleConnectWalletType(w.id)}
                    className="w-full flex items-center gap-3 p-3.5 border border-dark-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-left group cursor-pointer bg-white shadow-sm"
                  >
                    {WalletLogos[w.id]}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-dark-900 text-sm">{w.name}</span>
                        {w.badge && (
                          <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full border border-primary/20">{w.badge}</span>
                        )}
                      </div>
                      <span className="text-xs text-dark-400 block mt-0.5 truncate">{w.desc}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-dark-300 group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Auxiliary Quick Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setStep("qr_scan")}
                  className="flex-1 p-3 border border-dark-200 rounded-xl hover:border-primary text-xs font-bold text-dark-700 flex items-center justify-center gap-2 bg-dark-50 hover:bg-dark-100 transition-colors"
                >
                  <QrCode className="w-4 h-4 text-primary" /> {selectedNetwork.toUpperCase()} QR Pay
                </button>
                <button
                  onClick={() => setStep("verify_txhash")}
                  className="flex-1 p-3 border border-dark-200 rounded-xl hover:border-primary text-xs font-bold text-dark-700 flex items-center justify-center gap-2 bg-dark-50 hover:bg-dark-100 transition-colors"
                >
                  Paste TxHash
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ACCOUNT CHOOSER & BALANCE PREVIEW */}
          {step === "select_account" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-dark-700">Select Wallet Account:</span>
                <button
                  onClick={() => handleConnectWalletType(selectedWalletType)}
                  className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Switch in Wallet
                </button>
              </div>

              {/* Account Cards List */}
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {connectedAccounts.map((acc, index) => {
                  const isSelected = acc.address.toLowerCase() === selectedAccountAddress.toLowerCase();
                  return (
                    <div
                      key={acc.address}
                      onClick={() => setSelectedAccountAddress(acc.address)}
                      className={`p-4 border rounded-2xl transition-all cursor-pointer ${
                        isSelected 
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm" 
                          : "border-dark-200 bg-white hover:bg-dark-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary bg-primary text-white" : "border-dark-300"}`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <span className="font-bold text-dark-900 text-xs block">
                              Account {index + 1}
                            </span>
                            <span className="font-mono text-xs text-dark-500 block mt-0.5">
                              {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(acc.address, `Account ${index + 1} Address`);
                          }}
                          className="text-dark-400 hover:text-primary p-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Balance Details Pill Bar */}
                      <div className="mt-3 pt-2.5 border-t border-dark-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            {selectedToken === "USDC" ? USDCLogo : USDTLogo}
                            <div>
                              <span className="text-[10px] text-dark-400 uppercase font-bold block">{selectedToken} ({selectedNetwork.toUpperCase()})</span>
                              <span className="font-black text-dark-900 font-mono text-sm">{acc.formattedUsdc}</span>
                            </div>
                          </div>
                          <div className="pl-3 border-l border-dark-200">
                            <span className="text-[10px] text-dark-400 uppercase font-bold block">Gas ({selectedNetwork === "avalanche" ? "AVAX" : "ETH"})</span>
                            <span className="font-semibold text-dark-700 font-mono text-xs">{acc.ethBalance}</span>
                          </div>
                        </div>

                        {acc.hasEnoughBalance ? (
                          <span className="text-[10px] font-bold bg-green-500/10 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Sufficient
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" /> Low Balance
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Insufficient Balance Alert */}
              {selectedAccObj && !selectedAccObj.hasEnoughBalance && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Selected account has <strong>{selectedAccObj.formattedUsdc} {selectedToken}</strong>. Booking total is <strong>{amount.toFixed(2)} {selectedToken}</strong>. Please top up or select another account.</span>
                </div>
              )}

              <button
                disabled={!selectedAccObj || !selectedAccObj.hasEnoughBalance}
                onClick={handleExecutePayment}
                className="w-full py-3.5 bg-primary hover:bg-primary-600 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer transition-all"
              >
                <ShieldCheck className="w-4 h-4" /> Confirm & Pay ${amount.toFixed(2)} {selectedToken} ({selectedNetwork.toUpperCase()}) ➔
              </button>
            </div>
          )}

          {/* SCAN QR CODE STEP */}
          {step === "qr_scan" && (
            <div className="space-y-4 animate-in fade-in duration-200 text-center">
              <div className="p-4 bg-dark-50 rounded-2xl border border-dark-100 flex flex-col items-center">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-dark-200 mb-2">
                  <img src={qrCodeUrl} alt="Escrow QR Code" className="w-44 h-44 object-contain rounded-lg" />
                </div>
                <p className="text-xs text-dark-500 font-medium">
                  Scan via Mobile Wallet (MetaMask, Coinbase, Trust, Rainbow, WalletConnect)
                </p>
              </div>

              <div className="p-3 bg-dark-50 rounded-xl border border-dark-100 text-left flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-dark-400 uppercase font-bold block">{selectedNetwork.toUpperCase()} Escrow Address</span>
                  <span className="text-xs font-mono font-semibold text-dark-900 truncate block">{escrowAddress}</span>
                </div>
                <button onClick={() => copyToClipboard(escrowAddress, "Escrow Address")} className="text-primary hover:underline text-xs font-bold p-1">
                  Copy
                </button>
              </div>

              <button onClick={() => setStep("verify_txhash")} className="w-full py-2.5 text-xs font-bold rounded-xl border border-dark-200 text-dark-700 hover:bg-dark-50">
                Done Payment? Enter TxHash Manually ➔
              </button>
            </div>
          )}

          {/* VERIFY MANUAL TXHASH STEP */}
          {step === "verify_txhash" && (
            <form onSubmit={handleVerifyManualTxHash} className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-900 block">Enter {selectedNetwork.toUpperCase()} Transaction Hash (TxHash):</label>
                <p className="text-[11px] text-dark-500">Paste the 66-character <code>0x...</code> hash from your Web3 wallet transaction receipt.</p>
              </div>

              <input
                type="text"
                value={inputTxHash}
                onChange={(e) => setInputTxHash(e.target.value)}
                placeholder="e.g. 0x123abc456def789..."
                className="w-full p-3.5 border border-dark-200 bg-white rounded-xl focus:border-primary outline-none text-xs font-mono text-dark-900 shadow-sm"
              />

              <button
                type="submit"
                disabled={verifying || !inputTxHash.trim()}
                className="w-full py-3 bg-primary hover:bg-primary-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Verify On-Chain Payment ➔
              </button>
            </form>
          )}

          {/* PROCESSING STEP */}
          {step === "processing" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <DotsLoader size="lg" />
              <div>
                <h4 className="font-bold text-dark-900 text-base">Processing Escrow Payment</h4>
                <p className="text-xs text-dark-500 mt-1">Confirming block on {selectedNetwork.toUpperCase()} blockchain ({selectedToken})...</p>
              </div>
            </div>
          )}

          {/* SUCCESS STEP */}
          {step === "success" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-bold text-dark-900 text-xl">Payment Successfully Verified!</h4>
                <p className="text-xs text-dark-500 mt-1">Your {selectedToken} funds are safely locked in {selectedNetwork.toUpperCase()} Escrow Smart Contract.</p>
                <p className="text-xs text-primary font-semibold mt-1">Official PDF receipt has been sent to your email.</p>
              </div>
              {txHash && (
                <a
                  href={`https://snowtrace.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-mono flex items-center gap-1 font-semibold"
                >
                  View on SnowTrace Explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button onClick={onClose} className="w-full py-3 bg-dark-900 hover:bg-dark-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md">
                Done & View Booking Details ➔
              </button>
            </div>
          )}

          {/* ERROR STEP */}
          {step === "error" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 bg-red-500/10 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-dark-900 text-base">Payment Verification Failed</h4>
                <p className="text-xs text-red-600 mt-1 max-w-xs mx-auto font-medium">{error}</p>
              </div>
              <button onClick={() => setStep("select_wallet")} className="w-full py-3 border border-dark-200 text-dark-900 hover:bg-dark-50 text-xs font-bold rounded-xl cursor-pointer">
                Try Again ➔
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
