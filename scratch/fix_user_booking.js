const fs = require("fs");
const path = require("path");

// Load .env variables manually into process.env before importing Prisma
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
  const txHash = "0x91c4b044b6b708390f22b5ea71870294983c2df2bcc0f1b7ad7e0e85a3061855";
  console.log("Searching for booking or pending bookings...");

  // Find all PENDING bookings or matching txHash
  const pendingBookings = await prisma.booking.findMany({
    where: {
      OR: [
        { txHash: txHash },
        { status: "PENDING" }
      ]
    },
    include: { gig: true, tourist: true }
  });

  console.log(`Found ${pendingBookings.length} matching/pending bookings.`);
  for (const b of pendingBookings) {
    console.log(`Booking ID: ${b.id}, Gig: ${b.gig?.title}, Tourist: ${b.tourist?.email}, Status: ${b.status}`);
    
    // Update to PAID
    await prisma.booking.update({
      where: { id: b.id },
      data: {
        status: "PAID",
        txHash: txHash,
        paidAmountUSD: b.totalPriceUSD || 1.0,
        paymentNetwork: "Avalanche C-Chain"
      }
    });
    console.log(`Successfully updated booking ${b.id} to PAID!`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
