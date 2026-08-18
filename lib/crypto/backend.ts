import { ethers } from "ethers";
import { getEscrowAddress, SupportedNetwork } from "./payment";
import { prisma } from "@/lib/prisma";

const ESCROW_ABI = [
  "function releaseToGuide(bytes32 bookingId) external",
  "function refundTourist(bytes32 bookingId) external",
  "function confirmBooking(bytes32 bookingId) external",
];

/**
 * Returns the correct RPC URL for a given network based on environment variables.
 * Single source of truth — no more duplicated logic across functions.
 */
function getRpcUrl(network: SupportedNetwork): string {
  const isAvaxMainnet =
    process.env.NEXT_PUBLIC_AVAX_NETWORK === "mainnet" ||
    process.env.NEXT_PUBLIC_AVALANCHE_NETWORK === "mainnet";
  const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
  const isBaseSepolia = process.env.NEXT_PUBLIC_BASE_NETWORK === "sepolia";

  if (network === "avalanche") {
    return isAvaxMainnet
      ? "https://api.avax.network/ext/bc/C/rpc"
      : "https://api.avax-test.network/ext/bc/C/rpc";
  }

  if (network === "base") {
    if (isBaseMainnet) return "https://mainnet.base.org";
    if (isBaseSepolia) return "https://sepolia.base.org";
    // Only fall back to localhost for explicit local dev
    return "http://127.0.0.1:8545";
  }

  // Safe default — should never reach here in production
  return "https://api.avax.network/ext/bc/C/rpc";
}

/**
 * Returns the deployer private key.
 * Uses hardhat default ONLY when on localhost — never on mainnet/testnet.
 */
function getPrivateKey(rpcUrl: string): string {
  if (rpcUrl === "http://127.0.0.1:8545") {
    // Hardhat default account #0 — safe only for local dev
    return "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  }
  const key = process.env.DEPLOYER_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      "[Escrow] DEPLOYER_PRIVATE_KEY is not configured in .env. Cannot sign transactions."
    );
  }
  return key;
}

/**
 * Writes a PaymentAuditLog entry to the database.
 * Non-blocking — failures here should never prevent the main operation from completing.
 */
async function writeAuditLog(
  bookingId: string | null,
  txHash: string | null,
  source: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  try {
    await prisma.paymentAuditLog.create({
      data: {
        bookingId,
        txHash,
        source,
        status,
        errorMessage: errorMessage || null,
      },
    });
  } catch (auditErr) {
    // Audit logging must never block or throw — just warn
    console.warn("[AuditLog] Failed to write audit log entry:", auditErr);
  }
}

/**
 * Retries an async operation up to `maxAttempts` times with exponential backoff.
 * Only retries on transient network errors — does NOT retry on reverts or auth failures.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 3
): Promise<T> {
  let lastError: Error = new Error("Unknown error");
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.code === "NETWORK_ERROR" ||
        err?.code === "ETIMEDOUT" ||
        err?.code === "ECONNRESET" ||
        err?.message?.includes("timeout") ||
        err?.message?.includes("network");

      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }

      const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      console.warn(
        `[${label}] Attempt ${attempt} failed (transient). Retrying in ${delay}ms...`,
        err.message
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function backendReleaseToGuide(
  bookingId: string,
  network: SupportedNetwork = "avalanche"
): Promise<string> {
  const rpcUrl = getRpcUrl(network);
  const privateKey = getPrivateKey(rpcUrl);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const escrowAddress = getEscrowAddress(network);

  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, wallet);
  const bookingIdBytes32 = ethers.encodeBytes32String(bookingId);

  console.log(
    `[Backend Release] Releasing booking ${bookingId} on ${network} escrow: ${escrowAddress}`
  );

  try {
    const hash = await withRetry(async () => {
      const tx = await escrow.releaseToGuide(bookingIdBytes32);
      const receipt = await tx.wait();
      if (!receipt || !receipt.hash) {
        throw new Error("Transaction mined but receipt hash is missing");
      }
      return receipt.hash as string;
    }, "backendReleaseToGuide");

    console.log(`[Backend Release] Successfully released. Hash: ${hash}`);
    await writeAuditLog(bookingId, hash, "BACKEND_RELEASE", "SUCCESS");
    return hash;
  } catch (err: any) {
    console.error(`[Backend Release] FAILED for booking ${bookingId}:`, err.message);
    await writeAuditLog(bookingId, null, "BACKEND_RELEASE", "FAILED", err.message);
    throw err; // Re-throw so caller can handle and NOT mark booking as released
  }
}

export async function backendRefundTourist(
  bookingId: string,
  network: SupportedNetwork = "avalanche"
): Promise<string> {
  const rpcUrl = getRpcUrl(network);
  const privateKey = getPrivateKey(rpcUrl);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const escrowAddress = getEscrowAddress(network);

  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, wallet);
  const bookingIdBytes32 = ethers.encodeBytes32String(bookingId);

  console.log(
    `[Backend Refund] Refunding booking ${bookingId} on ${network} escrow: ${escrowAddress}`
  );

  try {
    const hash = await withRetry(async () => {
      const tx = await escrow.refundTourist(bookingIdBytes32);
      const receipt = await tx.wait();
      if (!receipt || !receipt.hash) {
        throw new Error("Transaction mined but receipt hash is missing");
      }
      return receipt.hash as string;
    }, "backendRefundTourist");

    console.log(`[Backend Refund] Successfully refunded. Hash: ${hash}`);
    await writeAuditLog(bookingId, hash, "BACKEND_REFUND", "SUCCESS");
    return hash;
  } catch (err: any) {
    console.error(`[Backend Refund] FAILED for booking ${bookingId}:`, err.message);
    await writeAuditLog(bookingId, null, "BACKEND_REFUND", "FAILED", err.message);
    throw err;
  }
}

export async function backendConfirmBooking(
  bookingId: string,
  network: SupportedNetwork = "avalanche"
): Promise<string> {
  const rpcUrl = getRpcUrl(network);
  const privateKey = getPrivateKey(rpcUrl);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const escrowAddress = getEscrowAddress(network);

  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, wallet);
  const bookingIdBytes32 = ethers.encodeBytes32String(bookingId);

  console.log(
    `[Backend Confirm] Confirming booking ${bookingId} on ${network} escrow: ${escrowAddress}`
  );

  try {
    const hash = await withRetry(async () => {
      const tx = await escrow.confirmBooking(bookingIdBytes32);
      const receipt = await tx.wait();
      if (!receipt || !receipt.hash) {
        throw new Error("Transaction mined but receipt hash is missing");
      }
      return receipt.hash as string;
    }, "backendConfirmBooking");

    console.log(`[Backend Confirm] Successfully confirmed. Hash: ${hash}`);
    await writeAuditLog(bookingId, hash, "BACKEND_CONFIRM", "SUCCESS");
    return hash;
  } catch (err: any) {
    console.error(`[Backend Confirm] FAILED for booking ${bookingId}:`, err.message);
    await writeAuditLog(bookingId, null, "BACKEND_CONFIRM", "FAILED", err.message);
    throw err;
  }
}

/**
 * Creates a booking on-chain by funding the escrow contract from the custodian hot wallet.
 *
 * IMPORTANT: This function will THROW on failure — no silent mock fallback.
 * The caller (e.g. Midtrans webhook) MUST handle the error and NOT mark the booking
 * as CONFIRMED if this throws.
 */
export async function backendCreateBooking(
  bookingId: string,
  amountUSD: number,
  guideWalletAddress: string,
  token: "USDC" | "USDT" = "USDC",
  network: SupportedNetwork = "avalanche"
): Promise<string> {
  const rpcUrl = getRpcUrl(network);
  const privateKey = getPrivateKey(rpcUrl);

  const { getTokenAddress } = await import("./payment");
  const tokenAddress = getTokenAddress(token, network);
  const escrowAddress = getEscrowAddress(network);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
  ];
  const ESCROW_ABI_FULL = [
    "function createBooking(bytes32 bookingId, address guide, address token, uint256 amount) external",
  ];

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI_FULL, wallet);
  const amount = ethers.parseUnits(amountUSD.toFixed(6), 6);

  console.log(
    `[Backend CreateBooking] Funding escrow for booking ${bookingId}: ${amountUSD} ${token} on ${network}`
  );

  try {
    const hash = await withRetry(async () => {
      // Step 1: Approve escrow to spend tokens from custodian wallet
      console.log(
        `[Backend CreateBooking] Approving escrow ${escrowAddress} to spend ${amountUSD} ${token}`
      );
      const approveTx = await tokenContract.approve(escrowAddress, amount);
      await approveTx.wait();

      // Step 2: Lock funds in escrow
      const bookingIdBytes32 = ethers.encodeBytes32String(bookingId);
      console.log(
        `[Backend CreateBooking] Creating on-chain booking ${bookingId}`
      );
      const tx = await escrow.createBooking(
        bookingIdBytes32,
        guideWalletAddress,
        tokenAddress,
        amount
      );
      const receipt = await tx.wait();

      if (!receipt || !receipt.hash) {
        throw new Error("Transaction mined but receipt hash is missing");
      }
      return receipt.hash as string;
    }, "backendCreateBooking");

    console.log(`[Backend CreateBooking] Successfully funded. Hash: ${hash}`);
    await writeAuditLog(bookingId, hash, "BACKEND_CREATE_BOOKING", "SUCCESS");
    return hash;
  } catch (err: any) {
    // ⚠️ CRITICAL: Do NOT fall back to mock hash.
    // Log the failure and re-throw so the caller can take corrective action.
    console.error(
      `[Backend CreateBooking] FAILED for booking ${bookingId}:`,
      err.message
    );
    await writeAuditLog(
      bookingId,
      null,
      "BACKEND_CREATE_BOOKING",
      "FAILED",
      err.message
    );
    throw new Error(
      `On-chain escrow funding failed for booking ${bookingId}: ${err.message}`
    );
  }
}
