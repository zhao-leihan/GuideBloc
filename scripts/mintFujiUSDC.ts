import hre from "hardhat";

async function main() {
  const targetWallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  console.log("Deploying MockUSDC to Avalanche Fuji Testnet...");

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const token = await MockUSDC.deploy();
  await token.waitForDeployment();
  const address = await token.getAddress();
  console.log("MockUSDC deployed at:", address);

  console.log(`Minting 50,000 USDC to ${targetWallet}...`);
  const mintTx = await token.mint(targetWallet, hre.ethers.parseUnits("50000", 6));
  await mintTx.wait();
  console.log("Minting Successful! Transaction hash:", mintTx.hash);
  console.log("\nCopy this contract address to MetaMask:");
  console.log(address);
}

main().catch(console.error);
