import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  const gasOpsVault = process.env.GAS_OPS_VAULT_ADDRESS || treasuryAddress;
  const saasGrowthVault = process.env.SAAS_GROWTH_VAULT_ADDRESS || treasuryAddress;
  const holdingDividendsVault = process.env.HOLDING_DIVIDENDS_VAULT_ADDRESS || treasuryAddress;

  if (!gasOpsVault || !saasGrowthVault || !holdingDividendsVault) {
    throw new Error("Treasury or Vault addresses are not set in .env");
  }

  console.log("Deploying ExplomateEscrow with Vaults:");
  console.log("Gas & Ops Vault:", gasOpsVault);
  console.log("SaaS Growth Vault:", saasGrowthVault);
  console.log("Holding Dividends Vault:", holdingDividendsVault);

  const ExplomateEscrow = await hre.ethers.getContractFactory("ExplomateEscrow");
  const escrow = await ExplomateEscrow.deploy(gasOpsVault, saasGrowthVault, holdingDividendsVault);

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log(`ExplomateEscrow successfully deployed to: ${address}`);
  console.log(`Don't forget to update NEXT_PUBLIC_ESCROW_ADDRESS in your .env with this address!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
