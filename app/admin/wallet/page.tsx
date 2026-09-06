"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Wallet, ArrowRightLeft, Copy, ExternalLink, RefreshCw, Send, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import { getTokenAddress } from "@/lib/crypto/payment";
import { getNetworkConfig, getExplorerTxLink, getExplorerAddressLink } from "@/lib/crypto/networkConfig";

interface TreasuryStatus {
  address: string;
  usdcBalance: string;
  usdtBalance: string;
  nativeBalance: string;
  network: string;
  rpcUrl: string;
}

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
];

export default function AdminWalletPage() {
  const network = "avalanche";
  const [status, setStatus] = useState<TreasuryStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [transferring, setTransferring] = useState(false);

  // Transfer Form State
  const [recipient, setRecipient] = useState("");
  const [token, setToken] = useState<"USDC" | "NATIVE">("USDC");
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
        toast.error("Failed to retrieve treasury wallet balances");
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

  const copyAddress = () => {
    if (status?.address) {
      navigator.clipboard.writeText(status.address);
      toast.success("Treasury address copied to clipboard");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !amount || Number(amount) <= 0) {
      toast.error("Please provide a valid recipient address and amount");
      return;
    }

    if (typeof window === "undefined" || !(window as any).ethereum) {
      toast.error("MetaMask extension not detected. Please install MetaMask to sign.");
      return;
    }

    setTransferring(true);
    const loadId = toast.loading(`Confirm transfer of ${amount} ${token} in MetaMask...`);

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      if (status?.address && signerAddress.toLowerCase() !== status.address.toLowerCase()) {
        toast.error(`Please switch MetaMask account to Treasury: ${formatAddress(status.address)}`, { id: loadId });
        setTransferring(false);
        return;
      }

      let tx;
      if (token === "NATIVE") {
        tx = await signer.sendTransaction({
          to: recipient,
          value: ethers.parseEther(amount.toString()),
        });
      } else {
        const tokenAddress = getTokenAddress("USDC", "avalanche");
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        const parsedAmount = ethers.parseUnits(Number(amount).toFixed(6), 6);
        tx = await contract.transfer(recipient, parsedAmount);
      }

      toast.loading("Waiting for on-chain block confirmation...", { id: loadId });
      await tx.wait();

      toast.dismiss(loadId);
      toast.success(`Successfully transferred ${amount} ${token}`);
      setRecipient("");
      setAmount("");
      fetchStatus();
    } catch (err: any) {
      toast.dismiss(loadId);
      console.error("Transfer error:", err);
      toast.error(err.reason || err.message || "Failed to execute transfer");
    } finally {
      setTransferring(false);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  const cfg = getNetworkConfig();

  const getExplorerLink = (hash: string) => {
    return getExplorerTxLink(hash);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Platform Treasury Wallet</h1>
            <p className="text-dark-500">Non-custodial destination wallet that receives 10% platform commission directly on-chain</p>
          </div>
          <button
            onClick={() => {
              fetchStatus();
              fetchHistory();
            }}
            disabled={loadingStatus}
            className="btn-ghost flex items-center gap-2 text-dark-600 hover:text-dark-900 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStatus ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Network Display Badge */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-dark-700">Active Blockchain:</span>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-dark-200 shadow-sm text-xs font-bold text-dark-900">
            <img src="https://cryptologos.cc/logos/avalanche-avax-logo.png" alt="AVAX" className="w-4 h-4 object-contain" />
            {cfg.badgeLabel} (Chain ID: {cfg.chainIdDecimal})
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balances Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-dark-900 text-lg">Admin Treasury (Non-Custodial)</h3>
                    <p className="text-xs text-dark-400">Directly Controlled via Owner MetaMask</p>
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
                      <p className="text-xs text-dark-400 font-medium">Treasury Wallet Address</p>
                      <p className="font-mono text-sm text-dark-900 font-bold mt-0.5">{formatAddress(status.address)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyAddress}
                        className="p-2 hover:bg-dark-100 rounded-xl text-dark-500 hover:text-dark-900 transition-colors cursor-pointer"
                        title="Copy Wallet Address"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={getExplorerAddressLink(status.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-dark-100 rounded-xl text-dark-500 hover:text-dark-900 transition-colors"
                        title="View on Snowtrace"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>



                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-dark-50 rounded-2xl border border-dark-100">
                      <p className="text-xs text-dark-400 font-semibold">Treasury USDC Balance</p>
                      <p className="font-bold text-xl text-dark-950 mt-1 font-mono">{Number(status.usdcBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC</p>
                    </div>
                    <div className="p-4 bg-dark-50 rounded-2xl border border-dark-100">
                      <p className="text-xs text-dark-400 font-semibold">Treasury AVAX Gas</p>
                      <p className="font-bold text-xl text-dark-950 mt-1 font-mono">{Number(status.nativeBalance).toFixed(4)} AVAX</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Treasury Receipts Log */}
            <div className="card p-6 space-y-4">
              <div>
                <h3 className="font-display font-bold text-dark-900 text-lg">Treasury Receipts</h3>
                <p className="text-xs text-dark-500">Live ledger of 10% commission revenue automatically routed to your Treasury address</p>
              </div>

              {loadingHistory ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-sm text-dark-400 bg-dark-50 rounded-2xl border border-dashed border-dark-200">
                  No revenue transactions recorded yet.
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
                          <td className="px-4 py-3 font-bold text-emerald-600 font-mono">
                            +{Math.abs(tx.amount).toFixed(2)} USDC
                          </td>
                          <td className="px-4 py-3">
                            {tx.fullHash && tx.fullHash !== "N/A" && (
                              <a
                                href={getExplorerLink(tx.fullHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                              >
                                View <ExternalLink className="w-3 h-3" />
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
          </div>

          {/* Transfer Funds Panel (MetaMask Client-Signed) */}
          <div className="card p-6 space-y-6 flex flex-col justify-start h-fit">
            <div>
              <h3 className="font-display font-bold text-dark-900 text-lg flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
                Transfer Treasury Funds
              </h3>
              <p className="text-xs text-dark-500 mt-1">Directly signed from your Treasury MetaMask wallet. Zero server custody.</p>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-dark-700 block mb-1.5">Asset Token</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["USDC", "NATIVE"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setToken(t)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        token === t
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-dark-200 text-dark-600 hover:border-dark-350"
                      }`}
                    >
                      {t === "NATIVE" ? "AVAX" : t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-dark-700 block mb-1.5">Destination Wallet Address</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="input-field font-mono text-xs w-full"
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
                    className="input-field w-full pr-16 text-sm font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-dark-400">
                    {token === "NATIVE" ? "AVAX" : token}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={transferring || loadingStatus}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2 cursor-pointer font-bold"
              >
                {transferring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in MetaMask...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Transfer via MetaMask
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
