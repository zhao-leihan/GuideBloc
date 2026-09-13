import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function fullWipe() {
  console.log("🚀 Starting 100% Clean NeonDB wipe for Final Simulation...");

  const deleteSafe = async (modelName: string) => {
    if ((prisma as any)[modelName] && typeof (prisma as any)[modelName].deleteMany === "function") {
      try {
        const count = await (prisma as any)[modelName].deleteMany({});
        console.log(`  ✓ Deleted ${modelName} (${count.count} records)`);
      } catch (err: any) {
        console.log(`  ⚠ Skip ${modelName}:`, err.message);
      }
    }
  };

  // 1. Wipe all transactional, media, and booking data
  await deleteSafe("paymentAuditLog");
  await deleteSafe("overpaymentRecord");
  await deleteSafe("platformRevenue");
  await deleteSafe("escrowPayout");
  await deleteSafe("escrowDispute");
  await deleteSafe("review");
  await deleteSafe("platformReview");
  await deleteSafe("message");
  await deleteSafe("conversation");
  await deleteSafe("groupMember");
  await deleteSafe("gigBoost");
  await deleteSafe("userSubscription");
  await deleteSafe("warning");
  await deleteSafe("mail");
  await deleteSafe("meetSession");
  await deleteSafe("booking");

  // 2. Wipe all gigs so explore starts at 0 gigs
  await deleteSafe("gig");

  // 3. Wipe all users
  await deleteSafe("user");

  console.log("✨ All old data wiped completely clean!");

  // Hash clean passwords
  const adminPasswordHash = await bcrypt.hash("Rayhan3723", 10);
  const guidePasswordHash = await bcrypt.hash("Guide123!", 10);
  const touristPasswordHash = await bcrypt.hash("Tourist123!", 10);

  // Seed pristine base accounts
  const admin = await prisma.user.create({
    data: {
      email: "rayhan@guidebloc.com",
      name: "Rayhan Abbrar (Platform Admin)",
      password: adminPasswordHash,
      role: "ADMIN",
      country: "Indonesia",
      walletAddress: "0x079D9c349741C27565ee04e31E4174F640F512aE",
      bio: "Platform Administrator for GuideBloc. Escrow & Tour Booking System",
    },
  });
  console.log("👑 Admin created:", admin.email);

  const guide = await prisma.user.create({
    data: {
      email: "guide@guidebloc.com",
      name: "Gracia Tour Guide",
      password: guidePasswordHash,
      role: "GUIDE",
      guideStatus: "APPROVED",
      country: "Japan",
      bio: "Licensed local tour guide ready to create new tours.",
      walletAddress: null, // Guide starts without linked wallet so you can test linking flow
    },
  });
  console.log("🗺️ Guide created (0 gigs, no wallet linked yet):", guide.email);

  const tourist = await prisma.user.create({
    data: {
      email: "tourist@guidebloc.com",
      name: "Rayhan Tourist",
      password: touristPasswordHash,
      role: "TOURIST",
      country: "Indonesia",
      bio: "Avid traveler ready to book tours.",
    },
  });
  console.log("🎒 Tourist created (0 bookings):", tourist.email);

  console.log("\n🎉 NEONDB WIPE COMPLETE!");
  console.log("Explore page now has 0 gigs. Database is completely ready for your final simulation!");
}

fullWipe()
  .catch((e) => {
    console.error("Wipe error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
