import { ethers } from "ethers";

// Standard ERC-20 Transfer event topic
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export type SupportedChain = "avalanche";

export interface VerifyResult {
  ok: boolean;
  transferredUSD: number;
  fromAddress: string;
  network: SupportedChain;
  blockNumber: number;
  error?: string;
}

function getRpc(network: SupportedChain = "avalanche"): string {
  return process.env.NEXT_PUBLIC_AVALANCHE_NETWORK === "fuji"
    ? "https://api.avax-test.network/ext/bc/C/rpc"
    : "https://api.avax.network/ext/bc/C/rpc";
}

/**
 * Verifies that a given txHash represents a USDC/USDT transfer
 * TO the platform treasury wallet on Avalanche C-Chain.
 */
export async function verifyTreasuryTransfer(
  txHash: string,
  minAmountUSD: number,
  preferredNetwork: SupportedChain = "avalanche"
): Promise<VerifyResult> {
  const treasury = (
    process.env.NEXT_PUBLIC_PLATFORM_TREASURY ||
    process.env.TREASURY_ADDRESS ||
    "0x079D9c349741C27565ee04e31E4174F640F512aE"
  ).toLowerCase();

  const cleanHash = txHash.trim().toLowerCase();
  const usedNetwork: SupportedChain = "avalanche";
  let receipt: ethers.TransactionReceipt | null = null;

  try {
    const provider = new ethers.JsonRpcProvider(getRpc("avalanche"));
    receipt = await provider.getTransactionReceipt(cleanHash);
  } catch {
    // RPC error
  }

  if (!receipt) {
    return {
      ok: false,
      transferredUSD: 0,
      fromAddress: "",
      network: usedNetwork,
      blockNumber: 0,
      error: "Transaction not found on Avalanche C-Chain. Please ensure it has confirmed on SnowTrace.",
    };
  }

  // Transaction reverted on-chain
  if (receipt.status !== 1) {
    return {
      ok: false,
      transferredUSD: 0,
      fromAddress: receipt.from ?? "",
      network: usedNetwork,
      blockNumber: receipt.blockNumber,
      error: "Transaction was reverted or failed on-chain.",
    };
  }

  // Parse ERC-20 Transfer logs to find a transfer directed to treasury
  let totalTransferredUnits = BigInt(0);
  const fromAddress = receipt.from ?? "";

  for (const log of receipt.logs) {
    // Must be a Transfer event with 3 topics (from, to indexed)
    if (
      log.topics[0]?.toLowerCase() === TRANSFER_TOPIC &&
      log.topics.length >= 3
    ) {
      const toAddress = ("0x" + log.topics[2].slice(26)).toLowerCase();
      if (toAddress === treasury) {
        // log.data holds the uint256 transfer amount
        try {
          totalTransferredUnits += BigInt(log.data);
        } catch {
          // Malformed log data — skip
        }
      }
    }
  }

  // USDC & USDT both use 6 decimals
  const transferredUSD = Number(totalTransferredUnits) / 1e6;

  if (transferredUSD <= 0) {
    return {
      ok: false,
      transferredUSD,
      fromAddress,
      network: usedNetwork,
      blockNumber: receipt.blockNumber,
      error: `No transfer to treasury wallet found in this transaction. Received $${transferredUSD.toFixed(2)}.`,
    };
  }

  // Tolerance: allow up to 1% below expected (exchange withdrawal fees)
  const tolerance = minAmountUSD * 0.99;
  if (minAmountUSD > 0 && transferredUSD < tolerance) {
    return {
      ok: false,
      transferredUSD,
      fromAddress,
      network: usedNetwork,
      blockNumber: receipt.blockNumber,
      error: `Underpaid. Sent $${transferredUSD.toFixed(2)}, required $${minAmountUSD.toFixed(2)}.`,
    };
  }

  return {
    ok: true,
    transferredUSD,
    fromAddress,
    network: usedNetwork,
    blockNumber: receipt.blockNumber,
  };
}
