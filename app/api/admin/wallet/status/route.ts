import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ethers } from "ethers";
import { getTokenAddress, SupportedNetwork } from "@/lib/crypto/payment";
import { getNetworkConfig } from "@/lib/crypto/networkConfig";

export const dynamic = "force-dynamic";

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

/**
 * Admin Wallet On-Chain Status Query.
 * Fetches real-time live balances from Avalanche C-Chain matching Treasury Address.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const network: SupportedNetwork = "avalanche";
    const cfg = getNetworkConfig();
    const rpcUrl = cfg.rpcUrl;

    // Treasury Address configured in environment or network config
    const treasuryAddress = process.env.TREASURY_ADDRESS || cfg.treasuryAddress;
    const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || cfg.escrowContractAddress;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const address = treasuryAddress;

    // 1. Fetch Native Gas Balance (AVAX) on Avalanche C-Chain
    let formattedNative = "0.0000";
    try {
      const nativeBal = await provider.getBalance(address);
      formattedNative = ethers.formatEther(nativeBal);
    } catch (e) {
      console.warn("Failed to fetch native balance:", e);
    }

    // 2. Fetch USDC & USDT Balance on Avalanche C-Chain
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

    // 3. If on-chain USDC balance is zero, check DB platform revenue as secondary reference
    // This is informational only — DB ledger may differ from on-chain if there were sync failures
    let isDbFallback = false;
    if (Number(usdcBalance) === 0) {
      const { prisma } = await import("@/lib/prisma");
      const revAgg = await prisma.platformRevenue.aggregate({
        _sum: { amountUSDT: true },
      });
      const dbFeeSum = revAgg._sum.amountUSDT || 0;
      if (dbFeeSum > 0) {
        usdcBalance = dbFeeSum.toFixed(2);
        isDbFallback = true; // Signals to UI that this is a DB ledger sum, not live on-chain balance
      }
    }

    return NextResponse.json({
      address,
      escrowAddress,
      usdcBalance,
      usdtBalance,
      nativeBalance: formattedNative,
      network,
      rpcUrl,
      isDbFallback, // If true, balance shown is from DB ledger, not live on-chain
    });
  } catch (error: any) {
    console.error("Admin wallet status error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
