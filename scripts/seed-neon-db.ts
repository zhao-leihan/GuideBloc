import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Neon DB Cloud Database (Users Only, No Monas Gig)...");
  const hashedPassword = await bcrypt.hash("@Rayhan3723", 10);

  // 1. Admin: Zhao Han
  const admin = await prisma.user.upsert({
    where: { email: "zhaohan@explormate.com" },
    update: {
      password: hashedPassword,
      role: "ADMIN",
      name: "Zhao Han",
      walletAddress: "0x079D9c349741C27565ee04e31E4174F640F512aE",
    },
    create: {
      name: "Zhao Han",
      email: "zhaohan@explormate.com",
      password: hashedPassword,
      role: "ADMIN",
      walletAddress: "0x079D9c349741C27565ee04e31E4174F640F512aE",
      bio: "Official Explomate Platform Administrator",
    },
  });
  console.log("Admin seeded:", admin.email);

  // 2. Tourist: Rayhan Abbrar
  const tourist = await prisma.user.upsert({
    where: { email: "rayhanabbrar233@gmail.com" },
    update: {
      password: hashedPassword,
      role: "TOURIST",
      name: "Rayhan Abbrar",
    },
    create: {
      name: "Rayhan Abbrar",
      email: "rayhanabbrar233@gmail.com",
      password: hashedPassword,
      role: "TOURIST",
      bio: "Avid traveler exploring Southeast Asia",
    },
  });
  console.log("Tourist seeded:", tourist.email);

  // 3. Guide: Gracia
  const guide = await prisma.user.upsert({
    where: { email: "clashroyalg404@gmail.com" },
    update: {
      password: hashedPassword,
      role: "GUIDE",
      guideStatus: "APPROVED",
      name: "Gracia",
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    },
    create: {
      name: "Gracia",
      email: "clashroyalg404@gmail.com",
      password: hashedPassword,
      role: "GUIDE",
      guideStatus: "APPROVED",
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      bio: "Licensed local tour guide in Jakarta specializing in cultural, culinary, and historic tours.",
    },
  });
  console.log("Guide seeded:", guide.email);

  // 4. Remove Monas sample gigs completely
  const deleted = await prisma.gig.deleteMany({
    where: {
      title: { contains: "Monas" }
    }
  });
  if (deleted.count > 0) {
    console.log(`Removed ${deleted.count} Monas sample gig(s) from database.`);
  }

  console.log("Neon DB Seeding Complete (Clean users ready)!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
