import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ethers } from "ethers";
import { getNetworkConfig } from "@/lib/crypto/networkConfig";

export const dynamic = "force-dynamic";

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const cfg = getNetworkConfig();
    const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);

    const relayerKey = process.env.RELAYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
    if (!relayerKey) {
      return NextResponse.json({ message: "Relayer key not configured" }, { status: 500 });
    }

    const relayerWallet = new ethers.Wallet(relayerKey, provider);
    const relayerAddress = relayerWallet.address;

    // 1. Fetch Relayer AVAX balance
    const relayerBalWei = await provider.getBalance(relayerAddress);
    const relayerAvaxBalance = ethers.formatEther(relayerBalWei);
    const relayerAvaxNum = parseFloat(relayerAvaxBalance);

    // 2. Fetch Escrow Contract USDC balance
    let escrowUsdcBalance = "0.00";
    try {
      const usdcContract = new ethers.Contract(cfg.usdcTokenAddress, ERC20_ABI, provider);
      const escrowBalWei = await usdcContract.balanceOf(cfg.escrowContractAddress);
      escrowUsdcBalance = ethers.formatUnits(escrowBalWei, 6);
    } catch (e: any) {
      console.warn("Error reading escrow USDC balance:", e.message);
    }

    // Thresholds
    const isGasCritical = relayerAvaxNum < 0.002; // Cannot afford a single release
    const isGasLow = relayerAvaxNum < 0.01;      // Low reserve warning

    return NextResponse.json({
      relayerAddress,
      relayerAvaxBalance,
      escrowContractAddress: cfg.escrowContractAddress,
      escrowUsdcBalance,
      isGasCritical,
      isGasLow,
      network: cfg.name,
      chainId: cfg.chainIdDecimal,
      recommendedTopUpAvax: "0.01",
    });
  } catch (error: any) {
    console.error("Relayer status error:", error);
    return NextResponse.json({ message: error.message || "Failed to fetch relayer status" }, { status: 500 });
  }
}
