process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/explomate?schema=public";
process.env.DIRECT_URL = "postgresql://postgres:postgres@localhost:5432/explomate?schema=public";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:postgres@localhost:5432/explomate?schema=public"
    }
  }
});

async function checkLocal() {
  try {
    console.log("Checking local Postgres DB (localhost:5432)...");
    const bookings = await prisma.booking.findMany();
    console.log("Local Postgres Bookings Count:", bookings.length);
    console.log("Local Postgres Bookings:", JSON.stringify(bookings, null, 2));

    const audit = await prisma.paymentAuditLog.findMany();
    console.log("Local Postgres Audit Logs Count:", audit.length);
    console.log("Local Postgres Audit Logs:", JSON.stringify(audit, null, 2));
  } catch (err) {
    console.log("Local Postgres Error / Not Active:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocal();
