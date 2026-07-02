"use client";

import { useState, useCallback } from "react";
import { Wallet, Unplug, ChevronDown } from "lucide-react";

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

      const chainIdHex: string = await (window as any).ethereum.request({
        method: "eth_chainId",
      });
      const chainId = parseInt(chainIdHex, 16);

      // Switch to Polygon if not already
      if (chainId !== 137) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x89" }], // Polygon
          });
        } catch {
          // Add Polygon network
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x89",
                chainName: "Polygon Mainnet",
                rpcUrls: ["https://polygon-rpc.com"],
                nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                blockExplorerUrls: ["https://polygonscan.com"],
              },
            ],
          });
        }
      }

      setWallet({ address: accounts[0], chainId: 137, isConnected: true });
      onConnect?.(accounts[0]);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    } finally {
      setConnecting(false);
    }
  }, [onConnect]);

  const disconnect = useCallback(() => {
    setWallet({ address: null, chainId: null, isConnected: false });
    setShowMenu(false);
    onDisconnect?.();
  }, [onDisconnect]);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!wallet.isConnected) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className={`btn-primary flex items-center gap-2 ${className}`}
      >
        <Wallet className="w-4 h-4" />
        {connecting ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`btn-outline flex items-center gap-2 ${className}`}
      >
        <div className="w-2 h-2 bg-secondary rounded-full" />
        {truncateAddress(wallet.address!)}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 card p-2 z-50">
          <button
            onClick={() => {
              navigator.clipboard.writeText(wallet.address!);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-dark-700 hover:bg-dark-50 rounded-lg"
          >
            Copy Address
          </button>
          <a
            href={`https://polygonscan.com/address/${wallet.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 text-sm text-dark-700 hover:bg-dark-50 rounded-lg"
          >
            View on Polygonscan
          </a>
          <hr className="my-1 border-dark-100" />
          <button
            onClick={disconnect}
            className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/5 rounded-lg flex items-center gap-2"
          >
            <Unplug className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
