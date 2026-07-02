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
    console.log("Successfully loaded .env file manually.");
  }
} catch (err) {
  console.warn("Could not load .env file manually:", err.message);
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database user records (except super admin)...");

  // 1. Delete dependent models
  console.log("Deleting messages...");
  await prisma.message.deleteMany({});

  console.log("Deleting conversations...");
  await prisma.conversation.deleteMany({});

  console.log("Deleting reviews...");
  await prisma.review.deleteMany({});

  console.log("Deleting bookings...");
  await prisma.booking.deleteMany({});

  console.log("Deleting gig boosts...");
  await prisma.gigBoost.deleteMany({});

  console.log("Deleting user subscriptions...");
  await prisma.userSubscription.deleteMany({});

  console.log("Deleting gigs...");
  await prisma.gig.deleteMany({});

  // 2. Delete all users except zhaohan@explormate.com
  console.log("Deleting users (except super admin)...");
  const deleteResult = await prisma.user.deleteMany({
    where: {
      email: {
        not: "zhaohan@explormate.com"
      }
    }
  });

  console.log(`Deleted ${deleteResult.count} user(s).`);
  console.log("Database clean up completed successfully!");
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
