"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Wallet, ArrowRightLeft, Copy, ExternalLink, RefreshCw, Send, Loader2, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";

interface CustodianStatus {
  address: string;
  usdcBalance: string;
  usdtBalance: string;
  nativeBalance: string;
  network: string;
  rpcUrl: string;
}

export default function AdminWalletPage() {
  const [network, setNetwork] = useState<"base" | "polygon" | "celo">("base");
  const [status, setStatus] = useState<CustodianStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [transferring, setTransferring] = useState(false);

  // Transfer Form State
  const [recipient, setRecipient] = useState("");
  const [token, setToken] = useState<"USDC" | "USDT" | "NATIVE">("USDC");
  const [amount, setAmount] = useState("");

  // History State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, [network]);

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch(`/api/admin/wallet/status?network=${network}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        toast.error("Failed to retrieve custodian wallet balances");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading wallet balances");
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/admin/revenue");
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !amount || Number(amount) <= 0) {
      toast.error("Please provide a valid recipient address and amount");
      return;
    }

    setTransferring(true);
    const loadId = toast.loading(`Broadcasting transfer of ${amount} ${token} on-chain...`);

    try {
      const res = await fetch("/api/admin/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient,
          token,
          amount: Number(amount),
          network
        })
      });

      toast.dismiss(loadId);
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Successfully transferred ${amount} ${token}!`);
        setRecipient("");
        setAmount("");
        fetchStatus(); // Reload balances
      } else {
        toast.error(data.message || "Failed to execute transfer");
      }
    } catch (err: any) {
      toast.dismiss(loadId);
      console.error(err);
      toast.error(err.message || "Error executing transfer");
    } finally {
      setTransferring(false);
    }
  };

  const copyAddress = () => {
    if (status?.address) {
      navigator.clipboard.writeText(status.address);
      toast.success("Custodian address copied to clipboard!");
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  const getNetworkLabel = (net: string) => {
    if (net === "base") {
      const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
      const isBaseSepolia = process.env.NEXT_PUBLIC_BASE_NETWORK === "sepolia";
      return !isBaseMainnet && !isBaseSepolia ? "Base (Localhost)" : "Base Network";
    }
    if (net === "polygon") return "Polygon Network";
    if (net === "celo") return "Celo Network";
    return net;
  };

  const getExplorerLink = (hash: string) => {
    if (network === "base") {
      const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
      const isBaseSepolia = process.env.NEXT_PUBLIC_BASE_NETWORK === "sepolia";
      if (!isBaseMainnet && !isBaseSepolia) {
        return `http://localhost:8545`;
      }
      return isBaseMainnet ? `https://basescan.org/tx/${hash}` : `https://sepolia.basescan.org/tx/${hash}`;
    }
    return network === "celo" 
      ? `https://celo-sepolia.blockscout.com/tx/${hash}`
      : `https://amoy.polygonscan.com/tx/${hash}`;
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Platform Treasury Wallet</h1>
            <p className="text-dark-500">Manage contract owner custodian funds without MetaMask (server-signed execution)</p>
          </div>
          <button
            onClick={() => {
              fetchStatus();
              fetchHistory();
            }}
            disabled={loadingStatus}
            className="btn-ghost flex items-center gap-2 text-dark-600 hover:text-dark-900 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStatus ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Network Selection Toggle */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-dark-700">Select Network:</span>
          <div className="flex p-1 bg-dark-100 rounded-xl max-w-[320px]">
            {(["base", "polygon", "celo"] as const).map((net) => (
              <button
                key={net}
                onClick={() => setNetwork(net)}
                className={`py-1.5 px-4 rounded-lg text-xs font-semibold capitalize transition-all ${
                  network === net ? "bg-white text-dark-900 shadow-sm" : "text-dark-500 hover:text-dark-900"
                }`}
              >
                {net}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balances Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-dark-900 text-lg">Custodian Wallet</h3>
                    <p className="text-xs text-dark-400 capitalize">{getNetworkLabel(network)}</p>
                  </div>
                </div>
              </div>

              {loadingStatus || !status ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-dark-500">Querying live balances on-chain...</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-dark-50 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-dark-400 font-medium">Wallet Address</p>
                      <p className="font-mono text-sm text-dark-900 font-bold mt-0.5">{formatAddress(status.address)}</p>
                    </div>
                    <button
                      onClick={copyAddress}
                      className="p-2 hover:bg-dark-100 rounded-xl text-dark-500 hover:text-dark-900 transition-colors"
                      title="Copy Wallet Address"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-dark-50 rounded-2xl border border-dark-100">
                      <p className="text-xs text-dark-400 font-semibold">USDC Balance</p>
                      <p className="font-bold text-xl text-dark-950 mt-1">{Number(status.usdcBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC</p>
                    </div>
                    <div className="p-4 bg-dark-50 rounded-2xl border border-dark-100">
                      <p className="text-xs text-dark-400 font-semibold">USDT Balance</p>
                      <p className="font-bold text-xl text-dark-950 mt-1">{Number(status.usdtBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT</p>
                    </div>
                    <div className="p-4 bg-dark-50 rounded-2xl border border-dark-100">
                      <p className="text-xs text-dark-400 font-semibold">Native Gas Balance</p>
                      <p className="font-bold text-xl text-dark-950 mt-1">{Number(status.nativeBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })} {network === "celo" ? "CELO" : network === "polygon" ? "POL" : "ETH"}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Platform Revenue List */}
            <div className="card p-6 space-y-4">
              <div>
                <h3 className="font-display font-bold text-dark-900 text-lg">Treasury Receipts (All Time)</h3>
                <p className="text-xs text-dark-500">Live database audit log of platform earnings forwarded to this address</p>
              </div>

              {loadingHistory ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-sm text-dark-400 bg-dark-50 rounded-2xl border border-dashed border-dark-200">
                  No revenue transactions recorded.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-dark-150 bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-dark-50 border-b border-dark-150">
                      <tr>
                        <th className="text-left text-xs font-semibold text-dark-500 px-4 py-3">Date</th>
                        <th className="text-left text-xs font-semibold text-dark-500 px-4 py-3">Source</th>
                        <th className="text-left text-xs font-semibold text-dark-500 px-4 py-3">Reference</th>
                        <th className="text-left text-xs font-semibold text-dark-500 px-4 py-3">Fee Earned</th>
                        <th className="text-left text-xs font-semibold text-dark-500 px-4 py-3">Explorer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100">
                      {transactions.map((tx: any, idx: number) => (
                        <tr key={idx} className="hover:bg-dark-50/50">
                          <td className="px-4 py-3 text-dark-600 font-mono text-xs">{tx.date}</td>
                          <td className="px-4 py-3 font-semibold text-dark-900">{tx.source}</td>
                          <td className="px-4 py-3 text-dark-500 text-xs truncate max-w-[150px]">{tx.ref}</td>
                          <td className="px-4 py-3 font-bold text-green-600">+{tx.amount.toFixed(2)} USDT</td>
                          <td className="px-4 py-3">
                            {tx.fullHash && tx.fullHash !== "N/A" && (
                              tx.fullHash.startsWith("0xMOCK") ? (
                                <span className="text-[10px] text-dark-400 bg-dark-100 px-2 py-0.5 rounded-full">Sandbox</span>
                              ) : (
                                <a
                                  href={getExplorerLink(tx.fullHash)}
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Transfer Funds Panel */}
          <div className="card p-6 space-y-6 flex flex-col justify-start h-fit">
            <div>
              <h3 className="font-display font-bold text-dark-900 text-lg flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
                Transfer Funds
              </h3>
              <p className="text-xs text-dark-500 mt-1">Send funds directly to any external wallet. Signs automatically using private key credentials.</p>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-dark-700 block mb-1.5">Asset Token</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["USDC", "USDT", "NATIVE"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setToken(t)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        token === t
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-dark-200 text-dark-600 hover:border-dark-350"
                      }`}
                    >
                      {t === "NATIVE" ? (network === "celo" ? "CELO" : network === "polygon" ? "POL" : "ETH") : t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-dark-700 block mb-1.5">Recipient Wallet Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0xba75...9f61"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="input-field font-mono text-sm w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-dark-700 block mb-1.5">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-field w-full pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-dark-400">
                    {token === "NATIVE" ? (network === "celo" ? "CELO" : network === "polygon" ? "POL" : "ETH") : token}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={transferring || loadingStatus}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {transferring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Transfer
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
