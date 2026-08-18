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
  console.log("Locating tourist user and gig in NeonDB...");

  // Find Tourist User
  let tourist = await prisma.user.findFirst({
    where: { role: "TOURIST" }
  });

  if (!tourist) {
    tourist = await prisma.user.findFirst({
      where: { email: { contains: "rayhan" } }
    });
  }

  // Find Active Gig
  let gig = await prisma.gig.findFirst({
    where: { isActive: true }
  });

  if (!tourist || !gig) {
    console.error("Tourist or Gig missing in NeonDB!");
    return;
  }

  console.log(`Linking 1 USDC transaction to Tourist: ${tourist.email} (${tourist.name}), Gig: ${gig.title}`);

  const txHash = "0x6bc0eb57a369e63088f9097e300fe7b1df805f48719147abb82e2473a307ef4d";

  // Create PAID booking record in NeonDB
  const booking = await prisma.booking.create({
    data: {
      gigId: gig.id,
      touristId: tourist.id,
      bookingDate: new Date(),
      bookingTime: "09:00 AM",
      groupSize: 1,
      totalPriceUSD: 1.11,
      totalPriceCrypto: 1.11,
      cryptoToken: "USDC",
      status: "PAID",
      txHash: txHash,
      paidAmountUSD: 1.11,
      paymentNetwork: "Avalanche C-Chain",
      guide_price: 1.00,
      client_price: 1.11,
      platform_fee: 0.11
    }
  });

  console.log("PAID Booking successfully created in NeonDB!");
  console.log("Booking Details:", JSON.stringify(booking, null, 2));

  // Save Audit Log
  await prisma.paymentAuditLog.create({
    data: {
      bookingId: booking.id,
      txHash: txHash,
      source: "MANUAL_RECOVERY",
      status: "SUCCESS",
      rawPayload: {
        network: "Avalanche C-Chain",
        transferredAmountUSD: 1.11,
        expectedAmountUSD: 1.11
      }
    }
  });

  console.log("Payment Audit Log created successfully!");
}

main()
  .catch((e) => console.error("Error creating booking record:", e))
  .finally(() => prisma.$disconnect());
