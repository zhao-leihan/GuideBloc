"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const POLYGON_CHAIN_ID = 137; // 0x89
const BASE_CHAIN_ID = 8453; // 0x2105

interface NetworkSwitcherProps {
  targetChain?: "polygon" | "base";
  onSwitched?: () => void;
}

export default function NetworkSwitcher({
  targetChain = "base",
  onSwitched,
}: NetworkSwitcherProps) {
  const [currentChain, setCurrentChain] = useState<number | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [switching, setSwitching] = useState(false);

  const targetChainId = targetChain === "polygon" ? POLYGON_CHAIN_ID : BASE_CHAIN_ID;

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
        const networks: Record<string, any> = {
          polygon: {
            chainId: "0x89",
            chainName: "Polygon Mainnet",
            rpcUrls: ["https://polygon-rpc.com"],
            nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
            blockExplorerUrls: ["https://polygonscan.com"],
          },
          base: {
            chainId: "0x2105",
            chainName: "Base",
            rpcUrls: ["https://mainnet.base.org"],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            blockExplorerUrls: ["https://basescan.org"],
          },
        };

        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [networks[targetChain]],
        });
      }
    } finally {
      setSwitching(false);
    }
  };

  if (isCorrectNetwork) {
    return (
      <div className="flex items-center gap-2 text-secondary text-sm">
        <CheckCircle2 className="w-4 h-4" />
        Connected to {targetChain === "polygon" ? "Polygon" : "Base"}
      </div>
    );
  }

  if (currentChain === null) return null;

  return (
    <div className="flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-xl px-4 py-3">
      <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-dark-800">Wrong Network</p>
        <p className="text-xs text-dark-500">
          Switch to {targetChain === "polygon" ? "Polygon" : "Base"} to continue
        </p>
      </div>
      <button
        onClick={switchNetwork}
        disabled={switching}
        className="btn-outline text-xs py-1.5 px-3 disabled:opacity-50"
      >
        {switching ? "Switching..." : "Switch"}
      </button>
    </div>
  );
}
