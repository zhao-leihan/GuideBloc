"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Copy, RefreshCw, Send, CheckCircle2, ExternalLink, Zap } from "lucide-react";
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
    // Poll every 30 seconds while on admin pages
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status || (!status.isGasCritical && !status.isGasLow)) {
    return null;
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(status.relayerAddress);
    toast.success("Alamat wallet relayer berhasil disalin!");
  };

  const handleTopUpMetaMask = async (amountAvax: string = "0.01") => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      toast.error("MetaMask tidak terdeteksi di browser!");
      return;
    }

    try {
      setTopUpLoading(true);
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const loadId = toast.loading(`Buka MetaMask untuk mengirim ${amountAvax} AVAX gas fee...`);

      const tx = await signer.sendTransaction({
        to: status.relayerAddress,
        value: ethers.parseEther(amountAvax),
      });

      toast.loading("Menunggu konfirmasi di blockchain Avalanche...", { id: loadId });
      await tx.wait(1);

      toast.dismiss(loadId);
      toast.success(`Berhasil top-up ${amountAvax} AVAX ke relayer!`);
      fetchStatus();
    } catch (err: any) {
      console.error("Top-up gas error:", err);
      toast.error(err.reason || err.message || "Gagal mengirim AVAX dari MetaMask");
    } finally {
      setTopUpLoading(false);
    }
  };

  const isCritical = status.isGasCritical;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border shadow-lg transition-all animate-in slide-in-from-top-3 duration-300 ${
        isCritical
          ? "bg-red-500/10 border-red-500/40 text-red-950"
          : "bg-amber-500/10 border-amber-500/40 text-amber-950"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Alert Message */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
              isCritical
                ? "bg-red-500 text-white animate-pulse"
                : "bg-amber-500 text-white"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm tracking-tight">
                {isCritical
                  ? "🚨 GAS FEE RELAYER HABIS (Auto-Release Escrow Terhenti!)"
                  : "⚠️ PERINGATAN: Saldo Gas Relayer Menipis"}
              </h4>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isCritical
                    ? "bg-red-600 text-white"
                    : "bg-amber-600 text-white"
                }`}
              >
                {isCritical ? "Kritis: < 0.002 AVAX" : "Warning: < 0.01 AVAX"}
              </span>
            </div>

            <p className="text-xs text-dark-700 leading-relaxed font-medium">
              Sisa saldo gas relayer saat ini:{" "}
              <strong className="font-mono text-dark-950 font-black">
                {Number(status.relayerAvaxBalance).toFixed(6)} AVAX
              </strong>
              . Dana smart contract (
              <strong className="font-mono">{status.escrowUsdcBalance} USDC</strong>
              ) tidak bisa dicairkan otomatis ke Guide & Admin sebelum relayer memiliki saldo gas fee.
            </p>

            {/* Wallet Address Display */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-dark-500 font-semibold">Wallet Relayer:</span>
              <code className="text-[11px] font-mono bg-white/80 border border-dark-200 px-2 py-0.5 rounded-lg text-dark-800">
                {status.relayerAddress.slice(0, 10)}...{status.relayerAddress.slice(-8)}
              </code>
              <button
                type="button"
                onClick={copyAddress}
                className="p-1 hover:bg-white rounded-md text-dark-600 transition-colors cursor-pointer"
                title="Salin alamat lengkap"
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
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            Top Up 0.01 AVAX via MetaMask
          </button>

          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="p-2 bg-white hover:bg-dark-50 border border-dark-200 rounded-xl text-dark-600 transition-all cursor-pointer"
            title="Cek ulang saldo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
