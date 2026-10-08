import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { getNetworkConfig } from "../lib/crypto/networkConfig";

dotenv.config();

async function main() {
  const cfg = getNetworkConfig();
  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
  const relayerKey = process.env.RELAYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (!relayerKey) throw new Error("No private key configured");

  const wallet = new ethers.Wallet(relayerKey, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Current Balance: ${ethers.formatEther(balance)} AVAX`);

  const artPath = path.resolve(__dirname, "../artifacts/contracts/GuideBlocEscrowV2.sol/GuideBlocEscrowV2.json");
  const art = require(artPath);
  const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);

  console.log(`Deploying GuideBlocEscrowV2 with treasury: ${cfg.treasuryAddress}...`);
  const feeData = await provider.getFeeData();
  const contract = await factory.deploy(cfg.treasuryAddress, {
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  });
  console.log("Transaction broadcasted! Waiting for block confirmation on Avalanche...");
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash;
  console.log(`Deployment TxHash: ${txHash}`);
  console.log(`Successfully deployed GuideBlocEscrowV2 at: ${address}`);

  // Update lib/crypto/networkConfig.ts
  const configPath = path.resolve("lib/crypto/networkConfig.ts");
  let configContent = fs.readFileSync(configPath, "utf-8");
  configContent = configContent.replace(
    /escrowContractAddress:\s*"0x[a-fA-F0-9]{40}"/,
    `escrowContractAddress: "${address}"`
  );
  fs.writeFileSync(configPath, configContent, "utf-8");

  // Update .env
  const envPath = path.resolve(".env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.includes("NEXT_PUBLIC_ESCROW_ADDRESS=")) {
      envContent = envContent.replace(/^NEXT_PUBLIC_ESCROW_ADDRESS=.*$/m, `NEXT_PUBLIC_ESCROW_ADDRESS="${address}"`);
    } else {
      envContent += `\nNEXT_PUBLIC_ESCROW_ADDRESS="${address}"\n`;
    }
    fs.writeFileSync(envPath, envContent, "utf-8");
  }

  console.log("Configuration files updated with new contract address.");
}

main().catch(console.error);
