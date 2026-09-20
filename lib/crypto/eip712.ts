import { ethers } from "ethers";
import { getNetworkConfig } from "./networkConfig";

/**
 * EIP-712 domain for GuideBloc booking agreements.
 * Uses Avalanche C-Chain (chainId 43114) and the escrow contract address.
 */
export function getEIP712Domain() {
  const cfg = getNetworkConfig();
  return {
    name: "GuideBloc",
    version: "1",
    chainId: 43114, // Avalanche C-Chain mainnet
    verifyingContract: cfg.escrowContractAddress as `0x${string}`,
  };
}

/**
 * EIP-712 typed data types for a BookingAgreement.
 */
export const BOOKING_AGREEMENT_TYPES = {
  BookingAgreement: [
    { name: "bookingId", type: "string" },
    { name: "gigTitle", type: "string" },
    { name: "totalPriceUSD", type: "uint256" },
    { name: "bookingDate", type: "string" },
    { name: "touristAddress", type: "address" },
    { name: "nonce", type: "uint256" },
  ],
};

export interface BookingAgreementData {
  bookingId: string;
  gigTitle: string;
  totalPriceUSD: number;
  bookingDate: string; // ISO string
  touristAddress: string;
  nonce: number;
}

/**
 * Build the full EIP-712 typed data object ready for eth_signTypedData_v4.
 * totalPriceUSD is converted to cents (integer) to avoid float representation issues.
 */
export function buildBookingAgreementTypedData(data: BookingAgreementData) {
  const domain = getEIP712Domain();

  const message = {
    bookingId: data.bookingId,
    gigTitle: data.gigTitle,
    totalPriceUSD: Math.round(data.totalPriceUSD * 100), // cents, avoids float
    bookingDate: data.bookingDate,
    touristAddress: data.touristAddress.toLowerCase(),
    nonce: data.nonce,
  };

  return {
    domain,
    types: BOOKING_AGREEMENT_TYPES,
    primaryType: "BookingAgreement" as const,
    message,
  };
}

/**
 * Recover the signer address from an EIP-712 BookingAgreement signature.
 * Returns the recovered address (lowercase), or null on failure.
 */
export async function verifyBookingSignature(
  typedData: ReturnType<typeof buildBookingAgreementTypedData>,
  signature: string
): Promise<string | null> {
  try {
    const recovered = ethers.verifyTypedData(
      typedData.domain,
      typedData.types,
      typedData.message,
      signature
    );
    return recovered.toLowerCase();
  } catch (err) {
    console.error("[EIP-712 Verify] Failed to verify signature:", err);
    return null;
  }
}
