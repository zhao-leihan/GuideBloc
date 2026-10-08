import { ethers } from "ethers";
import { prisma } from "@/lib/prisma";
import { getNetworkConfig } from "./networkConfig";

const ESCROW_ABI = [
  "function release(bytes32 bookingId) external",
  "function getBooking(bytes32 bookingId) external view returns (tuple(address tourist, address guide, address token, uint256 amount, uint8 status))",
  "function adminTreasury() external view returns (address)",
];

/**
 * Reconciles on-chain escrow locks with database state.
 * If relayer has sufficient AVAX gas, automatically releases any booking
 * whose smart contract status is still ACTIVE (1).
 */
export async function syncPendingEscrowReleases(): Promise<{
  success: boolean;
  relayerBalance: string;
  releasedCount: number;
  releases: Array<{ bookingId: string; txHash: string; amountUSDC: string }>;
  errors: string[];
}> {
  const cfg = getNetworkConfig();
  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);

  const relayerKey = process.env.RELAYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (!relayerKey) {
    return {
      success: false,
      relayerBalance: "0",
      releasedCount: 0,
      releases: [],
      errors: ["Relayer private key not configured"],
    };
  }

  const signer = new ethers.Wallet(relayerKey, provider);
  const relayerBalanceWei = await provider.getBalance(signer.address);
  const relayerBalance = ethers.formatEther(relayerBalanceWei);

  // Require minimum 0.0008 AVAX to perform on-chain release safely
  if (relayerBalanceWei < ethers.parseEther("0.0008")) {
    return {
      success: false,
      relayerBalance,
      releasedCount: 0,
      releases: [],
      errors: [`Relayer gas balance (${Number(relayerBalance).toFixed(6)} AVAX) is too low to process releases`],
    };
  }

  const escrowContract = new ethers.Contract(cfg.escrowContractAddress, ESCROW_ABI, signer);

  // Fetch recent candidate bookings from DB
  const candidateBookings = await prisma.booking.findMany({
    where: {
      status: { in: ["COMPLETED", "CONFIRMED", "PAID"] },
    },
    include: {
      gig: {
        include: {
          guide: { select: { id: true, name: true, walletAddress: true } },
        },
      },
      escrowPayout: true,
    },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  const released: Array<{ bookingId: string; txHash: string; amountUSDC: string }> = [];
  const errors: string[] = [];

  for (const booking of candidateBookings) {
    try {
      const bookingBytes32 = ethers.encodeBytes32String(booking.id.slice(0, 31));
      const onChain = await escrowContract.getBooking(bookingBytes32);

      // On-chain status: 0 = NONE, 1 = ACTIVE, 2 = RELEASED, 3 = REFUNDED
      if (Number(onChain.status) === 1) {
        console.log(`[EscrowSync] Found ACTIVE locked escrow for booking ${booking.id}. Auto-releasing on-chain...`);

        const feeData = await provider.getFeeData();
        const tx = await escrowContract.release(bookingBytes32, {
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        });

        const receipt = await tx.wait(1);
        const amountUSDC = ethers.formatUnits(onChain.amount, 6);

        // Update booking and payout records with real release transaction hash
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "COMPLETED",
            txHash: tx.hash,
          },
        }).catch(console.error);

        const guideAmount = booking.guide_price ?? (booking.totalPriceUSD - (booking.platform_fee ?? booking.totalPriceUSD * 0.1));
        const commissionAmount = booking.platform_fee ?? (booking.totalPriceUSD - guideAmount);
        const guideWallet = booking.guideWalletSnapshot || booking.gig.guide.walletAddress || onChain.guide;

        await prisma.escrowPayout.upsert({
          where: { bookingId: booking.id },
          update: {
            status: "COMPLETED",
            releaseHash: tx.hash,
          },
          create: {
            bookingId: booking.id,
            guideId: booking.gig.guide.id,
            guideWallet,
            guideAmountUSD: guideAmount,
            commissionAmountUSD: commissionAmount,
            releaseHash: tx.hash,
            status: "COMPLETED",
          },
        }).catch(console.error);

        await prisma.platformRevenue.create({
          data: {
            source: "BOOKING_COMMISSION",
            amountUSDT: commissionAmount,
            txHash: tx.hash,
            referenceId: booking.id,
          },
        }).catch(console.error);

        await prisma.paymentAuditLog.create({
          data: {
            bookingId: booking.id,
            txHash: tx.hash,
            source: "AUTO_ESCROW_SYNC",
            status: "SUCCESS",
            rawPayload: {
              blockNumber: receipt?.blockNumber,
              amountUSDC,
              relayer: signer.address,
            },
          },
        }).catch(console.error);

        released.push({
          bookingId: booking.id,
          txHash: tx.hash,
          amountUSDC,
        });
      }
    } catch (err: any) {
      console.error(`[EscrowSync] Error checking/releasing booking ${booking.id}:`, err.message);
      errors.push(`Booking ${booking.id}: ${err.message}`);
    }
  }

  return {
    success: true,
    relayerBalance,
    releasedCount: released.length,
    releases: released,
    errors,
  };
}
