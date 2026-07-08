import { jsPDF } from "jspdf";

interface ReceiptBookingPayload {
  id: string;
  bookingDate: string;
  bookingTime: string;
  groupSize: number;
  totalPriceUSD: number;
  paymentNetwork: string;
  txHash: string;
  gig: {
    title: string;
    location: string;
  };
  tourist: {
    name: string;
    email: string;
  };
}

/**
 * Generates an A4 PDF Receipt for a successfully funded tour escrow.
 * Returns a Node.js Buffer that can be directly sent via Nodemailer.
 */
export function generateReceiptPdf(booking: ReceiptBookingPayload): Buffer {
  // Initialize A4 landscape/portrait. Default is portrait, unit "mm", format "a4" (210 x 297 mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Color Palette
  const primaryColor = { r: 79, g: 70, b: 229 }; // Indigo #4f46e5
  const darkColor = { r: 17, g: 24, b: 39 };    // Dark gray
  const lightGray = { r: 107, g: 114, b: 128 }; // Light gray
  const bgLight = { r: 249, g: 250, b: 251 };   // Page bg light

  // 1. Draw Accent Top Banner
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(0, 0, 210, 8, "F");

  // 2. Explomate Header Section with navbar-logo image embedding
  let logoDrawn = false;
  try {
    const fs = require("fs");
    const path = require("path");
    const logoPath = path.join(process.cwd(), "public/assets/navbar-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      doc.addImage(logoBase64, "PNG", 15, 14, 28, 9);
      logoDrawn = true;
    }
  } catch (err) {
    console.error("Error embedding logo in PDF receipt:", err);
  }

  if (!logoDrawn) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.text("EXPLOMATE", 15, 25);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.text("Web3 Secure Travel & Escrow System", 15, 30);
  doc.text("https://explomate.com", 15, 34);

  // 3. Receipt Invoice Title (Right aligned)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.text("TRANSACTION RECEIPT", 200 - 68, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.text(`Receipt ID: ${booking.id.toUpperCase()}`, 200 - 68, 30);
  doc.text(`Issued Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 200 - 68, 34);

  // Draw Separator Line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, 42, 195, 42);

  // 4. Billing Details Box
  doc.setFillColor(bgLight.r, bgLight.g, bgLight.b);
  doc.rect(15, 48, 180, 28, "F");
  doc.setDrawColor(243, 244, 246);
  doc.rect(15, 48, 180, 28, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.text("Billed To:", 20, 54);
  doc.text("Payment Method:", 110, 54);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.text(booking.tourist.name, 20, 60);
  doc.text(booking.tourist.email, 20, 64);

  doc.text(`Token: USDC Stablecoin`, 110, 60);
  doc.text(`Escrow Network: ${booking.paymentNetwork.toUpperCase()}`, 110, 64);
  doc.text(`Transaction Status: Funded & Awaiting Tour`, 110, 68);

  // 5. Booking Itemized Details Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text("BOOKING DETAILS", 15, 90);

  // Table Header
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(15, 95, 180, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Tour Description / Gig Name", 20, 100);
  doc.text("Date & Time", 100, 100);
  doc.text("Guests", 150, 100);
  doc.text("Amount (USD)", 172, 100);

  // Table Body Row with structured, non-colliding formatted date
  doc.setFont("helvetica", "normal");
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.text(booking.gig.title.length > 38 ? `${booking.gig.title.substring(0, 35)}...` : booking.gig.title, 20, 110);
  
  const dateObj = new Date(booking.bookingDate);
  const formattedDate = isNaN(dateObj.getTime())
    ? booking.bookingDate
    : dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  
  doc.text(`${formattedDate} ${booking.bookingTime ? '· ' + booking.bookingTime : ''}`, 100, 110);
  doc.text(booking.groupSize.toString(), 153, 110);
  doc.text(`$${booking.totalPriceUSD.toFixed(2)}`, 172, 110);

  // Draw Bottom Table Line
  doc.setDrawColor(229, 231, 235);
  doc.line(15, 115, 195, 115);

  // Summary Card (Right aligned)
  const summaryX = 135;
  doc.setFont("helvetica", "bold");
  doc.text("Subtotal:", summaryX, 124);
  doc.text(`$${booking.totalPriceUSD.toFixed(2)}`, 175, 124);
  
  doc.text("Base Gas Sponsorship:", summaryX, 129);
  doc.text("$0.00 (Free)", 175, 129);

  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(130, 134, 65, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Total Paid:", 135, 139);
  doc.text(`$${booking.totalPriceUSD.toFixed(2)} USDC`, 168, 139);

  // 6. Security & Verification Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.text("ON-CHAIN ESCROW PROOF", 15, 160);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.text("This receipt serves as digital confirmation of successful funding. Funds are held securely inside the", 15, 166);
  doc.text("Explomate Smart Contract and will be released to the guide once you finalize completion on the dashboard.", 15, 170);

  // Transaction Hash Box
  doc.setFillColor(bgLight.r, bgLight.g, bgLight.b);
  doc.rect(15, 176, 180, 14, "F");
  doc.rect(15, 176, 180, 14, "D");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.text("Transaction Hash:", 20, 182);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text(booking.txHash, 20, 186);

  // 7. Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.text("If you have any questions or require support, please contact us at support@explomate.com.", 15, 275);
  doc.text("Thank you for choosing Explomate for your travel booking adventures!", 15, 279);

  // Output as array buffer and convert to node Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
