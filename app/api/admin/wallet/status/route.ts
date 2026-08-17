import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ethers } from "ethers";
import { getTokenAddress, SupportedNetwork } from "@/lib/crypto/payment";

export const dynamic = "force-dynamic";

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

/**
 * Admin Wallet On-Chain Status Query.
 * Fetches real-time live balances from Base L2 blockchain matching Exodus Wallet / Treasury Address.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const network = (searchParams.get("network") || "avalanche") as SupportedNetwork;

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
        : (isBaseSepolia ? "https://sepolia.base.org" : "https://mainnet.base.org");
    }

    // Exodus Wallet / Treasury Address configured in environment
    const treasuryAddress = process.env.TREASURY_ADDRESS || "0x079D9c349741C27565ee04e31E4174F640F512aE";
    const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "0x37DA6Bb53A3973Dee2ed7b766f5e341ff123E8C8";

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const address = treasuryAddress;

    // 1. Fetch Native Gas Balance (ETH / MATIC / CELO) on Base L2
    let formattedNative = "0.0000";
    try {
      const nativeBal = await provider.getBalance(address);
      formattedNative = ethers.formatEther(nativeBal);
    } catch (e) {
      console.warn("Failed to fetch native balance:", e);
    }

    // 2. Fetch USDC & USDT Balance on Base L2 (matching Exodus Wallet)
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
      escrowAddress,
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
