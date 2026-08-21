"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Wallet, Link2, ExternalLink, Copy, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { connectWallet, getTokenBalance, SupportedNetwork } from "@/lib/crypto/payment";
import DotsLoader from "@/components/ui/DotsLoader";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600",
  AWAITING_PAYMENT: "bg-orange-500/10 text-orange-600",
  CONFIRMED: "bg-blue-500/10 text-blue-600",
  COMPLETED: "bg-green-500/10 text-green-600",
  CANCELLED: "bg-red-500/10 text-red-600",
  DISPUTED: "bg-purple-500/10 text-purple-600",
};

export default function GuideWalletPage() {
  const { data: session, update: updateSession } = useSession();
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<"avalanche" | "base">("avalanche");
  const [usdtBalance, setUsdtBalance] = useState("0.00");
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState<"metamask" | "coinbase" | "solflare" | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Helper to load balances for address
  const loadBalances = useCallback(async (address: string, chain: SupportedNetwork) => {
    try {
      const usdtVal = await getTokenBalance("USDT", address, chain);
      const usdcVal = await getTokenBalance("USDC", address, chain);

      const totalEarnedUsdc = history
        .filter((b) => b.status === "PAID" || b.status === "COMPLETED" || b.status === "CONFIRMED" || b.status === "RELEASED")
        .reduce((sum, b) => sum + (b.guide_price || (b.totalPriceUSD * 0.90)), 0);

      const displayUsdc = Number(usdcVal) > 0 ? Number(usdcVal) : (totalEarnedUsdc > 0 ? totalEarnedUsdc : 0);

      setUsdtBalance(Number(usdtVal).toFixed(2));
      setUsdcBalance(displayUsdc.toFixed(2));
    } catch (err) {
      console.error("Error loading balances:", err);
    }
  }, [history]);

  // Fetch fresh profile directly from DB on mount
  const fetchProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch("/api/users/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.walletAddress) {
          setConnected(true);
          setWalletAddress(data.walletAddress);
          await loadBalances(data.walletAddress, network);
        } else {
          setConnected(false);
          setWalletAddress(null);
          setUsdtBalance("0.00");
          setUsdcBalance("0.00");
        }
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [network, loadBalances]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (session?.user) {
      fetchHistory();
    }
  }, [session]);

  // Reload balances when network changes
  useEffect(() => {
    if (walletAddress) {
      loadBalances(walletAddress, network);
    }
  }, [network, walletAddress, loadBalances]);

  // Listen to browser wallet account changes (e.g. user switches account in MetaMask)
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        const newAddress = accounts[0];
        if (walletAddress && newAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          toast.success(`Account switched to ${newAddress.substring(0, 6)}...${newAddress.substring(newAddress.length - 4)}`);
          setWalletAddress(newAddress);
          setConnected(true);
          // Sync with database
          await fetch("/api/users/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: newAddress }),
          });
          await updateSession({ walletAddress: newAddress });
          await loadBalances(newAddress, network);
        }
      } else {
        // User disconnected in wallet extension
        setConnected(false);
        setWalletAddress(null);
        setUsdtBalance("0.00");
        setUsdcBalance("0.00");
        await fetch("/api/users/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: null }),
        });
        await updateSession({ walletAddress: null });
      }
    };

    (window as any).ethereum.on?.("accountsChanged", handleAccountsChanged);
    return () => {
      (window as any).ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, [walletAddress, network, updateSession, loadBalances]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/bookings?role=guide");
      if (res.ok) {
        const data = await res.json();
        const validTx = data.filter((b: any) => b.txHash && b.txHash !== "N/A");
        setHistory(validTx);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleConnect = async (providerType: "metamask" | "coinbase" | "solflare") => {
    setConnecting(true);
    setWalletType(providerType);
    const toastId = toast.loading(`Connecting to ${providerType === "metamask" ? "MetaMask" : providerType === "coinbase" ? "Coinbase Wallet" : "Solflare"}...`);

    try {
      // Connect to chosen wallet provider
      const { address } = await connectWallet(network, providerType);
      
      setWalletAddress(address);
      setConnected(true);
      
      // Update database profile with new wallet address
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      toast.dismiss(toastId);
      if (res.ok) {
        toast.success(`${providerType.toUpperCase()} connected: ${formatAddress(address)}`);
        await updateSession({ walletAddress: address });
        await loadBalances(address, network);
      } else {
        toast.error("Failed to save wallet address to profile");
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error("Connect error:", error);
      toast.error(error.reason || error.message || "Connection failed");
    } finally {
      setConnecting(false);
      setWalletType(null);
    }
  };

  const handleDisconnect = async () => {
    const toastId = toast.loading("Disconnecting wallet...");
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: null }),
      });

      toast.dismiss(toastId);
      if (res.ok) {
        setConnected(false);
        setWalletAddress(null);
        setUsdtBalance("0.00");
        setUsdcBalance("0.00");
        toast.success("Wallet disconnected successfully");
        await updateSession({ walletAddress: null });
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.dismiss(toastId);
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

  const getExplorerUrl = (address: string) => {
    if (network === "base") {
      const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
      return isBaseMainnet
        ? `https://basescan.org/address/${address}`
        : `https://sepolia.basescan.org/address/${address}`;
    }
    const isAvaxMainnet =
      process.env.NEXT_PUBLIC_AVAX_NETWORK === "mainnet" ||
      process.env.NEXT_PUBLIC_AVALANCHE_NETWORK === "mainnet";
    return isAvaxMainnet
      ? `https://snowtrace.io/address/${address}`
      : `https://testnet.snowtrace.io/address/${address}`;
  };

  return (
    <DashboardLayout role="guide">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Wallet</h1>
          <p className="text-dark-500">Connect your crypto wallet to receive payouts</p>
        </div>

        <div className="card p-6 space-y-6">
          {loadingProfile ? (
            <div className="flex items-center justify-center p-12">
              <DotsLoader size="lg" />
            </div>
          ) : connected && walletAddress ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-dark-900">Wallet Connected</h3>
                    <p className="text-sm text-dark-400 capitalize">Active Network: {network === "avalanche" ? "Avalanche C-Chain" : "Base L2"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleConnect("metamask")} 
                    disabled={connecting}
                    className="btn-ghost text-xs text-primary font-semibold flex items-center gap-1 cursor-pointer"
                    title="Switch or reconnect wallet account"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${connecting ? "animate-spin" : ""}`} /> Change
                  </button>
                  <button onClick={handleDisconnect} className="btn-ghost text-danger text-sm cursor-pointer font-semibold">
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Network Selector Toggle */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-dark-700/80 max-w-[340px]">
                <button
                  type="button"
                  onClick={() => setNetwork("avalanche")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    network === "avalanche"
                      ? "bg-primary text-white shadow-md font-bold scale-[1.02]"
                      : "text-slate-600 dark:text-dark-300 font-semibold hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-700/60"
                  }`}
                >
                  <img src="https://cryptologos.cc/logos/avalanche-avax-logo.png" alt="AVAX" className="w-4 h-4 object-contain flex-shrink-0" />
                  <span>Avalanche C-Chain</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNetwork("base")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    network === "base"
                      ? "bg-primary text-white shadow-md font-bold scale-[1.02]"
                      : "text-slate-600 dark:text-dark-300 font-semibold hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-700/60"
                  }`}
                >
                  <img src="https://icon2.cleanpng.com/ci2/gjg/xui/vzts09avk.webp" alt="Base" className="w-4 h-4 object-contain flex-shrink-0" />
                  <span>Base L2</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-dark-50 rounded-xl flex flex-col justify-between">
                  <p className="text-xs text-dark-400 font-medium">Payout Address</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-mono text-sm text-dark-900 font-semibold">{formatAddress(walletAddress)}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={copyToClipboard} className="p-1 hover:bg-dark-100 rounded text-dark-500 cursor-pointer" title="Copy Address">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={getExplorerUrl(walletAddress)}
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
                  <p className="text-xs text-dark-400 font-medium">USDT Balance</p>
                  <p className="font-bold text-lg text-dark-900 mt-1">{usdtBalance} USDT</p>
                </div>
                <div className="p-4 bg-dark-50 rounded-xl">
                  <p className="text-xs text-dark-400 font-medium">USDC Balance</p>
                  <p className="font-bold text-lg text-dark-900 mt-1">{usdcBalance} USDC</p>
                </div>
              </div>

              <div>
                <h4 className="font-display font-semibold text-dark-900 mb-3">Transaction History</h4>
                {loadingHistory ? (
                  <div className="flex items-center justify-center p-8 bg-dark-50 rounded-xl">
                    <DotsLoader size="md" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="p-8 text-center text-sm text-dark-400 bg-dark-50 rounded-xl border border-dashed border-dark-200">
                    No recent transactions on this wallet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-dark-150 bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-dark-50 border-b border-dark-150">
                        <tr>
                          <th className="text-left text-xs font-semibold text-dark-500 px-4 py-3">Date</th>
                          <th className="text-left text-xs font-semibold text-dark-500 px-4 py-3">Type</th>
                          <th className="text-left text-xs font-semibold text-dark-500 px-4 py-3">Tour</th>
                          <th className="text-left text-xs font-semibold text-dark-500 px-4 py-3">Amount</th>
                          <th className="text-left text-xs font-semibold text-dark-500 px-4 py-3">Status</th>
                          <th className="text-left text-xs font-semibold text-dark-500 px-4 py-3">Explorer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-100">
                        {history.map((tx: any) => {
                          const date = new Date(tx.bookingDate).toLocaleDateString();
                          const isCompleted = tx.status === "COMPLETED";
                          const amountVal = isCompleted 
                            ? tx.totalPriceUSD * 0.90 
                            : tx.totalPriceUSD;
                          return (
                            <tr key={tx.id} className="hover:bg-dark-50/50">
                              <td className="px-4 py-3 text-dark-600 font-mono text-xs">{date}</td>
                              <td className="px-4 py-3 font-semibold">
                                {isCompleted ? (
                                  <span className="text-green-600">Payout Released</span>
                                ) : (
                                  <span className="text-blue-600">Escrow Locked</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-dark-800 font-medium truncate max-w-[180px]" title={tx.gig?.title}>
                                {tx.gig?.title || "Unknown Tour"}
                              </td>
                              <td className="px-4 py-3 font-bold text-dark-900">
                                +{amountVal.toFixed(2)} USDC
                              </td>
                              <td className="px-4 py-3">
                                <span className={`badge text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                                  tx.status === "COMPLETED" 
                                    ? "bg-green-500/10 text-green-600 border border-green-500/20" 
                                    : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                }`}>
                                  {tx.status === "COMPLETED" ? "RELEASED" : "SECURED"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {tx.txHash && tx.txHash !== "N/A" && (
                                  tx.txHash.startsWith("0xMOCK") ? (
                                    <span className="text-[10px] text-dark-405 bg-dark-100 px-2 py-0.5 rounded-full">Sandbox</span>
                                  ) : (
                                    <a
                                      href={
                                        (tx.paymentNetwork || "").toLowerCase().includes("avalanche") || (tx.paymentNetwork || "").toLowerCase().includes("avax")
                                          ? (process.env.NEXT_PUBLIC_AVAX_NETWORK === "mainnet" || process.env.NEXT_PUBLIC_AVALANCHE_NETWORK === "mainnet" ? `https://snowtrace.io/tx/${tx.txHash}` : `https://testnet.snowtrace.io/tx/${tx.txHash}`)
                                          : (process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet" ? `https://basescan.org/tx/${tx.txHash}` : `https://sepolia.basescan.org/tx/${tx.txHash}`)
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                                    >
                                      View <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-bold text-dark-900 text-lg mb-2">Connect Your Wallet</h3>
              <p className="text-dark-500 text-sm mb-6 max-w-md mx-auto">
                Select your blockchain network and preferred wallet provider to receive payouts securely.
              </p>

              {/* Network Selection Toggle */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <span className="text-sm font-bold text-slate-700 dark:text-dark-200">Network:</span>
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-dark-700/80">
                  <button
                    type="button"
                    onClick={() => setNetwork("avalanche")}
                    className={`py-2 px-4 rounded-xl text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      network === "avalanche"
                        ? "bg-primary text-white shadow-md font-bold scale-[1.02]"
                        : "text-slate-600 dark:text-dark-300 font-semibold hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-700/60"
                    }`}
                  >
                    <img src="https://cryptologos.cc/logos/avalanche-avax-logo.png" alt="AVAX" className="w-4 h-4 object-contain flex-shrink-0" />
                    <span>Avalanche C-Chain</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNetwork("base")}
                    className={`py-2 px-4 rounded-xl text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      network === "base"
                        ? "bg-primary text-white shadow-md font-bold scale-[1.02]"
                        : "text-slate-600 dark:text-dark-300 font-semibold hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-700/60"
                    }`}
                  >
                    <img src="https://icon2.cleanpng.com/ci2/gjg/xui/vzts09avk.webp" alt="Base" className="w-4 h-4 object-contain flex-shrink-0" />
                    <span>Base L2</span>
                  </button>
                </div>
              </div>

              {/* Wallet Providers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                {/* MetaMask */}
                <button
                  onClick={() => handleConnect("metamask")}
                  disabled={connecting}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-dark-200 rounded-2xl hover:border-primary hover:shadow-lg transition-all group cursor-pointer"
                >
                  {connecting && walletType === "metamask" ? (
                    <div className="h-12 flex items-center justify-center mb-4"><DotsLoader size="lg" /></div>
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
                  className="flex flex-col items-center justify-center p-6 bg-white border border-dark-200 rounded-2xl hover:border-primary hover:shadow-lg transition-all group cursor-pointer"
                >
                  {connecting && walletType === "coinbase" ? (
                    <div className="h-12 flex items-center justify-center mb-4"><DotsLoader size="lg" /></div>
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
                  className="flex flex-col items-center justify-center p-6 bg-white border border-dark-200 rounded-2xl hover:border-primary hover:shadow-lg transition-all group cursor-pointer"
                >
                  {connecting && walletType === "solflare" ? (
                    <div className="h-12 flex items-center justify-center mb-4"><DotsLoader size="lg" /></div>
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
                    Never share your private keys. Explomate will never ask for them. Transactions are verified directly via smart contracts.
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
