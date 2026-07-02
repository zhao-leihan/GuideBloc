const fs = require("fs");
const path = require("path");

// Load .env variables manually into process.env before importing Prisma
try {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
      // Remove comments and whitespace
      const cleanLine = line.split("#")[0].trim();
      if (!cleanLine) return;
      
      const firstEquals = cleanLine.indexOf("=");
      if (firstEquals !== -1) {
        const key = cleanLine.substring(0, firstEquals).trim();
        let value = cleanLine.substring(firstEquals + 1).trim();
        // Remove surrounding quotes if they exist
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
    console.log("Successfully loaded .env file manually.");
  } else {
    console.warn(".env file not found at:", envPath);
  }
} catch (err) {
  console.warn("Could not load .env file manually:", err.message);
}

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database (CLEAN START)...");

  // 1. Create default Platform Settings
  await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      commissionRate: 0.10,
      supportedChains: ["polygon", "base"],
    },
  });
  console.log("Default platform settings configured.");

  // 2. Create Super-Admin Zhao han
  const adminPassword = await bcrypt.hash("Rayhan3723", 10);
  const zhaohan = await prisma.user.upsert({
    where: { email: "zhaohan@explormate.com" },
    update: {
      password: adminPassword,
    },
    create: {
      email: "zhaohan@explormate.com",
      name: "Zhao han",
      password: adminPassword,
      role: "ADMIN",
      avatar: "",
      bio: "",
      country: "",
      language: [],
    },
  });
  console.log(`Super-Admin account created: ${zhaohan.email} (Password: Rayhan3723)`);

  console.log("Clean seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
