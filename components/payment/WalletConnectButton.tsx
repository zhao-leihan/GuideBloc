"use client";

import { useState, useCallback } from "react";
import { Wallet, Unplug, ChevronDown } from "lucide-react";
import { getNetworkConfig, getExplorerAddressLink } from "@/lib/crypto/networkConfig";

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
}

interface WalletConnectButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  className?: string;
}

export default function WalletConnectButton({
  onConnect,
  onDisconnect,
  className = "",
}: WalletConnectButtonProps) {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
  });
  const [connecting, setConnecting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const cfg = getNetworkConfig();

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("Please install MetaMask to use crypto payments");
      return;
    }

    setConnecting(true);
    try {
      const accounts: string[] = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned");
      }

      // Verify and enforce correct network
      const currentChainIdHex: string = await (window as any).ethereum.request({
        method: "eth_chainId",
      });

      if (currentChainIdHex.toLowerCase() !== cfg.chainIdHex.toLowerCase()) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: cfg.chainIdHex }],
          });
        } catch {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: cfg.chainIdHex,
                chainName: cfg.name,
                rpcUrls: [cfg.rpcUrl],
                nativeCurrency: cfg.nativeCurrency,
                blockExplorerUrls: [cfg.explorerUrl],
              },
            ],
          });
        }
      }

      setWallet({ address: accounts[0], chainId: cfg.chainIdDecimal, isConnected: true });
      onConnect?.(accounts[0]);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    } finally {
      setConnecting(false);
    }
  }, [cfg, onConnect]);

  const disconnect = useCallback(() => {
    setWallet({ address: null, chainId: null, isConnected: false });
    setShowMenu(false);
    onDisconnect?.();
  }, [onDisconnect]);

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!wallet.isConnected) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className={`btn-primary flex items-center gap-2 ${className}`}
      >
        <Wallet className="w-4 h-4" />
        <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        className={`btn-outline flex items-center gap-2 font-mono text-sm ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>{formatAddress(wallet.address!)}</span>
        <ChevronDown className="w-3.5 h-3.5 text-dark-400" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 card p-2 z-50">
          <button
            onClick={() => {
              navigator.clipboard.writeText(wallet.address!);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-dark-700 hover:bg-dark-50 rounded-lg cursor-pointer"
          >
            Copy Address
          </button>
          <a
            href={getExplorerAddressLink(wallet.address!)}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 text-sm text-dark-700 hover:bg-dark-50 rounded-lg cursor-pointer"
          >
            View on SnowTrace
          </a>
          <hr className="my-1 border-dark-100" />
          <button
            onClick={disconnect}
            className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/5 rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <Unplug className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
