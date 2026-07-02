import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  if (!treasuryAddress) {
    throw new Error("TREASURY_ADDRESS is not set in .env");
  }

  console.log("Deploying ExplomateEscrow...");
  console.log("Treasury Address:", treasuryAddress);

  const ExplomateEscrow = await hre.ethers.getContractFactory("ExplomateEscrow");
  const escrow = await ExplomateEscrow.deploy(treasuryAddress);

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log(`ExplomateEscrow successfully deployed to: ${address}`);
  console.log(`Don't forget to update NEXT_PUBLIC_ESCROW_ADDRESS in your .env with this address!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
