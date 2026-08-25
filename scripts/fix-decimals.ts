import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixDecimals() {
  console.log("Checking and fixing any unrounded floating point numbers in database...");

  const gigs = await prisma.gig.findMany();
  for (const gig of gigs) {
    const guide_price = Math.round(Number(gig.guide_price || gig.priceUSD) * 100) / 100;
    const client_price = Math.round((guide_price / 0.90) * 100) / 100;
    const platform_fee = Math.round((client_price - guide_price) * 100) / 100;

    await prisma.gig.update({
      where: { id: gig.id },
      data: {
        guide_price,
        client_price,
        platform_fee,
        priceUSD: client_price,
      },
    });
    console.log(`Gig [${gig.title}] fixed: guide=$${guide_price}, client=$${client_price}, fee=$${platform_fee}`);
  }

  const bookings = await prisma.booking.findMany();
  for (const b of bookings) {
    const client_price = Math.round(Number(b.client_price || b.totalPriceUSD / b.groupSize) * 100) / 100;
    const guide_price = Math.round((client_price * 0.90) * 100) / 100;
    const platform_fee = Math.round((client_price - guide_price) * 100) / 100;
    const totalPriceUSD = Math.round(client_price * b.groupSize * 100) / 100;

    await prisma.booking.update({
      where: { id: b.id },
      data: {
        client_price,
        guide_price,
        platform_fee,
        totalPriceUSD,
        totalPriceCrypto: totalPriceUSD,
      },
    });
    console.log(`Booking [${b.id}] fixed: total=$${totalPriceUSD}`);
  }

  console.log("All database prices sanitized to clean 2-decimal numbers!");
}

fixDecimals()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
