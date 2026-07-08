import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ethers } from "ethers";
import { getTokenAddress } from "@/lib/crypto/payment";

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
    const { recipient, token, amount, network = "base" } = body;

    if (!recipient || !token || !amount || Number(amount) <= 0) {
      return NextResponse.json({ message: "Invalid parameters" }, { status: 400 });
    }

    const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
    const isBaseSepolia = process.env.NEXT_PUBLIC_BASE_NETWORK === "sepolia";
    let rpcUrl = "http://127.0.0.1:8545";
    
    if (network === "base") {
      rpcUrl = isBaseMainnet 
        ? "https://mainnet.base.org" 
        : (isBaseSepolia ? "https://sepolia.base.org" : "http://127.0.0.1:8545");
    } else if (network === "celo") {
      rpcUrl = "https://forno.celo-sepolia.celo-testnet.org";
    } else if (network === "polygon") {
      rpcUrl = "http://127.0.0.1:8545";
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
      // Transfer native gas tokens (ETH / CELO / MATIC)
      console.log(`[Admin Wallet] Transferring ${amount} Native to ${recipient} on ${network}`);
      const tx = await wallet.sendTransaction({
        to: recipient,
        value: ethers.parseEther(amount.toString())
      });
      const receipt = await tx.wait();
      txHash = receipt ? receipt.hash : "";
    } else {
      // Transfer ERC20 tokens (USDC / USDT)
      const tokenAddress = getTokenAddress(token, network);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
      const rawAmount = ethers.parseUnits(Number(amount).toFixed(6), 6);

      console.log(`[Admin Wallet] Transferring ${amount} ${token} to ${recipient} on ${network} (Address: ${tokenAddress})`);
      const tx = await contract.transfer(recipient, rawAmount);
      const receipt = await tx.wait();
      txHash = receipt ? receipt.hash : "";
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
