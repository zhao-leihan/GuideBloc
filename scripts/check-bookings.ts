import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    select: { id: true, status: true, createdAt: true, expiresAt: true, totalPriceUSD: true },
  });
  console.log("Current bookings in DB:", JSON.stringify(bookings, null, 2));

  // If any PENDING booking doesn't have expiresAt, set it to 24h from now or createdAt
  for (const b of bookings) {
    if (b.status === "PENDING" && !b.expiresAt) {
      const expiresAt = new Date(new Date(b.createdAt).getTime() + 24 * 60 * 60 * 1000);
      await prisma.booking.update({
        where: { id: b.id },
        data: { expiresAt },
      });
      console.log(`Updated booking ${b.id} with expiresAt: ${expiresAt.toISOString()}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
