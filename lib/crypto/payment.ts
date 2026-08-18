import { ethers } from "ethers";
import localAddresses from "../../local-addresses.json";

interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}

// Global registry of EIP-6963 announced providers (client-side only)
const announcedProviders = new Map<string, EIP6963ProviderDetail>();

if (typeof window !== "undefined") {
  window.addEventListener("eip6963:announceProvider", (event: any) => {
    const detail = event.detail as EIP6963ProviderDetail;
    if (detail && detail.info && detail.info.rdns) {
      announcedProviders.set(detail.info.rdns.toLowerCase(), detail);
    }
  });
  // Request providers immediately on load
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

const USDT_POLYGON = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // Dummy Amoy USDT
const USDC_POLYGON = localAddresses.usdc || "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; // Localhost MockUSDC
const USDC_CELO = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; 

const ESCROW_POLYGON = localAddresses.escrow || "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"; // Localhost Escrow
const ESCROW_CELO = process.env.NEXT_PUBLIC_ESCROW_ADDRESS_CELO || process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
];

const ESCROW_ABI = [
  "function createBooking(bytes32 bookingId, address guide, address token, uint256 amount) external",
  "function releaseToGuide(bytes32 bookingId) external",
  "function refundTourist(bytes32 bookingId) external",
  "function claimEarnings(bytes32 bookingId) external",
  "function getBooking(bytes32 bookingId) external view returns (tuple(address tourist, address guide, address token, uint256 amount, uint8 status))",
];

export type SupportedNetwork = "avalanche" | "base";

export interface PaymentParams {
  bookingId: string;
  amountUSD: number;
  token: "USDT" | "USDC";
  network: SupportedNetwork;
  guideWalletAddress: string;
  walletType?: "metamask" | "coinbase" | "solflare";
}

export function getTokenAddress(token: "USDT" | "USDC", network: SupportedNetwork = "avalanche"): string {
  if (network === "avalanche") {
    const isAvaxTestnet = process.env.NEXT_PUBLIC_AVALANCHE_NETWORK === "fuji" || process.env.NEXT_PUBLIC_AVAX_NETWORK === "fuji";
    if (token === "USDC") {
      return isAvaxTestnet 
        ? "0xB819bE9925EcBefe8b7eAebe51f42360673ffC86" // Fuji Testnet USDC
        : "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"; // Avalanche Mainnet Native USDC
    } else {
      return isAvaxTestnet
        ? "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" 
        : "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7"; // Avalanche Mainnet USDT
    }
  }

  // Base L2 Fallback
  const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
  const isBaseSepolia = process.env.NEXT_PUBLIC_BASE_NETWORK === "sepolia";
  
  if (!isBaseMainnet && !isBaseSepolia) {
    return localAddresses.usdc || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  }

  if (token === "USDC") {
    return isBaseMainnet 
      ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
      : "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  } else {
    return isBaseMainnet
      ? "0x50c5725949A6F0c72E6C4a641F24049A91D18C41"
      : "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  }
}

export function getEscrowAddress(network: SupportedNetwork = "avalanche"): string {
  if (network === "avalanche") {
    return process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "0x37DA6Bb53A3973Dee2ed7b766f5e341ff123E8C8";
  }
  const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
  const isBaseSepolia = process.env.NEXT_PUBLIC_BASE_NETWORK === "sepolia";
  
  if (!isBaseMainnet && !isBaseSepolia) {
    return localAddresses.escrow || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  }

  return process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "0x37DA6Bb53A3973Dee2ed7b766f5e341ff123E8C8";
}

export type SupportedWalletType = 
  | "metamask" 
  | "coinbase" 
  | "trust" 
  | "rainbow" 
  | "okx" 
  | "phantom" 
  | "zerion" 
  | "solflare"
  | "walletconnect";

export interface WalletAccountDetails {
  address: string;
  ethBalance: string;
  usdcBalance: number;
  formattedUsdc: string;
  hasEnoughBalance: boolean;
}

export function isMobileBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function openMobileWalletDeepLink(walletType: SupportedWalletType): boolean {
  if (typeof window === "undefined") return false;
  
  // If window.ethereum or in-app browser is active, stay inside dApp
  if ((window as any).ethereum && !(window as any).ethereum?.isMetaMask && !walletType) {
    return false;
  }

  const currentUrl = window.location.href;
  const hostPath = window.location.host + window.location.pathname + window.location.search;
  
  let deepLink = "";
  switch (walletType) {
    case "metamask":
      deepLink = `https://metamask.app.link/dapp/${hostPath}`;
      break;
    case "coinbase":
      deepLink = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(currentUrl)}`;
      break;
    case "trust":
      deepLink = `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(currentUrl)}`;
      break;
    case "rainbow":
      deepLink = `https://rainbow.me/dapp?url=${encodeURIComponent(currentUrl)}`;
      break;
    case "phantom":
      deepLink = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`;
      break;
    case "okx":
      deepLink = `okx://wallet/dapp/details?dappUrl=${encodeURIComponent(currentUrl)}`;
      break;
    case "zerion":
      deepLink = `https://wallet.zerion.io/dapp/${hostPath}`;
      break;
    case "solflare":
      deepLink = `https://solflare.com/ul/v1/browse/${encodeURIComponent(currentUrl)}`;
      break;
  }

  if (deepLink) {
    window.location.href = deepLink;
    return true;
  }
  return false;
}

export async function connectWallet(
  network: SupportedNetwork = "avalanche",
  walletType?: SupportedWalletType
): Promise<{ address: string; provider: ethers.BrowserProvider; rawProvider: any }> {
  if (typeof window === "undefined") {
    throw new Error("Window is not defined. Cannot connect wallet.");
  }

  let rawProvider: any = null;

  // 1. Try EIP-6963 Multi-Injected Provider Discovery (Bypasses window.ethereum hijack completely)
  if (walletType) {
    const match = (detail: EIP6963ProviderDetail) => {
      const rdns = detail.info.rdns.toLowerCase();
      const name = detail.info.name.toLowerCase();
      if (walletType === "metamask") return rdns === "io.metamask" || rdns.includes("metamask") || name.includes("metamask");
      if (walletType === "coinbase") return rdns === "com.coinbase.wallet" || rdns.includes("coinbase") || name.includes("coinbase");
      if (walletType === "trust") return rdns.includes("trust") || name.includes("trust");
      if (walletType === "rainbow") return rdns.includes("rainbow") || name.includes("rainbow");
      if (walletType === "okx") return rdns.includes("okx") || name.includes("okx");
      if (walletType === "phantom") return rdns.includes("phantom") || name.includes("phantom");
      if (walletType === "zerion") return rdns.includes("zerion") || name.includes("zerion");
      if (walletType === "solflare") return rdns.includes("solflare") || name.includes("solflare");
      return false;
    };

    announcedProviders.forEach((detail) => {
      if (match(detail)) rawProvider = detail.provider;
    });

    if (!rawProvider) {
      rawProvider = await new Promise((resolve) => {
        let resolved = false;
        const handler = (event: any) => {
          const detail = event.detail as EIP6963ProviderDetail;
          if (detail && detail.info && detail.info.rdns) {
            announcedProviders.set(detail.info.rdns.toLowerCase(), detail);
            if (match(detail) && !resolved) {
              resolved = true;
              window.removeEventListener("eip6963:announceProvider", handler);
              resolve(detail.provider);
            }
          }
        };

        window.addEventListener("eip6963:announceProvider", handler);
        window.dispatchEvent(new Event("eip6963:requestProvider"));

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            window.removeEventListener("eip6963:announceProvider", handler);
            resolve(null);
          }
        }, 250);
      });
    }
  }

  // 2. Fallback to standard provider checks if EIP-6963 didn't find the provider
  if (!rawProvider) {
    const eth = (window as any).ethereum;
    if (walletType === "metamask") {
      if (eth) {
        if (eth.providerMap) rawProvider = eth.providerMap.get("MetaMask");
        if (!rawProvider && eth.providers) rawProvider = eth.providers.find((p: any) => p.isMetaMask && !p.isCoinbaseWallet);
        if (!rawProvider && eth.isMetaMask) rawProvider = eth;
      }
    } else if (walletType === "coinbase") {
      rawProvider = (window as any).coinbaseWalletExtension;
      if (!rawProvider && eth) {
        if (eth.providerMap) rawProvider = eth.providerMap.get("CoinbaseWallet") || eth.providerMap.get("Coinbase");
        if (!rawProvider && eth.providers) rawProvider = eth.providers.find((p: any) => p.isCoinbaseWallet);
        if (!rawProvider && (eth.isCoinbaseWallet || eth.isCoinbase)) rawProvider = eth;
      }
    } else if (walletType === "trust") {
      rawProvider = (window as any).trustwallet || (window as any).trustWallet;
      if (!rawProvider && eth) {
        if (eth.providers) rawProvider = eth.providers.find((p: any) => p.isTrust || p.isTrustWallet);
        if (!rawProvider && (eth.isTrust || eth.isTrustWallet)) rawProvider = eth;
      }
    } else if (walletType === "rainbow") {
      if (eth) {
        if (eth.providers) rawProvider = eth.providers.find((p: any) => p.isRainbow);
        if (!rawProvider && eth.isRainbow) rawProvider = eth;
      }
    } else if (walletType === "okx") {
      rawProvider = (window as any).okxwallet;
      if (!rawProvider && eth) {
        if (eth.providers) rawProvider = eth.providers.find((p: any) => p.isOkxWallet || p.isOKExWallet);
        if (!rawProvider && (eth.isOkxWallet || eth.isOKExWallet)) rawProvider = eth;
      }
    } else if (walletType === "phantom") {
      rawProvider = (window as any).phantom?.ethereum;
      if (!rawProvider && eth) {
        if (eth.providers) rawProvider = eth.providers.find((p: any) => p.isPhantom);
        if (!rawProvider && eth.isPhantom) rawProvider = eth;
      }
    } else if (walletType === "zerion") {
      rawProvider = (window as any).zerionWallet || (window as any).zerion;
      if (!rawProvider && eth) {
        if (eth.providers) rawProvider = eth.providers.find((p: any) => p.isZerion);
        if (!rawProvider && eth.isZerion) rawProvider = eth;
      }
    } else if (walletType === "solflare") {
      rawProvider = (window as any).solflare?.ethereum || (window as any).solflare;
      if (!rawProvider && eth) {
        if (eth.providers) rawProvider = eth.providers.find((p: any) => p.isSolflare);
        if (!rawProvider && eth.isSolflare) rawProvider = eth;
      }
    }
  }

  if (!rawProvider) {
    rawProvider = (window as any).ethereum;
  }

  // If wallet extension is missing and user is on mobile browser, launch deep link!
  if (!rawProvider) {
    if (walletType && isMobileBrowser()) {
      const redirected = openMobileWalletDeepLink(walletType);
      if (redirected) {
        throw new Error(`Opening ${walletType} app on mobile...`);
      }
    }
    const walletName = walletType
      ? walletType.charAt(0).toUpperCase() + walletType.slice(1)
      : "Crypto";
    throw new Error(`${walletName} wallet is not installed. If you are on mobile, please open this site inside the wallet's built-in browser.`);
  }

  // Explicitly request permissions to show account selection dialog
  try {
    if (typeof rawProvider.request === "function") {
      await rawProvider.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
    }
  } catch (permError) {
    console.log("wallet_requestPermissions skipped or dismissed:", permError);
  }

  const provider = new ethers.BrowserProvider(rawProvider);
  const accounts = await provider.send("eth_requestAccounts", []);

  if (!accounts || accounts.length === 0) {
    throw new Error("No connected Web3 accounts found.");
  }

  const isAvax = network === "avalanche";
  const isAvaxMainnet = process.env.NEXT_PUBLIC_AVAX_NETWORK === "mainnet";
  const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
  const isBaseSepolia = process.env.NEXT_PUBLIC_BASE_NETWORK === "sepolia";
  
  const chainIdHex = isAvax
    ? (isAvaxMainnet ? "0xa86a" : "0xa869") // 43114 vs 43113
    : (isBaseMainnet ? "0x2105" : (isBaseSepolia ? "0x14a34" : "0x7a69")); 
      
  const chainName = isAvax
    ? (isAvaxMainnet ? "Avalanche C-Chain" : "Avalanche Fuji Testnet")
    : (isBaseMainnet ? "Base Mainnet" : (isBaseSepolia ? "Base Sepolia Testnet" : "Base Localhost"));
      
  const rpcUrl = isAvax
    ? (isAvaxMainnet ? "https://api.avax.network/ext/bc/C/rpc" : "https://api.avax-test.network/ext/bc/C/rpc")
    : (isBaseMainnet ? "https://mainnet.base.org" : (isBaseSepolia ? "https://sepolia.base.org" : "http://127.0.0.1:8545"));
      
  const nativeCurrency = isAvax
    ? { name: "AVAX", symbol: "AVAX", decimals: 18 }
    : { name: "ETH", symbol: "ETH", decimals: 18 };
    
  const blockExplorer = isAvax
    ? (isAvaxMainnet ? "https://snowtrace.io" : "https://testnet.snowtrace.io")
    : (isBaseMainnet ? "https://basescan.org" : "https://sepolia.basescan.org");

  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: chainIdHex }]);
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await provider.send("wallet_addEthereumChain", [{
        chainId: chainIdHex,
        chainName,
        rpcUrls: [rpcUrl],
        nativeCurrency,
        blockExplorerUrls: [blockExplorer],
      }]);
    }
  }

  return { address: accounts[0], provider, rawProvider };
}

export async function fetchConnectedAccountsDetails(
  network: SupportedNetwork = "avalanche",
  targetAmountUSD: number = 0,
  walletType?: SupportedWalletType,
  selectedToken: "USDT" | "USDC" = "USDC"
): Promise<{ accounts: WalletAccountDetails[]; selectedAddress: string; provider: ethers.BrowserProvider }> {
  const { address, provider, rawProvider } = await connectWallet(network, walletType);

  let accountAddresses: string[] = [address];
  try {
    if (typeof rawProvider.request === "function") {
      const allAccs = await rawProvider.request({ method: "eth_accounts" });
      if (Array.isArray(allAccs) && allAccs.length > 0) {
        accountAddresses = Array.from(new Set(allAccs));
      }
    }
  } catch (err) {
    console.warn("eth_accounts fetch failed, using primary account:", err);
  }

  const tokenAddress = getTokenAddress(selectedToken, network);
  const usdcContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  const accountDetailsList: WalletAccountDetails[] = await Promise.all(
    accountAddresses.map(async (acc) => {
      let ethBalStr = "0.00";
      let usdcNum = 0;
      let formattedUsdc = "0.00";

      try {
        const ethBal = await provider.getBalance(acc);
        ethBalStr = parseFloat(ethers.formatEther(ethBal)).toFixed(4);
      } catch (e) {
        console.warn(`Failed to fetch ETH balance for ${acc}`, e);
      }

      try {
        const usdcBal = await usdcContract.balanceOf(acc);
        usdcNum = parseFloat(ethers.formatUnits(usdcBal, 6));
        formattedUsdc = usdcNum.toFixed(2);
      } catch (e) {
        console.warn(`Failed to fetch USDC balance for ${acc}`, e);
      }

      return {
        address: acc,
        ethBalance: ethBalStr,
        usdcBalance: usdcNum,
        formattedUsdc,
        hasEnoughBalance: usdcNum >= targetAmountUSD,
      };
    })
  );

  return {
    accounts: accountDetailsList,
    selectedAddress: address,
    provider,
  };
}

export async function getTokenBalance(token: "USDT" | "USDC", address: string, network: SupportedNetwork = "avalanche"): Promise<string> {
  let rpcUrl = "https://api.avax.network/ext/bc/C/rpc"; // fallback Avalanche C-Chain
  const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
  const isBaseSepolia = process.env.NEXT_PUBLIC_BASE_NETWORK === "sepolia";
  const isAvaxMainnet = process.env.NEXT_PUBLIC_AVAX_NETWORK === "mainnet";

  if (network === "avalanche") {
    rpcUrl = isAvaxMainnet 
      ? "https://api.avax.network/ext/bc/C/rpc" 
      : "https://api.avax-test.network/ext/bc/C/rpc";
  } else if (network === "base") {
    rpcUrl = isBaseMainnet 
      ? "https://mainnet.base.org" 
      : (isBaseSepolia ? "https://sepolia.base.org" : "http://127.0.0.1:8545");
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const tokenAddress = getTokenAddress(token, network);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, 6);
  } catch (rpcErr) {
    console.warn("Public RPC failed, falling back to BrowserProvider:", rpcErr);
    try {
      if (typeof window !== "undefined") {
        const eth = (window as any).ethereum;
        if (eth) {
          const browserProvider = new ethers.BrowserProvider(eth);
          const tokenAddress = getTokenAddress(token, network);
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, browserProvider);
          const balance = await contract.balanceOf(address);
          return ethers.formatUnits(balance, 6);
        }
      }
    } catch (fallbackErr) {
      console.error("Browser fallback balance check failed:", fallbackErr);
    }
    return "0.00";
  }
}

export async function initiatePayment({
  bookingId,
  amountUSD,
  token,
  network,
  guideWalletAddress,
  walletType,
}: PaymentParams): Promise<string> {
  const { provider } = await connectWallet(network, walletType);
  const signer = await provider.getSigner();

  const tokenAddress = getTokenAddress(token, network);
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const escrowAddress = getEscrowAddress(network);

  const amount = ethers.parseUnits(amountUSD.toFixed(6), 6);

  // Step 1: Approve escrow contract to spend tokens
  const approveTx = await tokenContract.approve(escrowAddress, amount);
  await approveTx.wait();

  // Step 2: Call escrow to lock funds
  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
  const payTx = await escrow.createBooking(
    ethers.encodeBytes32String(bookingId),
    guideWalletAddress,
    tokenAddress,
    amount
  );

  const receipt = await payTx.wait();
  return receipt.hash;
}

export async function releaseToGuide(bookingId: string, network: SupportedNetwork = "avalanche"): Promise<string> {
  const { provider } = await connectWallet(network);
  const signer = await provider.getSigner();
  const escrowAddress = getEscrowAddress(network);
  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);

  const tx = await escrow.releaseToGuide(ethers.encodeBytes32String(bookingId));
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function refundTourist(bookingId: string, network: SupportedNetwork = "avalanche"): Promise<string> {
  const { provider } = await connectWallet(network);
  const signer = await provider.getSigner();
  const escrowAddress = getEscrowAddress(network);
  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);

  const tx = await escrow.refundTourist(ethers.encodeBytes32String(bookingId));
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function payBoostFee(
  amountUSD: number,
  token: "USDT" | "USDC" = "USDC",
  network: SupportedNetwork = "avalanche"
): Promise<string> {
  const { provider } = await connectWallet(network);
  const signer = await provider.getSigner();

  const tokenAddress = getTokenAddress(token, network);
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  
  const amount = ethers.parseUnits(amountUSD.toFixed(6), 6);
  // Hardcoded treasury address (Account 0 from Hardhat)
  const treasuryAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const tx = await tokenContract.transfer(treasuryAddress, amount);
  const receipt = await tx.wait();
  return receipt.hash;
}
