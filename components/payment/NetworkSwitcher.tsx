"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getNetworkConfig } from "@/lib/crypto/networkConfig";

interface NetworkSwitcherProps {
  targetChain?: "avalanche";
  onSwitched?: () => void;
}

export default function NetworkSwitcher({
  onSwitched,
}: NetworkSwitcherProps) {
  const [currentChain, setCurrentChain] = useState<number | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [switching, setSwitching] = useState(false);

  const cfg = getNetworkConfig();
  const targetChainId = cfg.chainIdDecimal;

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;

    const checkChain = async () => {
      try {
        const chainIdHex: string = await (window as any).ethereum.request({
          method: "eth_chainId",
        });
        const chainId = parseInt(chainIdHex, 16);
        setCurrentChain(chainId);
        setIsCorrectNetwork(chainId === targetChainId);
      } catch {
        // Wallet not connected
      }
    };

    checkChain();
    (window as any).ethereum.on?.("chainChanged", checkChain);

    return () => {
      (window as any).ethereum?.removeListener?.("chainChanged", checkChain);
    };
  }, [targetChainId]);

  const handleSwitch = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    setSwitching(true);
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: cfg.chainIdHex }],
      });
      setIsCorrectNetwork(true);
      onSwitched?.();
    } catch (err: any) {
      // Chain not added - add it
      if (err.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: cfg.chainIdHex,
            chainName: cfg.name,
            rpcUrls: [cfg.rpcUrl],
            nativeCurrency: cfg.nativeCurrency,
            blockExplorerUrls: [cfg.explorerUrl],
          }],
        });
      }
    } finally {
      setSwitching(false);
    }
  };

  if (isCorrectNetwork) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Connected to {cfg.badgeLabel}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs">
      <div className="flex items-center gap-1.5 text-amber-800">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>Wrong Network. Please switch to {cfg.badgeLabel}.</span>
      </div>
      <button
        onClick={handleSwitch}
        disabled={switching}
        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
      >
        {switching ? "Switching..." : `Switch to ${cfg.shortName}`}
      </button>
    </div>
  );
}
