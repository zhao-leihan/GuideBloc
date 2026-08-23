"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Wallet, Link2, ExternalLink, Copy, CheckCircle, AlertCircle, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
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
  const network: SupportedNetwork = "avalanche";
  const [usdtBalance, setUsdtBalance] = useState("0.00");
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState<"metamask" | "coinbase" | "walletconnect" | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Helper to load pure on-chain balances for address (No DB fallback)
  const loadBalances = useCallback(async (address: string, chain: SupportedNetwork) => {
    try {
      const usdtVal = await getTokenBalance("USDT", address, chain);
      const usdcVal = await getTokenBalance("USDC", address, chain);

      setUsdtBalance(Number(usdtVal).toFixed(2));
      setUsdcBalance(Number(usdcVal).toFixed(2));
    } catch (err) {
      console.error("Error loading on-chain balances:", err);
    }
  }, []);

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
  }, [loadBalances]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (session?.user) {
      fetchHistory();
    }
  }, [session]);

  // Reload balances when wallet address is set
  useEffect(() => {
    if (walletAddress) {
      loadBalances(walletAddress, network);
    }
  }, [network, walletAddress, loadBalances]);

  // Listen to browser wallet account changes
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

  const handleConnect = async (providerType: "metamask" | "coinbase" | "walletconnect") => {
    setConnecting(true);
    setWalletType(providerType);
    const toastId = toast.loading(`Connecting to ${providerType}...`);

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
        toast.success(`Payout wallet linked: ${formatAddress(address)}`);
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
    const toastId = toast.loading("Unlinking payout wallet...");
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
        toast.success("Payout wallet unlinked successfully");
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
    return `https://snowtrace.io/address/${address}`;
  };

  return (
    <DashboardLayout role="guide">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Guide Payout Wallet</h1>
          <p className="text-dark-500">Register and link your Avalanche wallet to receive automated escrow disbursements</p>
        </div>

        <div className="card p-6 space-y-6 bg-white border border-dark-100 rounded-3xl shadow-sm">
          {loadingProfile ? (
            <div className="flex items-center justify-center p-12">
              <DotsLoader size="lg" />
            </div>
          ) : connected && walletAddress ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-dark-900">Payout Wallet Linked & Active</h3>
                    <p className="text-xs text-dark-400">Network: Avalanche C-Chain (Mainnet)</p>
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
                    Unlink
                  </button>
                </div>
              </div>

              {/* Wallet Address Display */}
              <div className="p-4 bg-dark-50 rounded-2xl border border-dark-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Registered Payout Address</span>
                  <span className="badge badge-success text-[10px] uppercase font-bold tracking-wider">Linked to Profile</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-sm font-bold text-dark-900 truncate">
                    {walletAddress}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-dark-200 rounded-xl transition-colors text-dark-400 hover:text-dark-900 cursor-pointer"
                      title="Copy Address"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <a
                      href={getExplorerUrl(walletAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-dark-200 rounded-xl transition-colors text-dark-400 hover:text-primary cursor-pointer"
                      title="View on SnowTrace Explorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Balances Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-dark-50 rounded-2xl border border-dark-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-dark-400 uppercase tracking-wider">USDC Balance (AVAX)</span>
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Circle_USDC_Logo.svg/1280px-Circle_USDC_Logo.svg.png" 
                      alt="USDC" 
                      className="w-5 h-5 object-contain" 
                    />
                  </div>
                  <div className="text-2xl font-bold font-mono text-dark-900">${usdcBalance}</div>
                </div>

                <div className="p-4 bg-dark-50 rounded-2xl border border-dark-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-dark-400 uppercase tracking-wider">USDT Balance (AVAX)</span>
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/0/01/USDT_Logo.png" 
                      alt="USDT" 
                      className="w-5 h-5 object-contain" 
                    />
                  </div>
                  <div className="text-2xl font-bold font-mono text-dark-900">${usdtBalance}</div>
                </div>
              </div>

              {/* Transaction History Section */}
              <div className="pt-4 border-t border-dark-100">
                <h4 className="font-display font-semibold text-dark-900 mb-4">Escrow Payout History</h4>
                {loadingHistory ? (
                  <div className="text-center py-6">
                    <DotsLoader size="md" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-dark-400 text-sm">
                    No transactions yet. Complete tours to receive escrow payouts.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-dark-50 text-dark-400 text-xs uppercase font-medium">
                        <tr>
                          <th className="px-4 py-3 rounded-l-xl">Tour</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Earnings (90%)</th>
                          <th className="px-4 py-3">Escrow Status</th>
                          <th className="px-4 py-3 rounded-r-xl">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-100">
                        {history.map((tx: any) => {
                          const guideEarnings = (Number(tx.totalPriceUSD) * 0.9).toFixed(2);
                          return (
                            <tr key={tx.id} className="hover:bg-dark-50/50">
                              <td className="px-4 py-3 font-medium text-dark-900">{tx.gig?.title || "Tour Booking"}</td>
                              <td className="px-4 py-3 text-dark-500 text-xs">{new Date(tx.bookingDate).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-mono font-bold text-green-600">
                                +${guideEarnings} USDC
                              </td>
                              <td className="px-4 py-3">
                                <span className={`badge text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                                  tx.status === "COMPLETED" 
                                    ? "bg-green-500/10 text-green-600 border border-green-500/20" 
                                    : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                }`}>
                                  {tx.status === "COMPLETED" ? "RELEASED" : "ESCROW SECURED"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {tx.txHash && tx.txHash !== "N/A" && (
                                  <a
                                    href={`https://snowtrace.io/tx/${tx.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                                  >
                                    SnowTrace <ExternalLink className="w-3 h-3" />
                                  </a>
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
              <h3 className="font-display font-bold text-dark-900 text-lg mb-2">Link Your Avalanche Payout Wallet</h3>
              <p className="text-dark-500 text-sm mb-6 max-w-md mx-auto">
                Connect your preferred Web3 wallet to register your Avalanche address. When tourists complete bookings, 90% of tour earnings will disburse directly to this wallet.
              </p>

              {/* Wallet Providers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
                {/* MetaMask */}
                <button
                  onClick={() => handleConnect("metamask")}
                  disabled={connecting}
                  className="flex flex-col items-center justify-center p-5 bg-white border border-dark-200 rounded-2xl hover:border-primary hover:shadow-md transition-all group cursor-pointer"
                >
                  {connecting && walletType === "metamask" ? (
                    <div className="h-10 flex items-center justify-center mb-3"><DotsLoader size="lg" /></div>
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/960px-MetaMask_Fox.svg.png" alt="MetaMask Logo" className="w-10 h-10 object-contain" />
                    </div>
                  )}
                  <span className="font-display font-bold text-dark-900 text-sm">MetaMask</span>
                  <span className="text-[11px] text-dark-400 mt-0.5">Browser / Mobile App</span>
                </button>

                {/* WalletConnect */}
                <button
                  onClick={() => handleConnect("walletconnect")}
                  disabled={connecting}
                  className="flex flex-col items-center justify-center p-5 bg-white border border-dark-200 rounded-2xl hover:border-primary hover:shadow-md transition-all group cursor-pointer"
                >
                  {connecting && walletType === "walletconnect" ? (
                    <div className="h-10 flex items-center justify-center mb-3"><DotsLoader size="lg" /></div>
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="#3B99FC"/>
                        <path d="M9.8 12.8C13.2 9.4 18.8 9.4 22.2 12.8L22.8 13.4C23.1 13.7 23.1 14.1 22.8 14.4L21.4 15.8C21.3 15.9 21.0 15.9 20.9 15.8L20.0 14.9C17.8 12.7 14.2 12.7 12.0 14.9L11.0 15.8C10.9 15.9 10.7 15.9 10.5 15.8L9.2 14.4C8.9 14.1 8.9 13.7 9.2 13.4L9.8 12.8ZM25.0 15.6L26.2 16.8C26.5 17.1 26.5 17.5 26.2 17.8L20.8 23.2C20.5 23.5 20.1 23.5 19.8 23.2L16.0 19.4C15.9 19.3 15.8 19.3 15.7 19.4L11.9 23.2C11.6 23.5 11.2 23.5 10.9 23.2L5.5 17.8C5.2 17.5 5.2 17.1 5.5 16.8L6.7 15.6C7.0 15.3 7.4 15.3 7.7 15.6L11.5 19.4C11.6 19.5 11.7 19.5 11.8 19.4L15.6 15.6C15.9 15.3 16.3 15.3 16.6 15.6L20.4 19.4C20.5 19.5 20.6 19.5 20.7 19.4L24.5 15.6C24.8 15.3 25.0 15.3 25.0 15.6Z" fill="white"/>
                      </svg>
                    </div>
                  )}
                  <span className="font-display font-bold text-dark-900 text-sm">WalletConnect</span>
                  <span className="text-[11px] text-dark-400 mt-0.5">Universal QR Connect</span>
                </button>

                {/* Coinbase Wallet */}
                <button
                  onClick={() => handleConnect("coinbase")}
                  disabled={connecting}
                  className="flex flex-col items-center justify-center p-5 bg-white border border-dark-200 rounded-2xl hover:border-primary hover:shadow-md transition-all group cursor-pointer"
                >
                  {connecting && walletType === "coinbase" ? (
                    <div className="h-10 flex items-center justify-center mb-3"><DotsLoader size="lg" /></div>
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="#0052FF"/>
                        <rect x="9" y="9" width="14" height="14" rx="3" fill="white"/>
                        <rect x="12" y="12" width="8" height="8" rx="1.5" fill="#0052FF"/>
                      </svg>
                    </div>
                  )}
                  <span className="font-display font-bold text-dark-900 text-sm">Coinbase</span>
                  <span className="text-[11px] text-dark-400 mt-0.5">Self-Custody App</span>
                </button>
              </div>

              <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl max-w-md mx-auto">
                <div className="flex items-start gap-2.5 text-left">
                  <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-dark-600">
                    Your wallet is securely registered on Avalanche C-Chain. Escrow releases will automatically deposit USDC earnings directly to this linked address.
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
