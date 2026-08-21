import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding local database with exact 3 accounts...");

  const hashedPassword = await bcrypt.hash("@Rayhan3723", 12);

  // 1. Admin: Rayhan
  const admin = await prisma.user.upsert({
    where: { email: "rayhan@explomate.com" },
    update: {
      password: hashedPassword,
      role: "ADMIN",
      name: "Rayhan",
      walletAddress: "0x079D9c349741C27565ee04e31E4174F640F512aE",
    },
    create: {
      name: "Rayhan",
      email: "rayhan@explomate.com",
      password: hashedPassword,
      role: "ADMIN",
      walletAddress: "0x079D9c349741C27565ee04e31E4174F640F512aE",
      bio: "Official Explomate Platform Administrator",
    },
  });
  console.log("Admin seeded:", admin.email);

  // 2. Tourist: Rayhan Abbrar
  const rayhan = await prisma.user.upsert({
    where: { email: "rayhanabbrar233@gmail.com" },
    update: {
      name: "Rayhan Abbrar",
      password: hashedPassword,
      role: "TOURIST",
    },
    create: {
      email: "rayhanabbrar233@gmail.com",
      name: "Rayhan Abbrar",
      password: hashedPassword,
      role: "TOURIST",
      country: "Indonesia",
    },
  });
  console.log("Tourist Rayhan updated:", rayhan.email);

  // 3. Guide Gracia
  const gracia = await prisma.user.upsert({
    where: { email: "clashroyalg404@gmail.com" },
    update: {
      name: "Gracia",
      password: hashedPassword,
      role: "GUIDE",
      guideStatus: "APPROVED",
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    },
    create: {
      email: "clashroyalg404@gmail.com",
      name: "Gracia",
      password: hashedPassword,
      role: "GUIDE",
      guideStatus: "APPROVED",
      country: "Indonesia",
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    },
  });
  console.log("Guide Gracia updated:", gracia.email);

  console.log("Database successfully seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
