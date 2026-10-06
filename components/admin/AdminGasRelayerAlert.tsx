"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Copy, RefreshCw, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";
import { ethers } from "ethers";

interface RelayerStatus {
  relayerAddress: string;
  relayerAvaxBalance: string;
  escrowContractAddress: string;
  escrowUsdcBalance: string;
  isGasCritical: boolean;
  isGasLow: boolean;
  network: string;
  chainId: number;
}

export default function AdminGasRelayerAlert() {
  const [status, setStatus] = useState<RelayerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/relayer-status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to load relayer status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status || (!status.isGasCritical && !status.isGasLow)) {
    return null;
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(status.relayerAddress);
    toast.success("Relayer address copied to clipboard");
  };

  const handleTopUpMetaMask = async (amountAvax: string = "0.01") => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      toast.error("MetaMask extension not detected in browser");
      return;
    }

    try {
      setTopUpLoading(true);
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const loadId = toast.loading(`Please confirm ${amountAvax} AVAX transfer in MetaMask...`);

      const tx = await signer.sendTransaction({
        to: status.relayerAddress,
        value: ethers.parseEther(amountAvax),
      });

      toast.loading("Awaiting block confirmation on Avalanche...", { id: loadId });
      await tx.wait(1);

      toast.dismiss(loadId);
      toast.success(`Successfully funded ${amountAvax} AVAX to relayer`);
      fetchStatus();
    } catch (err: any) {
      console.error("Gas top-up error:", err);
      toast.error(err.reason || err.message || "Failed to send AVAX from MetaMask");
    } finally {
      setTopUpLoading(false);
    }
  };

  const isCritical = status.isGasCritical;

  return (
    <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 text-white shadow-xl animate-in slide-in-from-top-3 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Alert Message */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
              isCritical
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm tracking-tight text-white">
                {isCritical
                  ? "Relayer Gas Depleted — Escrow Auto-Release Paused"
                  : "Low Relayer Gas Reserve Warning"}
              </h4>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isCritical
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}
              >
                {isCritical ? "Critical: < 0.002 AVAX" : "Warning: < 0.01 AVAX"}
              </span>
            </div>

            <p className="text-xs text-dark-300 leading-relaxed">
              Current relayer gas reserve:{" "}
              <strong className="font-mono text-white font-bold">
                {Number(status.relayerAvaxBalance).toFixed(6)} AVAX
              </strong>
              . Smart contract funds (
              <strong className="font-mono text-white">{status.escrowUsdcBalance} USDC</strong>
              ) cannot be auto-disbursed to guides and treasury until the relayer is funded.
            </p>

            {/* Wallet Address Display */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-dark-400 font-semibold">Relayer Address:</span>
              <code className="text-[11px] font-mono bg-dark-950 border border-dark-800 px-2 py-0.5 rounded-lg text-dark-200">
                {status.relayerAddress.slice(0, 10)}...{status.relayerAddress.slice(-8)}
              </code>
              <button
                type="button"
                onClick={copyAddress}
                className="p-1 hover:bg-dark-800 rounded-md text-dark-400 hover:text-white transition-colors cursor-pointer"
                title="Copy address"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={() => handleTopUpMetaMask("0.01")}
            disabled={topUpLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-dark-100 text-dark-950 flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Top Up 0.01 AVAX via MetaMask
          </button>

          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="p-2.5 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-xl text-dark-300 hover:text-white transition-all cursor-pointer"
            title="Refresh balance check"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
