"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Wallet, Link2, ExternalLink, Copy, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { connectWallet, getTokenBalance } from "@/lib/crypto/payment";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600",
  AWAITING_PAYMENT: "bg-orange-500/10 text-orange-600",
  CONFIRMED: "bg-blue-500/10 text-blue-600",
  COMPLETED: "bg-green-500/10 text-green-600",
  CANCELLED: "bg-red-500/10 text-red-600",
  DISPUTED: "bg-purple-500/10 text-purple-600",
};

export default function TouristWalletPage() {
  const { data: session, update: updateSession } = useSession();
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<"polygon" | "base">("base");
  const [usdtBalance, setUsdtBalance] = useState("0.00");
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState<"metamask" | "coinbase" | "solflare" | null>(null);

  const userWalletAddress = (session?.user as any)?.walletAddress;

  useEffect(() => {
    if (userWalletAddress) {
      setConnected(true);
      setWalletAddress(userWalletAddress);
      loadBalances(userWalletAddress, network);
    } else {
      setConnected(false);
      setWalletAddress(null);
    }
  }, [userWalletAddress, network]);

  const loadBalances = async (address: string, chain: "polygon" | "base") => {
    try {
      const usdtVal = await getTokenBalance("USDT", address, chain);
      const usdcVal = await getTokenBalance("USDC", address, chain);
      setUsdtBalance(Number(usdtVal).toFixed(2));
      setUsdcBalance(Number(usdcVal).toFixed(2));
    } catch (err) {
      console.error("Error loading balances:", err);
    }
  };

  const handleConnect = async (providerType: "metamask" | "coinbase" | "solflare") => {
    setConnecting(true);
    setWalletType(providerType);
    try {
      toast.loading(`Connecting to ${providerType === "metamask" ? "MetaMask" : providerType === "coinbase" ? "Coinbase Wallet" : "Solflare"}...`);
      
      // EVM wallet connection via browser provider
      const { address } = await connectWallet(network, providerType);
      
      setWalletAddress(address);
      setConnected(true);
      
      // Update database profile with wallet address
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      toast.dismiss();
      if (res.ok) {
        toast.success(`${providerType.toUpperCase()} connected successfully!`);
        await updateSession();
        await loadBalances(address, network);
      } else {
        toast.error("Failed to save wallet address to profile");
      }
    } catch (error: any) {
      toast.dismiss();
      console.error(error);
      toast.error(error.reason || error.message || "Connection failed");
    } finally {
      setConnecting(false);
      setWalletType(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      toast.loading("Disconnecting wallet...");
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: null }),
      });

      toast.dismiss();
      if (res.ok) {
        setConnected(false);
        setWalletAddress(null);
        setUsdtBalance("0.00");
        setUsdcBalance("0.00");
        toast.success("Wallet disconnected");
        await updateSession();
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.dismiss();
      toast.error("Failed to disconnect");
    }
  };

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Address copied to clipboard!");
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <DashboardLayout role="tourist">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Wallet</h1>
          <p className="text-dark-500">Connect your crypto wallet to book tours</p>
        </div>

        <div className="card p-6 space-y-6">
          {connected && walletAddress ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-dark-900">Wallet Connected</h3>
                    <p className="text-sm text-dark-400 capitalize">Active Network: {network}</p>
                  </div>
                </div>
                <button onClick={handleDisconnect} className="btn-ghost text-danger text-sm">Disconnect</button>
              </div>

              {/* Network Selector Toggle */}
              <div className="flex items-center gap-2 p-1 bg-dark-100 rounded-xl max-w-[240px]">
                <button
                  onClick={() => setNetwork("polygon")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    network === "polygon" ? "bg-white text-dark-900 shadow-sm" : "text-dark-500 hover:text-dark-900"
                  }`}
                >
                  Polygon
                </button>
                <button
                  onClick={() => setNetwork("base")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    network === "base" ? "bg-white text-dark-900 shadow-sm" : "text-dark-500 hover:text-dark-900"
                  }`}
                >
                  Base
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-dark-50 rounded-xl flex flex-col justify-between">
                  <p className="text-xs text-dark-400">Address</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-mono text-sm text-dark-900">{formatAddress(walletAddress)}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={copyToClipboard} className="p-1 hover:bg-dark-100 rounded text-dark-500" title="Copy Address">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={network === "base" ? `https://basescan.org/address/${walletAddress}` : `https://amoy.polygonscan.com/address/${walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-dark-100 rounded text-dark-500"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-dark-50 rounded-xl">
                  <p className="text-xs text-dark-400">USDT Balance</p>
                  <p className="font-bold text-lg text-dark-900 mt-1">{usdtBalance} USDT</p>
                </div>
                <div className="p-4 bg-dark-50 rounded-xl">
                  <p className="text-xs text-dark-400">USDC Balance</p>
                  <p className="font-bold text-lg text-dark-900 mt-1">{usdcBalance} USDC</p>
                </div>
              </div>

              <div>
                <h4 className="font-display font-semibold text-dark-900 mb-3">Transaction History</h4>
                <div className="space-y-2">
                  <div className="p-8 text-center text-sm text-dark-400 bg-dark-50 rounded-xl border border-dashed border-dark-200">
                    No recent transactions on this wallet.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-bold text-dark-900 text-lg mb-2">Connect Your Wallet</h3>
              <p className="text-dark-500 text-sm mb-6 max-w-md mx-auto">
                Select your blockchain network and preferred wallet provider to pay for tours securely.
              </p>

              {/* Network Selection Toggle */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <span className="text-sm font-medium text-dark-700">Network:</span>
                <div className="flex p-1 bg-dark-100 rounded-xl">
                  <button
                    onClick={() => setNetwork("polygon")}
                    className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                      network === "polygon" ? "bg-white text-dark-900 shadow-sm" : "text-dark-500 hover:text-dark-900"
                    }`}
                  >
                    Polygon
                  </button>
                  <button
                    onClick={() => setNetwork("base")}
                    className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                      network === "base" ? "bg-white text-dark-900 shadow-sm" : "text-dark-500 hover:text-dark-900"
                    }`}
                  >
                    Base
                  </button>
                </div>
              </div>

              {/* Wallet Providers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                {/* MetaMask */}
                <button
                  onClick={() => handleConnect("metamask")}
                  disabled={connecting}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-dark-200 rounded-2xl hover:border-primary hover:shadow-lg transition-all group"
                >
                  {connecting && walletType === "metamask" ? (
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/960px-MetaMask_Fox.svg.png" alt="MetaMask Logo" className="w-12 h-12 object-contain" />
                    </div>
                  )}
                  <span className="font-display font-semibold text-dark-900 text-sm">MetaMask</span>
                  <span className="text-xs text-dark-400 mt-1">Connect MetaMask extension</span>
                </button>

                {/* Coinbase Wallet */}
                <button
                  onClick={() => handleConnect("coinbase")}
                  disabled={connecting}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-dark-200 rounded-2xl hover:border-primary hover:shadow-lg transition-all group"
                >
                  {connecting && walletType === "coinbase" ? (
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <img src="https://s3-symbol-logo.tradingview.com/coinbase--600.png" alt="Coinbase Wallet Logo" className="w-12 h-12 object-contain rounded-xl" />
                    </div>
                  )}
                  <span className="font-display font-semibold text-dark-900 text-sm">Coinbase Wallet</span>
                  <span className="text-xs text-dark-400 mt-1">Connect Coinbase app</span>
                </button>

                {/* Solflare Wallet */}
                <button
                  onClick={() => handleConnect("solflare")}
                  disabled={connecting}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-dark-200 rounded-2xl hover:border-primary hover:shadow-lg transition-all group"
                >
                  {connecting && walletType === "solflare" ? (
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <img src="https://www.solflare.com/wp-content/uploads/2024/11/App-Icon.svg" alt="Solflare Wallet Logo" className="w-12 h-12 object-contain" />
                    </div>
                  )}
                  <span className="font-display font-semibold text-dark-900 text-sm">Solflare Wallet</span>
                  <span className="text-xs text-dark-400 mt-1">Connect Solflare EVM wallet</span>
                </button>
              </div>

              <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-xl max-w-md mx-auto">
                <div className="flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-dark-500">
                    Never share your private keys. explomate will never ask for them. Transactions are verified directly via smart contracts.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
