import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ethers } from "ethers";
import { getTokenAddress, SupportedNetwork } from "@/lib/crypto/payment";

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)"
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, recipientAddress, amount, network = "avalanche" } = body as {
      token: "USDT" | "USDC" | "NATIVE";
      recipientAddress: string;
      amount: number;
      network: SupportedNetwork;
    };

    if (!recipientAddress || !token || !amount || Number(amount) <= 0) {
      return NextResponse.json({ message: "Invalid parameters" }, { status: 400 });
    }

    const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
    const isBaseSepolia = process.env.NEXT_PUBLIC_BASE_NETWORK === "sepolia";
    const isAvaxMainnet = process.env.NEXT_PUBLIC_AVAX_NETWORK === "mainnet";
    let rpcUrl = "https://api.avax.network/ext/bc/C/rpc";
    
    if (network === "avalanche") {
      rpcUrl = isAvaxMainnet 
        ? "https://api.avax.network/ext/bc/C/rpc" 
        : "https://api.avax-test.network/ext/bc/C/rpc";
    } else if (network === "base") {
      rpcUrl = isBaseMainnet 
        ? "https://mainnet.base.org" 
        : (isBaseSepolia ? "https://sepolia.base.org" : "http://127.0.0.1:8545");
    }

    let privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (rpcUrl === "http://127.0.0.1:8545") {
      privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Default Hardhat Account #0
    }

    if (!privateKey) {
      return NextResponse.json({ message: "Custodian Private Key not configured" }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    let txHash = "";

    if (token === "NATIVE") {
      // Transfer native gas tokens (AVAX / ETH)
      console.log(`[Admin Wallet] Transferring ${amount} Native to ${recipientAddress} on ${network}`);
      const tx = await wallet.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(amount.toString())
      });
      const receipt = await tx.wait();
      txHash = receipt?.hash || tx.hash;
    } else {
      // Transfer ERC20 (USDT / USDC)
      const tokenAddress = getTokenAddress(token, network);
      console.log(`[Admin Wallet] Transferring ${amount} ${token} (${tokenAddress}) to ${recipientAddress} on ${network}`);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
      const parsedAmount = ethers.parseUnits(amount.toString(), 6);
      const tx = await contract.transfer(recipientAddress, parsedAmount);
      const receipt = await tx.wait();
      txHash = receipt?.hash || tx.hash;
    }

    if (!txHash) {
      return NextResponse.json({ message: "Transaction failed to complete" }, { status: 500 });
    }

    console.log(`[Admin Wallet] Successfully sent! Hash: ${txHash}`);
    return NextResponse.json({ success: true, txHash });
  } catch (error: any) {
    console.error("Admin wallet transfer error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
