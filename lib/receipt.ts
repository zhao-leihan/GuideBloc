import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

interface ReceiptBookingPayload {
  id: string;
  bookingDate: string;
  bookingTime: string;
  groupSize: number;
  totalPriceUSD: number;
  paymentNetwork: string;
  txHash: string;
  paymentMethod?: string;
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
 * Header & Footer feature background.jpeg with dark overlay for maximum white text contrast.
 * Logo uses logo.png badge (without redundant 'EXPLOMATE' text).
 */
export function generateReceiptPdf(booking: ReceiptBookingPayload): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Color Palette
  const primaryColor = { r: 79, g: 70, b: 229 }; // Indigo #4f46e5
  const darkColor = { r: 15, g: 23, b: 42 };    // Slate 900
  const lightGray = { r: 107, g: 114, b: 128 }; // Gray 500
  const bgLight = { r: 248, g: 250, b: 252 };   // Slate 50

  // 1. Draw Header Background Image with Dark Overlay Tint
  let bgDrawn = false;
  try {
    let bgPath = path.join(process.cwd(), "public/assets/background.jpeg");
    if (!fs.existsSync(bgPath)) {
      bgPath = path.join(process.cwd(), "public/assets/background.jpg");
    }
    if (fs.existsSync(bgPath)) {
      const bgBuffer = fs.readFileSync(bgPath);
      const bgBase64 = `data:image/jpeg;base64,${bgBuffer.toString("base64")}`;
      doc.addImage(bgBase64, "JPEG", 0, 0, 210, 42);
      bgDrawn = true;
    }
  } catch (err) {
    console.error("Error embedding background image in PDF header:", err);
  }

  // Draw Dark Slate Overlay Filter over Header Image for contrast
  try {
    doc.setFillColor(15, 23, 42);
    // Use GState for 75% dark tint overlay
    const gState = new (doc as any).GState({ opacity: 0.75 });
    doc.setGState(gState);
    doc.rect(0, 0, 210, 42, "F");
    doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
  } catch {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 42, "F");
  }

  // 2. Draw logo.png Image in Header (NO redundant "EXPLOMATE" text as requested)
  let logoDrawn = false;
  try {
    const logoPath = path.join(process.cwd(), "public/assets/logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      doc.addImage(logoBase64, "PNG", 15, 8, 26, 26);
      logoDrawn = true;
    }
  } catch (err) {
    console.error("Error embedding logo.png in PDF receipt:", err);
  }

  const textX = logoDrawn ? 46 : 15;

  // Header Subtitle Text (Crisp White on Dark Background)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("Web3 Secure Travel & Escrow Platform", textX, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text("https://explomate.com", textX, 26);

  // Header Right: Title & Receipt Metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("TRANSACTION RECEIPT", 195 - 65, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Receipt ID: ${booking.id.toUpperCase()}`, 195 - 65, 25);
  doc.text(`Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 195 - 65, 30);

  // 3. Billing & Payment Method Section Box
  doc.setFillColor(bgLight.r, bgLight.g, bgLight.b);
  doc.rect(15, 48, 180, 32, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 48, 180, 32, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.text("Billed To:", 20, 54);
  doc.text("Payment Method Details:", 110, 54);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(booking.tourist.name, 20, 60);
  doc.text(booking.tourist.email, 20, 65);

  const pMethod = booking.paymentMethod || "Crypto Escrow (USDC/USDT)";
  const pNetwork = (booking.paymentNetwork || "Base L2 Network").toUpperCase();

  doc.text(`Method: ${pMethod}`, 110, 60);
  doc.text(`Escrow Network: ${pNetwork}`, 110, 65);
  doc.text(`Status: Funded & Locked in Smart Contract`, 110, 70);

  // 4. Booking Itemized Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text("BOOKING DETAILS", 15, 92);

  // Table Header
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(15, 96, 180, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Tour Description / Package", 20, 101.5);
  doc.text("Date & Time", 102, 101.5);
  doc.text("Guests", 148, 101.5);
  doc.text("Amount (USD)", 170, 101.5);

  // Table Row
  doc.setFont("helvetica", "normal");
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  const titleText = booking.gig.title.length > 38 ? `${booking.gig.title.substring(0, 35)}...` : booking.gig.title;
  doc.text(titleText, 20, 111);

  const dateObj = new Date(booking.bookingDate);
  const formattedDate = isNaN(dateObj.getTime())
    ? booking.bookingDate
    : dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  
  doc.text(`${formattedDate} ${booking.bookingTime ? '· ' + booking.bookingTime : ''}`, 102, 111);
  doc.text(booking.groupSize.toString(), 151, 111);
  doc.text(`$${booking.totalPriceUSD.toFixed(2)}`, 170, 111);

  doc.setDrawColor(226, 232, 240);
  doc.line(15, 116, 195, 116);

  // Summary Totals Box
  const summaryX = 130;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Subtotal:", summaryX, 125);
  doc.text(`$${booking.totalPriceUSD.toFixed(2)}`, 172, 125);
  
  doc.text("Gas Fee Sponsorship:", summaryX, 130);
  doc.text("$0.00 (Free)", 172, 130);

  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(125, 135, 70, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Total Paid:", 130, 140.5);
  doc.text(`$${booking.totalPriceUSD.toFixed(2)} USDC`, 165, 140.5);

  // 5. On-Chain Escrow Security Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.text("ON-CHAIN ESCROW PROOF", 15, 160);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.text("This receipt serves as digital confirmation of successful funding. Funds are held securely inside the", 15, 166);
  doc.text("Explomate Smart Contract Escrow and will be released to the guide once you finalize completion.", 15, 170);

  // Transaction Hash Card
  doc.setFillColor(bgLight.r, bgLight.g, bgLight.b);
  doc.rect(15, 176, 180, 14, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 176, 180, 14, "D");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.text("Transaction Hash:", 20, 182);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text(booking.txHash, 20, 186);

  // 6. Draw Footer Background Image with Dark Overlay Tint
  try {
    let bgPath = path.join(process.cwd(), "public/assets/background.jpeg");
    if (!fs.existsSync(bgPath)) {
      bgPath = path.join(process.cwd(), "public/assets/background.jpg");
    }
    if (fs.existsSync(bgPath)) {
      const bgBuffer = fs.readFileSync(bgPath);
      const bgBase64 = `data:image/jpeg;base64,${bgBuffer.toString("base64")}`;
      doc.addImage(bgBase64, "JPEG", 0, 267, 210, 30);
    }
  } catch (err) {
    doc.setFillColor(darkColor.r, darkColor.g, darkColor.b);
    doc.rect(0, 267, 210, 30, "F");
  }

  // Dark Slate Overlay Tint over Footer
  try {
    doc.setFillColor(15, 23, 42);
    const gState = new (doc as any).GState({ opacity: 0.75 });
    doc.setGState(gState);
    doc.rect(0, 267, 210, 30, "F");
    doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
  } catch {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 267, 210, 30, "F");
  }

  // Footer text over dark background banner
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("© 2026 Explomate · Web3 Travel Escrow System · All rights reserved.", 15, 277);
  doc.text("Support: support@explomate.com | Thank you for exploring with Explomate!", 15, 282);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
