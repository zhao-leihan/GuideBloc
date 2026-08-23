"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const AVAX_CHAIN_ID = 43114; // 0xa86a

interface NetworkSwitcherProps {
  targetChain?: "avalanche";
  onSwitched?: () => void;
}

export default function NetworkSwitcher({
  targetChain = "avalanche",
  onSwitched,
}: NetworkSwitcherProps) {
  const [currentChain, setCurrentChain] = useState<number | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [switching, setSwitching] = useState(false);

  const targetChainId = AVAX_CHAIN_ID;

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
      (window as any).ethereum.removeListener?.("chainChanged", checkChain);
    };
  }, [targetChainId]);

  const switchNetwork = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;

    setSwitching(true);
    try {
      const chainIdHex = `0x${targetChainId.toString(16)}`;
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
      setIsCorrectNetwork(true);
      onSwitched?.();
    } catch (err: any) {
      // Chain not added - add it
      if (err.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0xa86a",
            chainName: "Avalanche C-Chain",
            rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
            nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
            blockExplorerUrls: ["https://snowtrace.io"],
          }],
        });
      }
    } finally {
      setSwitching(false);
    }
  };

  if (isCorrectNetwork) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
        <CheckCircle2 className="w-4 h-4" />
        Connected to Avalanche C-Chain
      </div>
    );
  }

  if (currentChain === null) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-warning/10 rounded-xl border border-warning/20">
      <div className="flex items-center gap-2 text-warning text-sm">
        <AlertTriangle className="w-4 h-4" />
        <span>Please switch to Avalanche C-Chain</span>
      </div>
      <button
        onClick={switchNetwork}
        disabled={switching}
        className="btn-primary text-xs px-3 py-1.5 cursor-pointer font-bold"
      >
        {switching ? "Switching..." : "Switch to Avalanche"}
      </button>
    </div>
  );
}
