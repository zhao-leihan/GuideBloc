"use client";

import { useState } from "react";
import { 
  X, Loader2, CheckCircle2, AlertCircle, ArrowLeft, 
  ShieldCheck, Copy, AlertTriangle, QrCode, RotateCcw, 
  ChevronRight, RefreshCw, Check, Sparkles
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
  onConfirm?: (txHash: string) => void;
}

// Exact USDC & USDT Token Logos from Footer.tsx
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

// Official Avalanche C-Chain & Base L2 Network Logos
const AvaxLogo = (
  <img 
    src="https://cryptologos.cc/logos/avalanche-avax-logo.png?v=032" 
    alt="AVAX" 
    className="w-4 h-4 object-contain flex-shrink-0" 
  />
);

const BaseLogo = (
  <img 
    src="https://icon2.cleanpng.com/ci2/gjg/xui/vzts09avk.webp" 
    alt="Base" 
    className="w-4 h-4 object-contain inline-block" 
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
  { id: "coinbase", name: "Coinbase Wallet", desc: "Self-Custody Web3 & Mobile Wallet", badge: "Recommended" },
  { id: "trust", name: "Trust Wallet", desc: "Multi-Chain Crypto Mobile App" },
  { id: "rainbow", name: "Rainbow Wallet", desc: "Fun, Fast & Simple EVM Wallet" },
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
  const uniqueDecimalTag = (amount + 0.0123).toFixed(4);
  const chainIdNum = selectedNetwork === "avalanche" ? 43113 : 8453;
  const eip681Uri = `ethereum:${escrowAddress}@${chainIdNum}/transfer?address=${escrowAddress}&uint256=${Math.round(amount * 1e6)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(eip681Uri)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  // Connect to wallet, trigger permissions account prompt & fetch USDC/USDT balance
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
    const toastId = toast.loading(`Connecting to ${walletType} on ${activeNetwork.toUpperCase()}...`);

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

  // Switch network dynamically
  const handleSwitchNetwork = async (newNetwork: SupportedNetwork) => {
    setSelectedNetwork(newNetwork);
    if (step === "select_account" && selectedWalletType) {
      await handleConnectWalletType(selectedWalletType, selectedToken, newNetwork);
    }
  };

  // Switch token between USDC and USDT dynamically
  const handleSwitchToken = async (newToken: "USDT" | "USDC") => {
    setSelectedToken(newToken);
    if (step === "select_account" && selectedWalletType) {
      await handleConnectWalletType(selectedWalletType, newToken, selectedNetwork);
    }
  };

  // Execute On-Chain Web3 Escrow Payment using Selected Account
  const handleExecutePayment = async () => {
    if (!browserProvider || !selectedAccountAddress) {
      toast.error("Please select a Web3 account first");
      return;
    }

    const currentAcc = connectedAccounts.find(a => a.address.toLowerCase() === selectedAccountAddress.toLowerCase());
    if (currentAcc && currentAcc.usdcBalance < amount) {
      toast.error(`Insufficient ${selectedToken} balance (${currentAcc.formattedUsdc} ${selectedToken}). Required: ${amount.toFixed(2)} ${selectedToken}.`);
      return;
    }

    setStep("processing");
    setVerifyStage(1);
    const toastId = toast.loading(`Confirming ${selectedToken} transaction on ${selectedNetwork.toUpperCase()}...`);

    try {
      const signer = await browserProvider.getSigner(selectedAccountAddress);
      const tokenAddress = getTokenAddress(selectedToken, selectedNetwork);
      
      const erc20Abi = [
        "function transfer(address to, uint256 amount) external returns (bool)"
      ];

      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
      const safeAmountStr = Number(amount).toFixed(6);
      const amountUnits = ethers.parseUnits(safeAmountStr, 6); // 6 decimals for USDC & USDT

      setVerifyStage(2);
      toast.loading(`Broadcasting ${selectedNetwork.toUpperCase()} ${selectedToken} transaction...`, { id: toastId });
      const tx = await tokenContract.transfer(escrowAddress, amountUnits);

      toast.loading(`Awaiting ${selectedNetwork.toUpperCase()} block confirmation...`, { id: toastId });
      const receipt = await tx.wait();

      setVerifyStage(3);
      setTxHash(receipt.hash);

      // Verify on backend
      await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          txHash: receipt.hash,
          token: selectedToken,
          network: selectedNetwork
        })
      });

      toast.dismiss(toastId);
      setStep("success");
      onConfirm?.(receipt.hash);
      toast.success(`${selectedToken} payment confirmed on ${selectedNetwork.toUpperCase()} & locked in Escrow!`);
    } catch (payErr: any) {
      toast.dismiss(toastId);
      console.error("Web3 payment error:", payErr);
      setError(payErr.reason || payErr.message || "Web3 transaction was rejected or failed.");
      setStep("error");
    }
  };

  // Manual TxHash verification handler
  const handleVerifyManualTxHash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTxHash.trim() || inputTxHash.length < 10) {
      toast.error("Please enter a valid Transaction Hash (0x...)");
      return;
    }

    setVerifying(true);
    setError(null);
    setVerifyStage(1);
    const toastId = toast.loading(`Connecting to ${selectedNetwork.toUpperCase()} RPC Node...`);

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
        onConfirm?.(inputTxHash.trim());
        toast.success("Payment verified on-chain!");
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

  const selectedAccObj = connectedAccounts.find(a => a.address.toLowerCase() === selectedAccountAddress.toLowerCase());

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-300">
        
        {/* Dynamic Explomate Royal Blue Header Banner (No Red) */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-700 dark:via-indigo-800 dark:to-blue-900 p-5 sm:p-6 text-white overflow-hidden flex-shrink-0">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              {step !== "select_wallet" && step !== "success" && step !== "processing" && (
                <button 
                  onClick={() => {
                    setError(null);
                    setStep("select_wallet");
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3 text-cyan-200" /> Double Chain Web3 Escrow
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-snug">
                  Web3 Escrow Payment
                </h3>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Double Chain & Token Switcher Controls */}
          <div className="mt-4 p-3 sm:p-3.5 bg-white/15 dark:bg-black/30 backdrop-blur-md rounded-2xl border border-white/25 space-y-3 relative z-10">
            
            {/* Row 1: Network Selection Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-100">Select Network:</span>
              <div className="bg-black/25 p-1 rounded-xl flex items-center gap-1 border border-white/20">
                <button
                  type="button"
                  onClick={() => handleSwitchNetwork("avalanche")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedNetwork === "avalanche" ? "bg-white text-blue-700 shadow-md" : "text-white/80 hover:text-white"
                  }`}
                >
                  {AvaxLogo} Avalanche C-Chain
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchNetwork("base")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedNetwork === "base" ? "bg-white text-blue-700 shadow-md" : "text-white/80 hover:text-white"
                  }`}
                >
                  {BaseLogo} Base L2
                </button>
              </div>
            </div>

            {/* Row 2: Token Switcher & Amount */}
            <div className="pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-cyan-100">Total Amount Due</p>
                <p className="font-extrabold text-white text-xs truncate max-w-[140px] sm:max-w-[220px] mt-0.5">{gigTitle}</p>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className="bg-black/25 p-1 rounded-xl flex items-center gap-1 border border-white/20">
                  <button
                    type="button"
                    onClick={() => handleSwitchToken("USDC")}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedToken === "USDC" ? "bg-white text-slate-900 shadow-md" : "text-white/80 hover:text-white"
                    }`}
                  >
                    {USDCLogo} USDC
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchToken("USDT")}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedToken === "USDT" ? "bg-white text-slate-900 shadow-md" : "text-white/80 hover:text-white"
                    }`}
                  >
                    {USDTLogo} USDT
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight block leading-none">
                    ${amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Body with Single Clean Scrollbar & Responsive Laptop Grid */}
        <div className="p-5 sm:p-6 space-y-5 bg-white dark:bg-[#0f172a] overflow-y-auto flex-1">

          {/* Escrow Guarantee Pill */}
          {step !== "processing" && step !== "success" && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-3 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-emerald-900 dark:text-emerald-300 leading-tight">100% Escrow Protected ({selectedNetwork.toUpperCase()} - {selectedToken})</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">Funds locked safely in Smart Contract until tour completes.</p>
              </div>
            </div>
          )}

          {/* STEP 1: SELECT WEB3 WALLET */}
          {step === "select_wallet" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Select Web3 Wallet:</span>
                <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-extrabold bg-blue-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-cyan-800">
                  {selectedNetwork.toUpperCase()} • {selectedToken}
                </span>
              </div>

              {/* Wallet Options Grid (Single column on HP, 2 Columns on Laptop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {WALLET_OPTIONS.map((w) => (
                  <button
                    key={w.id}
                    disabled={connecting}
                    onClick={() => handleConnectWalletType(w.id)}
                    className="w-full flex items-center gap-3 p-3 sm:p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-500 dark:hover:border-cyan-500 hover:bg-blue-50/50 dark:hover:bg-cyan-950/40 transition-all text-left group cursor-pointer bg-slate-50 dark:bg-slate-900/60"
                  >
                    {WalletLogos[w.id]}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{w.name}</span>
                        {w.badge && (
                          <span className="text-[8px] bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 font-bold px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-cyan-500/20">{w.badge}</span>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">{w.desc}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-cyan-500 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Auxiliary Quick Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setStep("qr_scan")}
                  className="flex-1 p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900/60"
                >
                  <QrCode className="w-4 h-4 text-blue-600 dark:text-cyan-400" /> {selectedNetwork.toUpperCase()} QR
                </button>
                <button
                  onClick={() => setStep("verify_txhash")}
                  className="flex-1 p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900/60"
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
                <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Select Account for Booking:</span>
                <button
                  onClick={() => handleConnectWalletType(selectedWalletType)}
                  className="text-[11px] text-blue-600 dark:text-cyan-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Switch/Choose in Wallet
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
                          ? "border-blue-500 dark:border-cyan-500 bg-blue-500/10 dark:bg-cyan-500/15 ring-2 ring-blue-500/30" 
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-blue-500 bg-blue-600 text-white" : "border-slate-300 dark:border-slate-700"}`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-xs block">
                              Account {index + 1}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
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
                          className="text-slate-400 hover:text-blue-500 dark:hover:text-cyan-400 p-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Balance Details Pill Bar */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            {selectedToken === "USDC" ? USDCLogo : USDTLogo}
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">{selectedToken} ({selectedNetwork.toUpperCase()})</span>
                              <span className="font-extrabold text-slate-900 dark:text-white font-mono">{acc.formattedUsdc}</span>
                            </div>
                          </div>
                          <div className="pl-2 border-l border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Gas ({selectedNetwork === "avalanche" ? "AVAX" : "ETH"})</span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300 font-mono">{acc.ethBalance}</span>
                          </div>
                        </div>

                        {acc.hasEnoughBalance ? (
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Sufficient
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-amber500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/20">
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
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-900 dark:text-amber-300 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Selected account has <strong>{selectedAccObj.formattedUsdc} {selectedToken}</strong>. Booking total is <strong>{amount.toFixed(2)} {selectedToken}</strong>. Please switch account or top up {selectedToken}.</span>
                </div>
              )}

              <button
                disabled={!selectedAccObj || !selectedAccObj.hasEnoughBalance}
                onClick={handleExecutePayment}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-600 dark:to-indigo-600 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50 cursor-pointer transition-all"
              >
                <ShieldCheck className="w-4 h-4" /> Confirm & Pay ${amount.toFixed(2)} {selectedToken} ({selectedNetwork.toUpperCase()}) ➔
              </button>
            </div>
          )}

          {/* SCAN BASE QR CODE STEP */}
          {step === "qr_scan" && (
            <div className="space-y-4 animate-in fade-in duration-200 text-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center">
                <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 mb-2">
                  <img src={qrCodeUrl} alt="Escrow QR Code" className="w-44 h-44 object-contain rounded-lg" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Scan via Mobile Web3 App (MetaMask, Coinbase, Trust, Rainbow)
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-left flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{selectedNetwork.toUpperCase()} Escrow Address</span>
                  <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white truncate block">{escrowAddress}</span>
                </div>
                <button onClick={() => copyToClipboard(escrowAddress, "Escrow Address")} className="text-blue-600 dark:text-cyan-400 hover:underline text-xs font-bold p-1">
                  Copy
                </button>
              </div>

              <button onClick={() => setStep("verify_txhash")} className="w-full py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                Done Payment? Enter TxHash Manually ➔
              </button>
            </div>
          )}

          {/* VERIFY MANUAL TXHASH STEP */}
          {step === "verify_txhash" && (
            <form onSubmit={handleVerifyManualTxHash} className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 dark:text-white block">Enter {selectedNetwork.toUpperCase()} Transaction Hash (TxHash):</label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Paste the 66-character <code>0x...</code> hash from your Web3 wallet transaction receipt.</p>
              </div>

              <input
                type="text"
                value={inputTxHash}
                onChange={(e) => setInputTxHash(e.target.value)}
                placeholder="e.g. 0x123abc456def789..."
                className="w-full p-3.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl focus:border-blue-500 outline-none text-xs font-mono text-slate-900 dark:text-white"
              />

              <button
                type="submit"
                disabled={verifying || !inputTxHash.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
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
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Processing Web3 Escrow Transaction</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Connecting to {selectedNetwork.toUpperCase()} RPC Node & Confirming Block ({selectedToken})...</p>
              </div>
            </div>
          )}

          {/* SUCCESS STEP */}
          {step === "success" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-xl">Payment Successfully Verified!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your {selectedToken} funds are safely locked in {selectedNetwork.toUpperCase()} Escrow Smart Contract.</p>
              </div>
              {txHash && (
                <a
                  href={selectedNetwork === "avalanche" ? `https://testnet.snowtrace.io/tx/${txHash}` : `https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-cyan-400 hover:underline font-mono flex items-center gap-1 font-semibold"
                >
                  View on {selectedNetwork === "avalanche" ? "SnowTrace Block Explorer" : "BaseScan Explorer"} ↗
                </a>
              )}
              <button onClick={onClose} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl cursor-pointer">
                Done & View Booking Details ➔
              </button>
            </div>
          )}

          {/* ERROR STEP */}
          {step === "error" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Payment Verification Failed</h4>
                <p className="text-xs text-rose-500 mt-1 max-w-xs mx-auto font-medium">{error}</p>
              </div>
              <button onClick={() => setStep("select_wallet")} className="w-full py-3 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl cursor-pointer">
                Try Again ➔
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
