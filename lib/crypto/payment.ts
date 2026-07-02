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

export interface PaymentParams {
  bookingId: string;
  amountUSD: number;
  token: "USDT" | "USDC";
  network: "celo" | "polygon" | "base";
  guideWalletAddress: string;
  walletType?: "metamask" | "coinbase" | "solflare";
}

export function getTokenAddress(token: "USDT" | "USDC", network: "celo" | "polygon" | "base"): string {
  if (network === "celo") {
    // Celo uses USDC mostly
    return USDC_CELO;
  }
  if (network === "base") {
    const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
    if (token === "USDC") {
      return isBaseMainnet 
        ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
        : "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
    } else {
      return isBaseMainnet
        ? "0x50c5725949A6F0c72E6C4a641F24049A91D18C41" // Base Mainnet USDT
        : "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Fallback USDC
    }
  }
  return token === "USDT" ? USDT_POLYGON : USDC_POLYGON;
}

export function getEscrowAddress(network: "celo" | "polygon" | "base"): string {
  if (network === "base") {
    return process.env.NEXT_PUBLIC_ESCROW_ADDRESS_BASE || process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "0x37DA6Bb53A3973Dee2ed7b766f5e341ff123E8C8";
  }
  return network === "celo" ? ESCROW_CELO : ESCROW_POLYGON;
}

export async function connectWallet(
  network: "celo" | "polygon" | "base" = "base",
  walletType?: "metamask" | "coinbase" | "solflare"
): Promise<{ address: string; provider: ethers.BrowserProvider }> {
  if (typeof window === "undefined") {
    throw new Error("Window is not defined. Cannot connect wallet.");
  }

  let rawProvider: any = null;

  // 1. Try EIP-6963 Multi-Injected Provider Discovery (Bypasses window.ethereum hijack completely)
  if (walletType) {
    // Helper to match a provider detail to the requested walletType
    const match = (detail: EIP6963ProviderDetail) => {
      const rdns = detail.info.rdns.toLowerCase();
      const name = detail.info.name.toLowerCase();
      if (walletType === "metamask") {
        return rdns === "io.metamask" || rdns.includes("metamask") || name.includes("metamask");
      }
      if (walletType === "coinbase") {
        return rdns === "com.coinbase.wallet" || rdns.includes("coinbase") || name.includes("coinbase");
      }
      if (walletType === "solflare") {
        return rdns.includes("solflare") || name.includes("solflare");
      }
      return false;
    };

    // First check already announced providers
    announcedProviders.forEach((detail) => {
      if (match(detail)) {
        rawProvider = detail.provider;
      }
    });

    // If not found in already announced providers, request and listen for a short window (250ms)
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
    if (walletType === "metamask") {
      const eth = (window as any).ethereum;
      if (eth) {
        if (eth.providerMap) {
          rawProvider = eth.providerMap.get("MetaMask");
        }
        if (!rawProvider && eth.providers) {
          rawProvider = eth.providers.find((p: any) => p.isMetaMask && !p.isCoinbaseWallet && !p.isCoinbase);
        }
        if (!rawProvider && eth.isMetaMask) {
          const isCoinbase = eth.isCoinbaseWallet || eth.isCoinbase || eth.providers?.some((p: any) => p.isCoinbaseWallet);
          if (!isCoinbase) {
            rawProvider = eth;
          }
        }
      }
    } else if (walletType === "coinbase") {
      rawProvider = (window as any).coinbaseWalletExtension;
      const eth = (window as any).ethereum;
      if (!rawProvider && eth) {
        if (eth.providerMap) {
          rawProvider = eth.providerMap.get("CoinbaseWallet") || eth.providerMap.get("Coinbase");
        }
        if (!rawProvider && eth.providers) {
          rawProvider = eth.providers.find((p: any) => p.isCoinbaseWallet || p.isCoinbase);
        }
        if (!rawProvider && (eth.isCoinbaseWallet || eth.isCoinbase)) {
          rawProvider = eth;
        }
      }
    } else if (walletType === "solflare") {
      rawProvider = (window as any).solflare?.providers?.ethereum || (window as any).solflare;
      const eth = (window as any).ethereum;
      if (!rawProvider && eth) {
        if (eth.providers) {
          rawProvider = eth.providers.find((p: any) => p.isSolflare);
        }
        if (!rawProvider && eth.isSolflare) {
          rawProvider = eth;
        }
      }
    }
  }

  // Fallback to window.ethereum ONLY if no specific wallet type was requested
  if (!rawProvider && !walletType) {
    rawProvider = (window as any).ethereum;
  }

  if (!rawProvider) {
    const walletName = walletType
      ? walletType.charAt(0).toUpperCase() + walletType.slice(1)
      : "Crypto";
    throw new Error(`${walletName} wallet extension is not installed or active.`);
  }

  const provider = new ethers.BrowserProvider(rawProvider);
  const accounts = await provider.send("eth_requestAccounts", []);

  const isCelo = network === "celo";
  const isBase = network === "base";
  const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
  
  const chainIdHex = isCelo 
    ? "0xaa36a7" 
    : isBase 
      ? (isBaseMainnet ? "0x2105" : "0x14a34") // 8453 vs 84532
      : "0x7a69"; // Localhost Hardhat Network Chain ID is 31337 = 0x7a69
      
  const chainName = isCelo 
    ? "Celo Sepolia Testnet" 
    : isBase 
      ? (isBaseMainnet ? "Base Mainnet" : "Base Sepolia Testnet") 
      : "Hardhat Localhost";
      
  const rpcUrl = isCelo 
    ? "https://forno.celo-sepolia.celo-testnet.org" 
    : isBase 
      ? (isBaseMainnet ? "https://mainnet.base.org" : "https://sepolia.base.org") 
      : "http://127.0.0.1:8545";
      
  const nativeCurrency = isCelo
    ? { name: "CELO", symbol: "CELO", decimals: 18 }
    : { name: "ETH", symbol: "ETH", decimals: 18 };
    
  const blockExplorer = isCelo 
    ? "https://celo-sepolia.blockscout.com" 
    : isBase 
      ? (isBaseMainnet ? "https://basescan.org" : "https://sepolia.basescan.org") 
      : "http://localhost:8545";

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

  return { address: accounts[0], provider };
}

export async function getTokenBalance(token: "USDT" | "USDC", address: string, network: "celo" | "polygon" | "base" = "base"): Promise<string> {
  let rpcUrl = "http://127.0.0.1:8545"; // fallback localhost
  const isBaseMainnet = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet";
  if (network === "celo") {
    rpcUrl = "https://forno.celo-sepolia.celo-testnet.org";
  } else if (network === "base") {
    rpcUrl = isBaseMainnet ? "https://mainnet.base.org" : "https://sepolia.base.org";
  } else if (network === "polygon") {
    rpcUrl = "http://127.0.0.1:8545";
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

export async function releaseToGuide(bookingId: string, network: "celo" | "polygon" | "base" = "base"): Promise<string> {
  const { provider } = await connectWallet(network);
  const signer = await provider.getSigner();
  const escrowAddress = getEscrowAddress(network);
  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);

  const tx = await escrow.releaseToGuide(ethers.encodeBytes32String(bookingId));
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function refundTourist(bookingId: string, network: "celo" | "polygon" | "base" = "base"): Promise<string> {
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
  network: "celo" | "polygon" | "base" = "base"
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
