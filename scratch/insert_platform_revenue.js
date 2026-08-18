const fs = require("fs");
const path = require("path");

try {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
      const cleanLine = line.split("#")[0].trim();
      if (!cleanLine) return;
      const firstEquals = cleanLine.indexOf("=");
      if (firstEquals !== -1) {
        const key = cleanLine.substring(0, firstEquals).trim();
        let value = cleanLine.substring(firstEquals + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (err) {}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Inserting PlatformRevenue for booking...");

  const txHash = "0x6bc0eb57a369e63088f9097e300fe7b1df805f48719147abb82e2473a307ef4d";
  const bookingId = "cmsys0u2g000111mz16a7jvx4";

  const rev = await prisma.platformRevenue.create({
    data: {
      source: "BOOKING_COMMISSION",
      amountUSDT: 0.11,
      txHash: txHash,
      referenceId: bookingId
    }
  });

  console.log("Successfully created PlatformRevenue record:", JSON.stringify(rev, null, 2));
}

main()
  .catch((e) => console.error("Error creating PlatformRevenue:", e))
  .finally(() => prisma.$disconnect());
