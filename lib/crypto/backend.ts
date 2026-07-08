import { ethers } from "ethers";
import { getEscrowAddress } from "./payment";

const ESCROW_ABI = [
  "function releaseToGuide(bytes32 bookingId) external",
  "function refundTourist(bytes32 bookingId) external",
  "function confirmBooking(bytes32 bookingId) external",
];

export async function backendReleaseToGuide(
  bookingId: string,
  network: "celo" | "polygon" | "base" = "base"
): Promise<string> {
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
    throw new Error("DEPLOYER_PRIVATE_KEY is not configured in .env");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const escrowAddress = getEscrowAddress(network);

  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, wallet);
  const bookingIdBytes32 = ethers.encodeBytes32String(bookingId);

  console.log(`[Backend Release] Releasing booking ${bookingId} on ${network} escrow: ${escrowAddress}`);
  const tx = await escrow.releaseToGuide(bookingIdBytes32);
  const receipt = await tx.wait();
  
  if (!receipt || !receipt.hash) {
    throw new Error("Failed to retrieve transaction receipt hash");
  }
  
  console.log(`[Backend Release] Successfully released. Hash: ${receipt.hash}`);
  return receipt.hash;
}

export async function backendRefundTourist(
  bookingId: string,
  network: "celo" | "polygon" | "base" = "base"
): Promise<string> {
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
    throw new Error("DEPLOYER_PRIVATE_KEY is not configured in .env");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const escrowAddress = getEscrowAddress(network);

  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, wallet);
  const bookingIdBytes32 = ethers.encodeBytes32String(bookingId);

  console.log(`[Backend Refund] Refunding booking ${bookingId} on ${network} escrow: ${escrowAddress}`);
  const tx = await escrow.refundTourist(bookingIdBytes32);
  const receipt = await tx.wait();
  
  if (!receipt || !receipt.hash) {
    throw new Error("Failed to retrieve transaction receipt hash");
  }
  
  console.log(`[Backend Refund] Successfully refunded. Hash: ${receipt.hash}`);
  return receipt.hash;
}

export async function backendConfirmBooking(
  bookingId: string,
  network: "celo" | "polygon" | "base" = "base"
): Promise<string> {
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
    throw new Error("DEPLOYER_PRIVATE_KEY is not configured in .env");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const escrowAddress = getEscrowAddress(network);

  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, wallet);
  const bookingIdBytes32 = ethers.encodeBytes32String(bookingId);

  console.log(`[Backend Confirm] Confirming booking ${bookingId} on ${network} escrow: ${escrowAddress}`);
  const tx = await escrow.confirmBooking(bookingIdBytes32);
  const receipt = await tx.wait();
  
  if (!receipt || !receipt.hash) {
    throw new Error("Failed to retrieve transaction receipt hash");
  }
  
  console.log(`[Backend Confirm] Successfully confirmed. Hash: ${receipt.hash}`);
  return receipt.hash;
}
