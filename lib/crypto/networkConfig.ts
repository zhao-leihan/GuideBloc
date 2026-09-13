/**
 * ============================================================================
 * GUIDEBLOC. BLOCKCHAIN NETWORK SWITCH CONFIGURATION
 * ============================================================================
 * To switch the ENTIRE platform between Testnet (Fuji) and Mainnet:
 * Simply change ACTIVE_NETWORK below to "fuji" or "mainnet".
 * ============================================================================
 */

// >>> TOGGLE HERE TO SWITCH PLATFORM NETWORK: "fuji" | "mainnet" <<<
export const ACTIVE_NETWORK: "fuji" | "mainnet" = "mainnet";

export const NETWORKS = {
  // ==========================================================================
  // [TAG: FUJI TESTNET CONFIGURATION - CHAIN ID 43113]
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
    usdcTokenAddress: "0x2874C7e0C9B27029455f2a46D2332acE7C749DA9",
    usdtTokenAddress: "0x2874C7e0C9B27029455f2a46D2332acE7C749DA9",
    treasuryAddress: "0x079D9c349741C27565ee04e31E4174F640F512aE",
  },

  // ==========================================================================
  // [TAG: AVALANCHE MAINNET CONFIGURATION - CHAIN ID 43114]
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
    escrowContractAddress: "0x2D4eC9380218C252F9468078b35F90B559331d19", // Mainnet Escrow V2
    usdcTokenAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // Official Circle Native USDC (Avalanche)
    usdtTokenAddress: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", // Official Tether USDT (Avalanche)
    treasuryAddress: "0x079D9c349741C27565ee04e31E4174F640F512aE",
  },
} as const;

export function getNetworkConfig() {
  // ACTIVE_NETWORK is the absolute single source of truth
  return NETWORKS[ACTIVE_NETWORK];
}

/**
 * Dynamically constructs explorer URL for transactions based on active network
 */
export function getExplorerTxLink(txHash: string): string {
  if (!txHash) return "#";
  const cfg = getNetworkConfig();
  return `${cfg.explorerUrl}/tx/${txHash}`;
}

/**
 * Dynamically constructs explorer URL for wallet addresses based on active network
 */
export function getExplorerAddressLink(address: string): string {
  if (!address) return "#";
  const cfg = getNetworkConfig();
  return `${cfg.explorerUrl}/address/${address}`;
}

/**
 * 1-Click helper to import our active USDC token into MetaMask
 */
export async function importUsdcToMetaMask(): Promise<boolean> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not installed.");
  }
  const cfg = getNetworkConfig();
  try {
    const wasAdded = await (window as any).ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: cfg.usdcTokenAddress,
          symbol: "USDC",
          decimals: 6,
          image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
        },
      },
    });
    return !!wasAdded;
  } catch (error: any) {
    console.error("Failed to import token to MetaMask:", error);
    throw error;
  }
}
