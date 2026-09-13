import hre from "hardhat";
import * as fs from "fs";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts to Localhost with account:", deployer.address);

  // 1. Deploy MockUSDC
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // 2. Deploy GuideBlocEscrow (Treasury Splitters are deployer for now)
  const GuideBlocEscrow = await hre.ethers.getContractFactory("GuideBlocEscrow");
  const escrow = await GuideBlocEscrow.deploy(deployer.address, deployer.address, deployer.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("GuideBlocEscrow deployed to:", escrowAddress);

  // 3. Mint 100,000 USDC to deployer
  const mintAmount = hre.ethers.parseUnits("100000", 6);
  await usdc.mint(deployer.address, mintAmount);
  console.log("Minted 100,000 MockUSDC to:", deployer.address);

  // 4. Save addresses to a JSON file for the frontend to read
  const addresses = {
    usdc: usdcAddress,
    escrow: escrowAddress
  };
  fs.writeFileSync("local-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to local-addresses.json");
}

main().catch(console.error);
