import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ethers } from "ethers";
import { prisma } from "@/lib/prisma";
import { getNetworkConfig } from "@/lib/crypto/networkConfig";

export const dynamic = "force-dynamic";

const ESCROW_ABI = [
  "function release(bytes32 bookingId) external",
  "function getBooking(bytes32 bookingId) external view returns (tuple(address tourist, address guide, address token, uint256 amount, uint8 status))",
  "function adminTreasury() external view returns (address)",
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ message: "bookingId is required" }, { status: 400 });
    }

    const cfg = getNetworkConfig();
    const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);

    const relayerKey = process.env.RELAYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
    if (!relayerKey) {
      return NextResponse.json({ message: "Relayer private key missing" }, { status: 500 });
    }

    const signer = new ethers.Wallet(relayerKey, provider);
    const balance = await provider.getBalance(signer.address);

    if (balance < ethers.parseEther("0.001")) {
      return NextResponse.json({
        message: `Relayer wallet (${signer.address}) has insufficient gas balance: ${ethers.formatEther(balance)} AVAX. Please top up at least 0.005 AVAX first.`,
        relayerAddress: signer.address,
        currentBalance: ethers.formatEther(balance),
        isGasEmpty: true,
      }, { status: 400 });
    }

    const escrowContract = new ethers.Contract(cfg.escrowContractAddress, ESCROW_ABI, signer);
    const bookingBytes32 = ethers.encodeBytes32String(bookingId.slice(0, 31));

    // Check status
    const onChainBooking = await escrowContract.getBooking(bookingBytes32);
    if (Number(onChainBooking.status) === 2) {
      return NextResponse.json({ message: "Booking has already been released on-chain!" });
    }
    if (Number(onChainBooking.status) !== 1) {
      return NextResponse.json({ message: `Cannot release. Status in contract is ${onChainBooking.status}` }, { status: 400 });
    }

    const feeData = await provider.getFeeData();
    const tx = await escrowContract.release(bookingBytes32, {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    });

    const receipt = await tx.wait(1);

    // Update Database records
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "COMPLETED", txHash: tx.hash },
    }).catch(console.error);

    await prisma.escrowPayout.updateMany({
      where: { bookingId },
      data: { releaseHash: tx.hash, status: "COMPLETED" },
    }).catch(console.error);

    await prisma.platformRevenue.updateMany({
      where: { referenceId: bookingId },
      data: { txHash: tx.hash },
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Escrow funds released successfully on-chain!",
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber,
      explorerUrl: `${cfg.explorerUrl}/tx/${tx.hash}`,
    });
  } catch (error: any) {
    console.error("Admin manual release error:", error);
    return NextResponse.json({
      message: error.reason || error.message || "Failed to execute on-chain release",
    }, { status: 500 });
  }
}
