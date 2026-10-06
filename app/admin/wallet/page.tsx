"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Wallet, ArrowRightLeft, Copy, ExternalLink, RefreshCw, Send, Loader2, ShieldCheck, AlertCircle, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
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

interface RelayerInfo {
  relayerAddress: string;
  relayerAvaxBalance: string;
  escrowContractAddress: string;
  escrowUsdcBalance: string;
  isGasCritical: boolean;
  isGasLow: boolean;
  network: string;
}

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
];

export default function AdminWalletPage() {
  const network = "avalanche";
  const [status, setStatus] = useState<TreasuryStatus | null>(null);
  const [relayerInfo, setRelayerInfo] = useState<RelayerInfo | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [transferring, setTransferring] = useState(false);

  // Manual Release State
  const [manualBookingId, setManualBookingId] = useState("cmutsca370001tdx9zl3rti7t");
  const [releasing, setReleasing] = useState(false);

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
      const [treasuryRes, relayerRes] = await Promise.all([
        fetch(`/api/admin/wallet/status?network=${network}`),
        fetch("/api/admin/relayer-status"),
      ]);

      if (treasuryRes.ok) {
        const data = await treasuryRes.json();
        setStatus(data);
      } else {
        toast.error("Failed to retrieve treasury wallet balances");
      }

      if (relayerRes.ok) {
        const relayerData = await relayerRes.json();
        setRelayerInfo(relayerData);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading wallet balances");
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleTopUpRelayer = async (amountAvax: string = "0.01") => {
    if (!relayerInfo?.relayerAddress) return;
    if (typeof window === "undefined" || !(window as any).ethereum) {
      toast.error("MetaMask extension not detected!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const loadId = toast.loading(`Please confirm ${amountAvax} AVAX transfer in MetaMask...`);
      const tx = await signer.sendTransaction({
        to: relayerInfo.relayerAddress,
        value: ethers.parseEther(amountAvax),
      });

      toast.loading("Awaiting block confirmation on Avalanche...", { id: loadId });
      await tx.wait(1);

      toast.dismiss(loadId);
      toast.success(`Successfully funded ${amountAvax} AVAX to relayer!`);
      fetchStatus();
    } catch (err: any) {
      console.error(err);
      toast.error(err.reason || err.message || "Failed to send AVAX");
    }
  };

  const handleManualRelease = async () => {
    if (!manualBookingId.trim()) {
      toast.error("Please provide a valid Booking ID");
      return;
    }

    try {
      setReleasing(true);
      const loadId = toast.loading("Executing on-chain release transaction...");

      const res = await fetch("/api/admin/release-escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: manualBookingId.trim() }),
      });

      const data = await res.json();
      toast.dismiss(loadId);

      if (res.ok) {
        toast.success(data.message || "Escrow released successfully on-chain!");
        fetchStatus();
        fetchHistory();
      } else {
        toast.error(data.message || "Failed to release escrow funds");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Network communication error");
    } finally {
      setReleasing(false);
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

            {/* Smart Contract Escrow & Relayer Gas Health Card */}
            <div className="card p-6 space-y-5 border border-dark-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    relayerInfo?.isGasCritical
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-600"
                      : relayerInfo?.isGasLow
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                  }`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-dark-900 text-lg">
                      Smart Contract Escrow & Relayer Gas Health
                    </h3>
                    <p className="text-xs text-dark-400">
                      Automated network gas monitoring for tour escrow settlements
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                    relayerInfo?.isGasCritical
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : relayerInfo?.isGasLow
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {relayerInfo?.isGasCritical
                      ? "Critical: Gas Depleted"
                      : relayerInfo?.isGasLow
                      ? "Warning: Low Gas"
                      : "Healthy: Gas Ready"}
                  </span>
                </div>
              </div>

              {/* Grid Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-dark-50 rounded-2xl border border-dark-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-dark-500 font-semibold">Relayer Gas Balance (AVAX)</p>
                    {relayerInfo?.isGasCritical && (
                      <span className="text-[10px] font-black text-rose-600 uppercase">Top Up Required</span>
                    )}
                  </div>
                  <p className="font-bold text-2xl font-mono text-dark-900">
                    {relayerInfo ? Number(relayerInfo.relayerAvaxBalance).toFixed(6) : "0.000000"} AVAX
                  </p>
                  <p className="text-[11px] text-dark-400 font-mono truncate">
                    Wallet: {relayerInfo ? formatAddress(relayerInfo.relayerAddress) : "..."}
                  </p>
                  
                  {/* Quick Top-up Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleTopUpRelayer("0.01")}
                      className="w-full py-2.5 px-3 bg-dark-900 hover:bg-dark-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Fund 0.01 AVAX via MetaMask
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-dark-50 rounded-2xl border border-dark-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-dark-500 font-semibold">Locked Escrow Vault (USDC)</p>
                    <span className="text-[10px] font-bold text-dark-600 bg-white border border-dark-200 px-2 py-0.5 rounded-full">On-Chain</span>
                  </div>
                  <p className="font-bold text-2xl font-mono text-dark-900">
                    {relayerInfo ? Number(relayerInfo.escrowUsdcBalance).toFixed(2) : "0.00"} USDC
                  </p>
                  <p className="text-[11px] text-dark-400 font-mono truncate">
                    Contract: {relayerInfo ? formatAddress(relayerInfo.escrowContractAddress) : "..."}
                  </p>

                  <div className="pt-2">
                    <a
                      href={getExplorerAddressLink(relayerInfo?.escrowContractAddress || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 bg-white hover:bg-dark-100 text-dark-700 border border-dark-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Escrow on Snowtrace
                    </a>
                  </div>
                </div>
              </div>

              {/* Manual On-Chain Release Trigger Tool */}
              <div className="p-4 bg-dark-50 rounded-2xl border border-dark-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-dark-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-dark-700" />
                    Direct On-Chain Settlement Tool
                  </h4>
                  <span className="text-[10px] text-dark-500 font-medium">Emergency Manual Execution</span>
                </div>
                <p className="text-[11px] text-dark-500 leading-relaxed">
                  If an escrow transaction was halted due to gas depletion, enter the Booking ID below to trigger direct settlement (90% to Tour Guide, 10% to Admin Treasury):
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter Booking ID (e.g. cmutsca370001tdx9zl3rti7t)..."
                    value={manualBookingId}
                    onChange={(e) => setManualBookingId(e.target.value)}
                    className="flex-grow p-2.5 px-3 bg-white border border-dark-200 rounded-xl text-xs font-mono font-semibold text-dark-900 outline-none focus:border-dark-400"
                  />
                  <button
                    type="button"
                    onClick={handleManualRelease}
                    disabled={releasing}
                    className="py-2.5 px-4 bg-dark-900 hover:bg-dark-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm"
                  >
                    {releasing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing Settlement...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Execute Settlement
                      </>
                    )}
                  </button>
                </div>
              </div>
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
