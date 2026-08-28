"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShieldCheck, Rocket, CheckCircle2, ExternalLink, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import Link from "next/link";
import escrowArtifact from "@/artifacts/contracts/ExplomateEscrowV2.sol/ExplomateEscrowV2.json";

export default function DeployEscrowPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [avaxBalance, setAvaxBalance] = useState<string>("0.00");
  const [treasuryAddress, setTreasuryAddress] = useState("0x079D9c349741C27565ee04e31E4174F640F512aE");
  const [deploying, setDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);

  const checkWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const addr = accounts[0].address;
          setWalletAddress(addr);
          const bal = await provider.getBalance(addr);
          setAvaxBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    checkWallet();
  }, []);

  const connectMetaMask = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      toast.error("Please install MetaMask to deploy the contract");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      // Switch to Avalanche C-Chain
      try {
        await provider.send("wallet_switchEthereumChain", [{ chainId: "0xa86a" }]);
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          await provider.send("wallet_addEthereumChain", [{
            chainId: "0xa86a",
            chainName: "Avalanche C-Chain",
            rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
            nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
            blockExplorerUrls: ["https://snowtrace.io"],
          }]);
        }
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        const bal = await provider.getBalance(accounts[0]);
        setAvaxBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
        toast.success(`Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to connect MetaMask");
    }
  };

  const handleDeploy = async () => {
    if (!walletAddress) {
      await connectMetaMask();
      return;
    }

    if (Number(avaxBalance) < 0.01) {
      toast.error(`Insufficient AVAX for gas. Balance: ${avaxBalance} AVAX. Needed: ~0.015 AVAX.`);
      return;
    }

    setDeploying(true);
    const toastId = toast.loading("Submitting contract deployment to Avalanche C-Chain...");

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      // Factory for ExplomateEscrowV2
      const factory = new ethers.ContractFactory(
        escrowArtifact.abi,
        escrowArtifact.bytecode,
        signer
      );

      // Deploy with constructor parameter: adminTreasury
      const contract = await factory.deploy(treasuryAddress);
      
      toast.loading("Transaction submitted! Waiting for Avalanche block confirmation...", { id: toastId });
      
      const deploymentTx = contract.deploymentTransaction();
      if (deploymentTx) {
        setDeployTxHash(deploymentTx.hash);
      }

      await contract.waitForDeployment();
      const targetAddress = await contract.getAddress();

      setDeployedAddress(targetAddress);
      toast.dismiss(toastId);
      toast.success(`ExplomateEscrowV2 deployed at: ${targetAddress}!`);

      // Update backend environment
      await fetch("/api/admin/escrow/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAddress: targetAddress }),
      });

    } catch (err: any) {
      toast.dismiss(toastId);
      console.error("Deployment error:", err);
      toast.error(err.reason || err.message || "Contract deployment failed");
    } finally {
      setDeploying(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-dark-900 flex items-center gap-2">
            <Rocket className="w-7 h-7 text-primary" />
            Deploy Pure Web3 Escrow V2
          </h1>
          <p className="text-dark-500 text-sm mt-1">
            Deploy the decentralized, serverless smart contract directly from your MetaMask. 0 server dependency, 0 bot vulnerability.
          </p>
        </div>

        {/* Security & Architecture Highlights */}
        <div className="card p-6 bg-gradient-to-br from-emerald-500/10 via-primary/5 to-transparent border-emerald-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-dark-900 text-base">ExplomateEscrowV2 Specifications</h3>
              <ul className="text-xs text-dark-600 space-y-1.5 list-disc list-inside">
                <li><strong>Pure Peer-to-Peer:</strong> Tourist pays directly to Escrow ➡️ 90% Guide + 10% Admin Treasury.</li>
                <li><strong>0 Server Dependency:</strong> No backend wallets, no private keys on server, completely bot-proof.</li>
                <li><strong>Anti-Trap Guarantee:</strong> Equipped with <code className="bg-dark-100 px-1 py-0.5 rounded font-mono">emergencyRescue()</code> so Admin can recover any stranded funds.</li>
                <li><strong>Permanent Owner:</strong> The MetaMask wallet that deploys this contract owns it 100%.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Deployment Form */}
        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-dark-700 uppercase tracking-wider mb-2">
              Platform Admin Treasury Wallet (Destination for 10% Commission)
            </label>
            <input
              type="text"
              value={treasuryAddress}
              onChange={(e) => setTreasuryAddress(e.target.value)}
              className="input-field font-mono text-xs w-full"
              placeholder="0x..."
            />
          </div>

          <div className="p-4 bg-dark-50 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-dark-500">Connected Deployer Wallet</p>
              <p className="text-sm font-mono font-bold text-dark-900 mt-0.5">
                {walletAddress ? `${walletAddress.substring(0, 10)}...${walletAddress.substring(walletAddress.length - 8)}` : "Not connected"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-dark-500">AVAX Balance</p>
              <p className="text-sm font-mono font-bold text-emerald-600 mt-0.5">{avaxBalance} AVAX</p>
            </div>
          </div>

          {deployedAddress ? (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                ExplomateEscrowV2 Is Active On-Chain!
              </div>
              <p className="text-xs font-mono text-dark-800 break-all bg-white p-3 rounded-xl border border-emerald-500/20">
                {deployedAddress}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={`https://snowtrace.io/address/${deployedAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  View on SnowTrace <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <Link
                  href="/explore"
                  className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  Test Real Booking Now <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
            >
              {deploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deploying to Avalanche C-Chain...
                </>
              ) : !walletAddress ? (
                <>
                  <Rocket className="w-4 h-4" />
                  Connect MetaMask to Deploy
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Deploy ExplomateEscrowV2 via MetaMask (~0.015 AVAX)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
