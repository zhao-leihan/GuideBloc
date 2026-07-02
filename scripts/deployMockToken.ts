import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const token = await MockUSDC.deploy();
  await token.waitForDeployment();
  const address = await token.getAddress();
  console.log("MockUSDC deployed to:", address);

  // Mint 10,000 mUSDC to deployer
  const mintTx = await token.mint(deployer.address, hre.ethers.parseUnits("10000", 6));
  await mintTx.wait();
  console.log("Minted 10,000 mUSDC to:", deployer.address);
}

main().catch(console.error);
