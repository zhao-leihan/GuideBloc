import hre from "hardhat";

async function main() {
  const tokenAddress = "0x2874C7e0C9B27029455f2a46D2332acE7C749DA9";
  const targetWallet = "0x0Db11E31A07DDDEC044472c7853fbBc3137F51db";

  console.log("MockUSDC Active Contract:", tokenAddress);
  console.log("Target Wallet:", targetWallet);
}

main().catch(console.error);
