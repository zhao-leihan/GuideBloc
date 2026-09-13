import { ethers } from "ethers";
import { getNetworkConfig } from "./networkConfig";

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
  const cfg = getNetworkConfig();
  return token === "USDC" ? cfg.usdcTokenAddress : cfg.usdtTokenAddress;
}

export function getEscrowAddress(network: SupportedNetwork = "avalanche"): string {
  const cfg = getNetworkConfig();
  return cfg.escrowContractAddress;
}

export type SupportedWalletType = 
  | "core"
  | "metamask" 
  | "coinbase";

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
    case "core":
      if (typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)) {
        deepLink = `intent://${hostPath}#Intent;scheme=https;package=com.avax.core;end`;
      } else {
        deepLink = `https://core.app/`;
      }
      break;
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
      if (walletType === "core") return rdns === "app.core.extension" || rdns === "app.core" || rdns.includes("core") || name.includes("core");
      if (walletType === "metamask") return rdns === "io.metamask" || rdns.includes("metamask") || name.includes("metamask");
      if (walletType === "coinbase") return rdns === "com.coinbase.wallet" || rdns.includes("coinbase") || name.includes("coinbase");
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
    if (walletType === "core") {
      rawProvider = (window as any).avalanche || (eth?.isAvalanche ? eth : null);
    } else if (walletType === "metamask") {
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
    if (walletType === "core") {
      throw new Error(
        isMobileBrowser()
          ? "Please open GuideBloc. inside Core Wallet's in-app browser on mobile, or select MetaMask."
          : "Core Wallet extension not found. Please install Core from core.app"
      );
    }
    const walletName = walletType === "metamask" 
      ? "MetaMask" 
      : "Coinbase Wallet";
    throw new Error(`${walletName} is not detected. Please install ${walletName} or use a supported wallet.`);
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

  await ensureCorrectChain(provider);

  return { address: accounts[0], provider, rawProvider };
}

/**
 * Strictly verifies and enforces the correct blockchain network.
 * Prompts user to switch or add network in MetaMask, and verifies before continuing.
 */
export async function ensureCorrectChain(provider: ethers.BrowserProvider): Promise<void> {
  const cfg = getNetworkConfig();
  const currentNetwork = await provider.getNetwork();
  const currentChainId = Number(currentNetwork.chainId);

  if (currentChainId !== cfg.chainIdDecimal) {
    try {
      await provider.send("wallet_switchEthereumChain", [{ chainId: cfg.chainIdHex }]);
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        await provider.send("wallet_addEthereumChain", [{
          chainId: cfg.chainIdHex,
          chainName: cfg.name,
          rpcUrls: [cfg.rpcUrl],
          nativeCurrency: cfg.nativeCurrency,
          blockExplorerUrls: [cfg.explorerUrl],
        }]);
      } else {
        throw new Error(
          `Please switch MetaMask to ${cfg.name} (Chain ID: ${cfg.chainIdDecimal}) before proceeding.`
        );
      }
    }

    const verifiedNetwork = await provider.getNetwork();
    if (Number(verifiedNetwork.chainId) !== cfg.chainIdDecimal) {
      throw new Error(
        `Active network is still Chain ID ${Number(verifiedNetwork.chainId)}. Please switch to ${cfg.name} (Chain ID: ${cfg.chainIdDecimal}) in MetaMask.`
      );
    }
  }
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
  const cfg = getNetworkConfig();
  const rpcUrl = cfg.rpcUrl;

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
  await ensureCorrectChain(provider);
  const signer = await provider.getSigner();
  const escrowAddress = getEscrowAddress(network);
  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
  const bookingBytes32 = ethers.encodeBytes32String(bookingId.slice(0, 31));

  let tx;
  try {
    tx = await escrow.release(bookingBytes32);
  } catch (err: any) {
    console.warn("escrow.release direct call failed, trying fallback:", err);
    try {
      tx = await escrow.releaseToGuide(bookingBytes32);
    } catch (err2: any) {
      throw new Error(err.reason || err.message || "Smart contract release transaction failed.");
    }
  }

  const receipt = await tx.wait();
  return receipt.hash;
}

export async function refundTourist(bookingId: string, network: SupportedNetwork = "avalanche"): Promise<string> {
  const { provider } = await connectWallet(network);
  await ensureCorrectChain(provider);
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

/**
 * Signs EIP-2612 Permit typed data for Circle Native USDC (0 AVAX gas fee).
 */
export async function signUsdcPermit(
  signer: ethers.Signer,
  ownerAddress: string,
  spenderAddress: string,
  amountUSD: number,
  network: SupportedNetwork = "avalanche"
): Promise<{ deadline: number; v: number; r: string; s: string }> {
  const cfg = getNetworkConfig();
  const tokenAddress = getTokenAddress("USDC", network);
  const provider = signer.provider || new ethers.JsonRpcProvider(cfg.rpcUrl);

  const usdcContract = new ethers.Contract(
    tokenAddress,
    ["function nonces(address) view returns (uint256)", "function name() view returns (string)", "function version() view returns (string)"],
    provider
  );

  let nonce = BigInt(0);
  try {
    nonce = await usdcContract.nonces(ownerAddress);
  } catch (nonceErr) {
    console.warn("Could not fetch nonces, defaulting to 0:", nonceErr);
  }

  const safeAmountStr = (Math.round(Number(amountUSD) * 100) / 100).toFixed(2);
  const value = ethers.parseUnits(safeAmountStr, 6);
  // Permit deadline: 1 hour from now
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const domain = {
    name: "USD Coin",
    version: "2",
    chainId: cfg.chainIdDecimal,
    verifyingContract: tokenAddress,
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const message = {
    owner: ownerAddress,
    spender: spenderAddress,
    value,
    nonce,
    deadline,
  };

  const signature = await signer.signTypedData(domain, types, message);
  const sig = ethers.Signature.from(signature);

  return {
    deadline,
    v: sig.v,
    r: sig.r,
    s: sig.s,
  };
}

/**
 * High-Security Gasless (Sponsored) Payment Execution
 * Tourist signs off-chain permit (0 AVAX) -> Verifying Paymaster Backend relays to Avalanche Mainnet.
 */
export async function executeGaslessSponsoredPayment({
  bookingId,
  amountUSD,
  network = "avalanche",
  walletType,
}: {
  bookingId: string;
  amountUSD: number;
  network?: SupportedNetwork;
  walletType?: SupportedWalletType;
}): Promise<{ txHash: string; explorerUrl: string }> {
  const { address, provider } = await connectWallet(network, walletType);
  await ensureCorrectChain(provider);
  const signer = await provider.getSigner();

  const cfg = getNetworkConfig();
  const spenderAddress = cfg.escrowContractAddress;

  // 1. Tourist signs EIP-2612 Permit (0 AVAX gas)
  const permit = await signUsdcPermit(signer, address, spenderAddress, amountUSD, network);

  // 2. Send to Verifying Paymaster Gate Backend
  const res = await fetch("/api/payments/gasless", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookingId,
      touristAddress: address,
      permit,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to execute sponsored payment.");
  }

  const result = await res.json();
  return {
    txHash: result.txHash,
    explorerUrl: result.explorerUrl || `${cfg.explorerUrl}/tx/${result.txHash}`,
  };
}

