const fs = require("fs");
const path = require("path");

// Load .env manually
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
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (err) {
  console.warn("Env load error:", err.message);
}

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Local DB with 2 Japan Tour Templates...");

  // 1. Ensure platform settings exist
  await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      commissionRate: 0.10,
      supportedChains: ["polygon", "base", "avalanche"],
    },
  });

  // 2. Clear old reviews, bookings, messages, conversations, and gigs from local DB (Respect FK order)
  await prisma.review.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  const deletedGigs = await prisma.gig.deleteMany({});
  console.log(`Cleared ${deletedGigs.count} previous gig(s) from local DB.`);

  // 3. Create or update Guide Account: Kenji Takahashi / Gracia
  const hashedPassword = await bcrypt.hash("Rayhan3723", 10);
  const guide = await prisma.user.upsert({
    where: { email: "clashroyalg404@gmail.com" },
    update: {
      name: "Kenji Takahashi",
      role: "GUIDE",
      guideStatus: "APPROVED",
      country: "JP",
      bio: "Licensed local tour guide based in Tokyo & Kyoto with 7+ years of private cultural & culinary tour experience.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    },
    create: {
      name: "Kenji Takahashi",
      email: "clashroyalg404@gmail.com",
      password: hashedPassword,
      role: "GUIDE",
      guideStatus: "APPROVED",
      country: "JP",
      bio: "Licensed local tour guide based in Tokyo & Kyoto with 7+ years of private cultural & culinary tour experience.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      language: ["English", "Japanese"],
    },
  });

  console.log(`Guide account configured: ${guide.name} (${guide.email})`);

  // 4. Create 2 Japan Tour Templates
  const gig1 = await prisma.gig.create({
    data: {
      title: "Tokyo Street Food & Shibuya Night Explorer",
      description: "Experience the vibrant nightlife of Tokyo! From hidden Izakaya alleys in Omoide Yokocho to the iconic Shibuya Crossing. Enjoy authentic ramen, yakitori, and matcha desserts with your private local guide.",
      location: "Tokyo",
      country: "JP",
      category: "FOOD",
      durationHours: 4,
      priceUSD: 85,
      maxGroupSize: 6,
      guideId: guide.id,
      images: [
        "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1554797589-7241ab691973?q=80&w=1200&auto=format&fit=crop"
      ],
      meetingPoint: "Hachiko Statue, Shibuya Station, Tokyo",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      benefits: ["Free Local Snack & Tea", "Photography Included", "Private Local Route"],
      featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const gig2 = await prisma.gig.create({
    data: {
      title: "Kyoto Historic Temples & Arashiyama Bamboo Grove",
      description: "Journey into the heart of old Japan! Wander through thousand vermilion Torii gates at Fushimi Inari Shrine, walk through the serene Arashiyama Bamboo Grove, and taste traditional matcha in historic Gion.",
      location: "Kyoto",
      country: "JP",
      category: "CULTURE",
      durationHours: 6,
      priceUSD: 120,
      maxGroupSize: 8,
      guideId: guide.id,
      images: [
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1528164344705-47542687990d?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop"
      ],
      meetingPoint: "Kyoto Station Central Exit, Kyoto",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      benefits: ["Temple Entry Fees Covered", "Matcha Tea Tasting", "Private Local Route"],
      featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`Created Japan Tour Template 1: ${gig1.title} ($${gig1.priceUSD})`);
  console.log(`Created Japan Tour Template 2: ${gig2.title} ($${gig2.priceUSD})`);

  console.log("Local database successfully seeded with 2 Japan Tour Templates!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
