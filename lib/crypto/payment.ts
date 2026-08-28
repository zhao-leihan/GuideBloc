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

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
];

const ESCROW_ABI = [
  "function deposit(bytes32 bookingId, address guide, address token, uint256 amount) external",
  "function release(bytes32 bookingId) external",
  "function refund(bytes32 bookingId) external",
  "function emergencyRescue(address token, address to, uint256 amount) external",
  "function getBooking(bytes32 bookingId) external view returns (tuple(address tourist, address guide, address token, uint256 amount, uint8 status))",
  "function createBooking(bytes32 bookingId, address guide, address token, uint256 amount) external",
  "function releaseToGuide(bytes32 bookingId) external",
  "function refundTourist(bytes32 bookingId) external",
  "function claimEarnings(bytes32 bookingId) external",
];

export type SupportedNetwork = "avalanche";

export interface PaymentParams {
  bookingId: string;
  amountUSD: number;
  token: "USDT" | "USDC";
  network?: SupportedNetwork;
  guideWalletAddress: string;
  walletType?: SupportedWalletType;
}

export function getTokenAddress(token: "USDT" | "USDC", network: SupportedNetwork = "avalanche"): string {
  const isAvaxTestnet = process.env.NEXT_PUBLIC_AVALANCHE_NETWORK === "fuji" || process.env.NEXT_PUBLIC_AVAX_NETWORK === "fuji";
  if (token === "USDC") {
    return isAvaxTestnet 
      ? (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x153a513FBF3A779A36881C635530bFA912bAf0C7") // Fuji Testnet MockUSDC
      : "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"; // Avalanche Mainnet Native USDC
  } else {
    return isAvaxTestnet
      ? (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x153a513FBF3A779A36881C635530bFA912bAf0C7") 
      : "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7"; // Avalanche Mainnet USDT
  }
}

export function getEscrowAddress(network: SupportedNetwork = "avalanche"): string {
  return process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "0xCd934aEBb3f0774a02121fc8AD0741D5073C23F2";
}

export type SupportedWalletType = 
  | "metamask" 
  | "coinbase" 
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
      if (walletType === "walletconnect") return rdns.includes("walletconnect") || name.includes("walletconnect");
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
    } else if (walletType === "walletconnect") {
      rawProvider = (window as any).walletConnectProvider || (window as any).ethereum;
    }
  }

  // Only fall back to window.ethereum if NO specific walletType was requested
  if (!rawProvider && !walletType) {
    rawProvider = (window as any).ethereum;
  }

  // If requested wallet extension is missing:
  if (!rawProvider) {
    if (walletType && isMobileBrowser()) {
      const redirected = openMobileWalletDeepLink(walletType);
      if (redirected) {
        throw new Error(`Opening ${walletType} app on mobile...`);
      }
    }
    const walletName = walletType === "metamask" 
      ? "MetaMask" 
      : walletType === "coinbase" 
        ? "Coinbase Wallet" 
        : walletType === "walletconnect"
          ? "WalletConnect"
          : "Web3 Crypto";
    throw new Error(`${walletName} extension is not detected. Please install ${walletName} or use a supported wallet.`);
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

  const isAvaxMainnet =
    process.env.NEXT_PUBLIC_AVAX_NETWORK === "mainnet" ||
    process.env.NEXT_PUBLIC_AVALANCHE_NETWORK === "mainnet";
  
  const chainIdHex = isAvaxMainnet ? "0xa86a" : "0xa869"; // 43114 vs 43113
  const chainName = isAvaxMainnet ? "Avalanche C-Chain" : "Avalanche Fuji Testnet";
  const rpcUrl = isAvaxMainnet ? "https://api.avax.network/ext/bc/C/rpc" : "https://api.avax-test.network/ext/bc/C/rpc";
  const nativeCurrency = { name: "AVAX", symbol: "AVAX", decimals: 18 };
  const blockExplorer = isAvaxMainnet ? "https://snowtrace.io" : "https://testnet.snowtrace.io";

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
  const isAvaxMainnet =
    process.env.NEXT_PUBLIC_AVAX_NETWORK === "mainnet" ||
    process.env.NEXT_PUBLIC_AVALANCHE_NETWORK === "mainnet";

  const rpcUrl = isAvaxMainnet 
    ? "https://api.avax.network/ext/bc/C/rpc" 
    : "https://api.avax-test.network/ext/bc/C/rpc";

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

  const safeAmountStr = (Math.round(Number(amountUSD) * 100) / 100).toFixed(2);
  const amount = ethers.parseUnits(safeAmountStr, 6);

  // Step 1: Approve escrow contract to spend tokens
  const approveTx = await tokenContract.approve(escrowAddress, amount);
  await approveTx.wait();

  // Step 2: Call escrow to lock funds
  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
  const bookingBytes32 = ethers.encodeBytes32String(bookingId.slice(0, 31));

  let payTx;
  try {
    // V2 pure deposit
    payTx = await escrow.deposit(bookingBytes32, guideWalletAddress, tokenAddress, amount);
  } catch (depErr: any) {
    if (depErr?.message?.includes("is not a function") || depErr?.data === "0x") {
      payTx = await escrow.createBooking(bookingBytes32, guideWalletAddress, tokenAddress, amount);
    } else {
      throw depErr;
    }
  }

  const receipt = await payTx.wait();
  return receipt.hash;
}

export async function claimGuideEarnings(bookingId: string, network: SupportedNetwork = "avalanche"): Promise<string> {
  const { provider } = await connectWallet(network);
  const signer = await provider.getSigner();
  const escrowAddress = getEscrowAddress(network);
  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
  const bookingBytes32 = ethers.encodeBytes32String(bookingId.slice(0, 31));

  let tx;
  try {
    // V2 pure atomic release
    tx = await escrow.release(bookingBytes32);
  } catch (err: any) {
    tx = await escrow.claimEarnings(bookingBytes32);
  }

  const receipt = await tx.wait();
  if (!receipt || !receipt.hash) {
    throw new Error("Claim transaction succeeded but hash is missing");
  }
  return receipt.hash;
}

export async function releaseToGuide(bookingId: string, network: SupportedNetwork = "avalanche"): Promise<string> {
  const { provider } = await connectWallet(network);
  const signer = await provider.getSigner();
  const escrowAddress = getEscrowAddress(network);
  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
  const bookingBytes32 = ethers.encodeBytes32String(bookingId.slice(0, 31));

  let tx;
  try {
    tx = await escrow.release(bookingBytes32);
  } catch (err: any) {
    tx = await escrow.releaseToGuide(bookingBytes32);
  }

  const receipt = await tx.wait();
  return receipt.hash;
}

export async function refundTourist(bookingId: string, network: SupportedNetwork = "avalanche"): Promise<string> {
  const { provider } = await connectWallet(network);
  const signer = await provider.getSigner();
  const escrowAddress = getEscrowAddress(network);
  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
  const bookingBytes32 = ethers.encodeBytes32String(bookingId.slice(0, 31));

  let tx;
  try {
    tx = await escrow.refund(bookingBytes32);
  } catch (err: any) {
    tx = await escrow.refundTourist(bookingBytes32);
  }

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
  
  const safeAmountStr = (Math.round(Number(amountUSD) * 100) / 100).toFixed(2);
  const amount = ethers.parseUnits(safeAmountStr, 6);
  const treasuryAddress = process.env.NEXT_PUBLIC_PLATFORM_TREASURY || process.env.TREASURY_ADDRESS || "0x079D9c349741C27565ee04e31E4174F640F512aE";

  const tx = await tokenContract.transfer(treasuryAddress, amount);
  const receipt = await tx.wait();
  return receipt.hash;
}
