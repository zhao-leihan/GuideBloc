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
    console.log("Loaded .env configuration.");
  }
} catch (err) {
  console.warn("Could not load .env file manually:", err.message);
}

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to NeonDB...");

  // 1. Check all existing users
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  console.log("Current users in NeonDB:", allUsers);

  const adminEmail = "rayhan@explomate.com";
  const rawPassword = "Rayhan3723";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // 2. Remove or clean up previous admin accounts (e.g. zhaohan@explomate.com, zhaohan@explormate.com, etc.)
  const otherAdmins = allUsers.filter(
    (u) => u.role === "ADMIN" && u.email.toLowerCase() !== adminEmail.toLowerCase()
  );

  for (const oldAdmin of otherAdmins) {
    console.log(`Removing old admin account: ${oldAdmin.email} (${oldAdmin.id})...`);
    
    // Clean up any dependent relations if exist
    await prisma.mail.deleteMany({ where: { recipientId: oldAdmin.id } }).catch(() => {});
    await prisma.warning.deleteMany({ where: { userId: oldAdmin.id } }).catch(() => {});
    await prisma.message.deleteMany({ where: { senderId: oldAdmin.id } }).catch(() => {});
    await prisma.userSubscription.deleteMany({ where: { userId: oldAdmin.id } }).catch(() => {});
    
    await prisma.user.delete({
      where: { id: oldAdmin.id }
    });
    console.log(`Deleted old admin account: ${oldAdmin.email}`);
  }

  // Also check if any non-admin account with email zhaohan@explomate.com or zhaohan@explormate.com exists, delete them to clean up
  const zhaoAccounts = await prisma.user.findMany({
    where: {
      email: {
        in: ["zhaohan@explomate.com", "zhaohan@explormate.com"]
      }
    }
  });
  for (const acc of zhaoAccounts) {
    console.log(`Cleaning up leftover Zhao account: ${acc.email}...`);
    await prisma.mail.deleteMany({ where: { recipientId: acc.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: acc.id } }).catch(() => {});
  }

  // 3. Create or update rayhan@explomate.com as the SINGLE admin
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Rayhan",
      password: hashedPassword,
      role: "ADMIN",
      isBlocked: false,
    },
    create: {
      name: "Rayhan",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      bio: "Official Explomate Platform Super Administrator",
      isBlocked: false,
    },
  });

  console.log("Successfully configured Super Admin:", {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

  // 4. Verify user list after modification
  const finalUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  console.log("\n=== FINAL USER LIST IN NEONDB ===");
  console.table(finalUsers);

  const adminCount = finalUsers.filter((u) => u.role === "ADMIN").length;
  console.log(`Total ADMIN accounts in database: ${adminCount}`);
}

main()
  .catch((e) => {
    console.error("Error setting admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
