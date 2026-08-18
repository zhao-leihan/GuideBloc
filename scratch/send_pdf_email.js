const fs = require("fs");
const path = require("path");

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
  }
} catch (err) {}

const { generateReceiptPdf } = require("../lib/receipt");
const { triggerBookingSuccessEmail } = require("../lib/email");

async function main() {
  console.log("Generating PDF Receipt for transaction...");
  const pdfBuffer = generateReceiptPdf({
    id: "cmsys0u2g000111mz16a7jvx4",
    bookingDate: new Date().toISOString(),
    bookingTime: "09:00 AM",
    groupSize: 1,
    totalPriceUSD: 1.11,
    paymentNetwork: "Avalanche C-Chain",
    txHash: "0x6bc0eb57a369e63088f9097e300fe7b1df805f48719147abb82e2473a307ef4d",
    paymentMethod: "USDC Escrow Payment",
    gig: { title: "Nagoya Hidden Tour", location: "Nagoya, Japan" },
    tourist: { name: "Rayhan Abbrar", email: "rayhanabbrar233@gmail.com" }
  });

  console.log("Sending confirmation email with PDF receipt attachment...");
  await triggerBookingSuccessEmail(
    "cmsys0u2g000111mz16a7jvx4",
    "rayhanabbrar233@gmail.com",
    "Nagoya Hidden Tour",
    1.11,
    pdfBuffer
  );

  console.log("Email with PDF receipt successfully sent to rayhanabbrar233@gmail.com!");
}

main().catch((e) => console.error("Email send error:", e));
