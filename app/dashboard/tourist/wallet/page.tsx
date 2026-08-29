"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Wallet, Link2, ExternalLink, Copy, CheckCircle, AlertCircle, Loader2, RefreshCw, ShieldCheck, PlusCircle, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { connectWallet, getTokenBalance, SupportedNetwork, SupportedWalletType } from "@/lib/crypto/payment";
import DotsLoader from "@/components/ui/DotsLoader";
import toast from "react-hot-toast";
import { getNetworkConfig, getExplorerTxLink, getExplorerAddressLink, importUsdcToMetaMask } from "@/lib/crypto/networkConfig";

export default function TouristWalletPage() {
  const { data: session, update: updateSession } = useSession();
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const network: SupportedNetwork = "avalanche";
  const [usdtBalance, setUsdtBalance] = useState("0.00");
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState<SupportedWalletType | null>(null);
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
      const res = await fetch("/api/bookings?role=tourist");
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

  const handleConnect = async (providerType: SupportedWalletType) => {
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
        toast.success(`Wallet connected: ${formatAddress(address)}`);
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
    return getExplorerAddressLink(address);
  };

  return (
    <DashboardLayout role="tourist">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Tourist Wallet</h1>
          <p className="text-dark-500">Manage your Avalanche crypto wallet for fast, escrow-protected tour bookings</p>
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
                    <h3 className="font-display font-bold text-dark-900">Wallet Connected</h3>
                    <p className="text-xs text-dark-400">Network: {getNetworkConfig().name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleDisconnect} className="btn-ghost text-danger text-sm cursor-pointer font-semibold">
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Wallet Address Display */}
              <div className="p-4 bg-dark-50 rounded-2xl border border-dark-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Connected Tourist Wallet</span>
                  <span className="badge badge-success text-[10px] uppercase font-bold tracking-wider">Active</span>
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
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold font-mono text-dark-900">${usdcBalance}</div>
                    <button
                      onClick={async () => {
                        try {
                          await importUsdcToMetaMask();
                          toast.success("USDC added to MetaMask successfully!");
                        } catch (e: any) {
                          toast.error(e.message || "Failed to add USDC to MetaMask");
                        }
                      }}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/20"
                      title="Import USDC token to your MetaMask extension"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add to MetaMask
                    </button>
                  </div>
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
                <h4 className="font-display font-semibold text-dark-900 mb-4">Payment History</h4>
                {loadingHistory ? (
                  <div className="text-center py-6">
                    <DotsLoader size="md" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-dark-400 text-sm">
                    No transactions yet. Book a tour to see payments here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-dark-50 text-dark-400 text-xs uppercase font-medium">
                        <tr>
                          <th className="px-4 py-3 rounded-l-xl">Tour</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Paid Amount</th>
                          <th className="px-4 py-3">Escrow Status</th>
                          <th className="px-4 py-3 rounded-r-xl">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-100">
                        {history.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-dark-50/50">
                            <td className="px-4 py-3 font-medium text-dark-900">{tx.gig?.title || "Tour Booking"}</td>
                            <td className="px-4 py-3 text-dark-500 text-xs">{new Date(tx.bookingDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 font-mono font-bold text-dark-900">
                              ${Number(tx.totalPriceUSD).toFixed(2)} USDC
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
                                  href={getExplorerTxLink(tx.txHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                                >
                                  SnowTrace <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
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
              <h3 className="font-display font-bold text-dark-900 text-lg mb-2">Connect Your Avalanche Wallet</h3>
              <p className="text-dark-500 text-sm mb-6 max-w-md mx-auto">
                Connect your preferred Web3 wallet to manage balances and confirm instant Escrow payments for tour bookings.
              </p>

              {/* Wallet Providers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {/* Core Wallet (Official Avalanche) */}
                <button
                  onClick={() => handleConnect("core")}
                  disabled={connecting}
                  className="flex flex-col items-center justify-center p-5 bg-white border border-primary/40 bg-primary/5 rounded-2xl hover:border-primary hover:shadow-md transition-all group cursor-pointer relative"
                >
                  <span className="absolute top-2 right-2 text-[9px] font-extrabold bg-primary text-white px-2 py-0.5 rounded-full shadow-sm">
                    Recommended
                  </span>
                  {connecting && walletType === "core" ? (
                    <div className="h-10 flex items-center justify-center mb-3"><DotsLoader size="lg" /></div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <img src="https://play-lh.googleusercontent.com/Cwe9OOsfbzNRZGxhhzGR2TZ3TpVoVToQIa8O4yuse2y9lWsTd4myiBT4T11t-SNwugylLMlgqET8yQviMOvugg=w240-h480-rw" alt="Core Wallet Logo" className="w-10 h-10 object-contain rounded-xl" />
                    </div>
                  )}
                  <span className="font-display font-bold text-dark-900 text-sm">Core Wallet</span>
                  <span className="text-[11px] text-dark-400 mt-0.5">Ava Labs • Official</span>
                </button>

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
                  <span className="text-[11px] text-dark-400 mt-0.5">Browser / Mobile</span>
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
                    Your payments are locked safely in Smart Contract Escrow on Avalanche C-Chain until your tour completes.
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
