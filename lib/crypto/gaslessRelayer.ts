import { ethers } from "ethers";
import { getNetworkConfig } from "./networkConfig";

// Whitelisted method signatures to prevent unauthorized contract calls
export const WHITELISTED_METHODS = [
  "deposit(bytes32,address,address,uint256)",
  "release(bytes32)",
  "permit(address,address,uint256,uint256,uint8,bytes32,bytes32)",
] as const;

const ERC20_PERMIT_ABI = [
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

const ESCROW_ABI = [
  "function deposit(bytes32 bookingId, address guide, address token, uint256 amount) external",
  "function release(bytes32 bookingId) external",
  "function getBooking(bytes32 bookingId) external view returns (tuple(address tourist, address guide, address token, uint256 amount, uint8 status))",
];

/**
 * Gets a secure backend signer for gas sponsorship.
 * Uses RELAYER_PRIVATE_KEY from environment or secure deployer key.
 */
function getRelayerSigner(): { signer: ethers.Wallet; provider: ethers.JsonRpcProvider } {
  const cfg = getNetworkConfig();
  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);

  const relayerKey =
    process.env.RELAYER_PRIVATE_KEY ||
    process.env.DEPLOYER_PRIVATE_KEY;

  if (!relayerKey) {
    throw new Error("Relayer private key is not configured in environment (RELAYER_PRIVATE_KEY).");
  }

  const signer = new ethers.Wallet(relayerKey, provider);
  return { signer, provider };
}

/**
 * Validates that target contract matches our whitelisted active escrow or token address.
 */
function validateTargetContract(targetAddress: string): void {
  const cfg = getNetworkConfig();
  const normalizedTarget = targetAddress.toLowerCase();
  const allowed = [
    cfg.escrowContractAddress.toLowerCase(),
    cfg.usdcTokenAddress.toLowerCase(),
    cfg.usdtTokenAddress.toLowerCase(),
  ];

  if (!allowed.includes(normalizedTarget)) {
    throw new Error(`Security Violation: Target contract ${targetAddress} is not whitelisted.`);
  }
}

export interface GaslessDepositParams {
  bookingId: string;
  touristAddress: string;
  guideAddress: string;
  tokenAddress: string;
  amountUSD: number;
  permit?: {
    deadline: number;
    v: number;
    r: string;
    s: string;
  };
}

/**
 * Executes a sponsored (gasless) deposit for a verified tourist booking.
 * 1. Executes USDC permit (if permit signature is provided).
 * 2. Executes Escrow deposit on Avalanche Mainnet.
 */
export async function executeGaslessDeposit({
  bookingId,
  touristAddress,
  guideAddress,
  tokenAddress,
  amountUSD,
  permit,
}: GaslessDepositParams): Promise<{ txHash: string }> {
  const cfg = getNetworkConfig();
  const { signer, provider } = getRelayerSigner();

  // 1. Strict Contract Whitelist Check
  validateTargetContract(cfg.escrowContractAddress);
  validateTargetContract(tokenAddress);

  const safeAmountStr = (Math.round(amountUSD * 100) / 100).toFixed(2);
  const amount = ethers.parseUnits(safeAmountStr, 6);
  const bookingBytes32 = ethers.encodeBytes32String(bookingId.slice(0, 31));

  // 2. If EIP-2612 Permit is provided, execute permit first
  if (permit) {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_PERMIT_ABI, signer);
    try {
      // Check current allowance first to avoid redundant permit tx
      const currentAllowance = await tokenContract.allowance(touristAddress, cfg.escrowContractAddress);
      if (currentAllowance < amount) {
        const permitTx = await tokenContract.permit(
          touristAddress,
          cfg.escrowContractAddress,
          amount,
          permit.deadline,
          permit.v,
          permit.r,
          permit.s
        );
        await permitTx.wait();
      }
    } catch (permitErr: any) {
      console.warn("Permit execution warning:", permitErr.message);
      // If permit already executed or failed, check allowance before throwing
      const allowance = await tokenContract.allowance(touristAddress, cfg.escrowContractAddress);
      if (allowance < amount) {
        throw new Error(`Permit failed: ${permitErr.reason || permitErr.message || "Invalid permit signature"}`);
      }
    }
  }

  // 3. Execute Escrow Deposit
  const escrowContract = new ethers.Contract(cfg.escrowContractAddress, ESCROW_ABI, signer);
  const depositTx = await escrowContract.deposit(bookingBytes32, guideAddress, tokenAddress, amount);
  const receipt = await depositTx.wait();

  if (!receipt || !receipt.hash) {
    throw new Error("Deposit transaction succeeded but receipt hash was missing.");
  }

  return { txHash: receipt.hash };
}

/**
 * Executes a sponsored (gasless) escrow release to the guide upon verified tour completion.
 */
export async function executeGaslessRelease(bookingId: string): Promise<{ txHash: string }> {
  const cfg = getNetworkConfig();
  const { signer } = getRelayerSigner();

  // Strict Contract Whitelist Check
  validateTargetContract(cfg.escrowContractAddress);

  const bookingBytes32 = ethers.encodeBytes32String(bookingId.slice(0, 31));
  const escrowContract = new ethers.Contract(cfg.escrowContractAddress, ESCROW_ABI, signer);

  const releaseTx = await escrowContract.release(bookingBytes32);
  const receipt = await releaseTx.wait();

  if (!receipt || !receipt.hash) {
    throw new Error("Release transaction succeeded but receipt hash was missing.");
  }

  return { txHash: receipt.hash };
}
