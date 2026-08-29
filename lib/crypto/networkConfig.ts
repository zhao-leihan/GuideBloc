/**
 * ============================================================================
 * EXPLOMATE BLOCKCHAIN NETWORK SWITCH CONFIGURATION
 * ============================================================================
 * To switch the ENTIRE platform between Testnet (Fuji) and Mainnet:
 * Simply change ACTIVE_NETWORK below to "fuji" or "mainnet".
 * ============================================================================
 */

// >>> TOGGLE HERE TO SWITCH PLATFORM NETWORK: "fuji" | "mainnet" <<<
export const ACTIVE_NETWORK: "fuji" | "mainnet" = "fuji";

export const NETWORKS = {
  // ==========================================================================
  // AVALANCHE FUJI TESTNET CONFIGURATION (ACTIVE FOR TESTING)
  // ==========================================================================
  fuji: {
    networkKey: "fuji",
    name: "Avalanche Fuji Testnet",
    shortName: "Fuji Testnet",
    badgeLabel: "Avalanche Fuji Testnet",
    chainIdDecimal: 43113,
    chainIdHex: "0xa869",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    explorerUrl: "https://testnet.snowtrace.io",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
    
    // Fuji Smart Contract Addresses
    escrowContractAddress: "0xCd934aEBb3f0774a02121fc8AD0741D5073C23F2",
    usdcTokenAddress: "0xfdCB2cd113201C61E44D937B2ee0E1541B61f0fC",
    usdtTokenAddress: "0xfdCB2cd113201C61E44D937B2ee0E1541B61f0fC",
    treasuryAddress: "0x079D9c349741C27565ee04e31E4174F640F512aE",
  },

  // ==========================================================================
  // AVALANCHE C-CHAIN MAINNET CONFIGURATION (PRE-CONFIGURED FOR PRODUCTION)
  // ==========================================================================
  mainnet: {
    networkKey: "mainnet",
    name: "Avalanche C-Chain",
    shortName: "Mainnet",
    badgeLabel: "Avalanche C-Chain (Mainnet)",
    chainIdDecimal: 43114,
    chainIdHex: "0xa86a",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    explorerUrl: "https://snowtrace.io",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
    
    // Mainnet Smart Contract & Token Addresses
    escrowContractAddress: "0xCd934aEBb3f0774a02121fc8AD0741D5073C23F2", // Mainnet Escrow
    usdcTokenAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // Official Circle Native USDC (Avalanche)
    usdtTokenAddress: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", // Official Tether USDT (Avalanche)
    treasuryAddress: "0x079D9c349741C27565ee04e31E4174F640F512aE",
  },
} as const;

export function getNetworkConfig() {
  const envNet = process.env.NEXT_PUBLIC_AVAX_NETWORK || process.env.NEXT_PUBLIC_AVALANCHE_NETWORK;
  if (envNet === "mainnet" || envNet === "fuji") {
    return NETWORKS[envNet];
  }
  return NETWORKS[ACTIVE_NETWORK];
}
