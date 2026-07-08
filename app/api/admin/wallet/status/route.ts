import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ethers } from "ethers";
import { getTokenAddress } from "@/lib/crypto/payment";

export const dynamic = "force-dynamic";

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const network = (searchParams.get("network") || "base") as "celo" | "polygon" | "base";

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
    const address = wallet.address;

    // Fetch native balance (ETH / MATIC / CELO)
    const nativeBal = await provider.getBalance(address);
    const formattedNative = ethers.formatEther(nativeBal);

    // Fetch USDT & USDC balance
    let usdcBalance = "0.00";
    let usdtBalance = "0.00";

    try {
      const usdcAddress = getTokenAddress("USDC", network);
      const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, provider);
      const usdcBal = await usdcContract.balanceOf(address);
      usdcBalance = ethers.formatUnits(usdcBal, 6);
    } catch (e) {
      console.warn("Failed to fetch USDC balance:", e);
    }

    try {
      const usdtAddress = getTokenAddress("USDT", network);
      const usdtContract = new ethers.Contract(usdtAddress, ERC20_ABI, provider);
      const usdtBal = await usdtContract.balanceOf(address);
      usdtBalance = ethers.formatUnits(usdtBal, 6);
    } catch (e) {
      console.warn("Failed to fetch USDT balance:", e);
    }

    return NextResponse.json({
      address,
      usdcBalance,
      usdtBalance,
      nativeBalance: formattedNative,
      network,
      rpcUrl
    });
  } catch (error: any) {
    console.error("Admin wallet status error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
