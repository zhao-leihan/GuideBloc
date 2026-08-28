import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: any;
    contentType?: string;
  }[];
}

/**
 * Helper to wrap email bodies in a premium, responsive gradient banner layout.
 * Uses CID (Content-ID) inline attachment "cid:explomate_logo" so Gmail & mobile mail clients load navbar.png 100% reliably.
 */
function getEmailLayout(title: string, contentHtml: string): string {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <!-- Premium Gradient Banner Header Block -->
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 32px 24px; text-align: center;">
        <img src="cid:explomate_logo" alt="Explomate Logo" style="height: 42px; width: auto; max-width: 220px; display: block; margin: 0 auto 8px auto;" />
        <div style="color: rgba(255, 255, 255, 0.85); font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.1em;">
          ${title}
        </div>
      </div>
      
      <!-- Content Area -->
      <div style="padding: 32px 24px; color: #1f2937; line-height: 1.6; font-size: 14px;">
        ${contentHtml}
      </div>

      <!-- Footer -->
      <div style="padding: 16px 24px; background-color: #f9fafb; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #9ca3af;">
        <div>Explomate Travel & Secure Escrow Platform</div>
        <div style="margin-top: 4px;">&copy; 2026 Explomate. All rights reserved.</div>
      </div>
    </div>
  `;
}

/**
 * Core transactional email dispatcher.
 * Uses Resend API if configured, attaching navbar.png as an inline CID image.
 */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes("explomate.com")) 
      ? process.env.EMAIL_FROM 
      : "onboarding@resend.dev";

    if (apiKey) {
      console.log(`[Email] Sending real email to ${payload.to} via Resend.com API...`);
      
      // Load navbar.png for inline CID embedding in email header
      let logoBase64 = "";
      try {
        const logoPath = path.join(process.cwd(), "public/assets/navbar.png");
        if (fs.existsSync(logoPath)) {
          logoBase64 = fs.readFileSync(logoPath).toString("base64");
        }
      } catch (err) {
        console.error("[Email Error] Failed to read navbar.png for CID attachment:", err);
      }

      const inlineLogoAttachment = logoBase64 ? [{
        filename: "navbar.png",
        content: logoBase64,
        content_id: "explomate_logo"
      }] : [];

      // Convert external attachments into base64 for Resend API
      const userAttachments = payload.attachments?.map((a) => {
        let base64Content = "";
        if (Buffer.isBuffer(a.content)) {
          base64Content = a.content.toString("base64");
        } else if (a.content instanceof Uint8Array) {
          base64Content = Buffer.from(a.content).toString("base64");
        } else if (typeof a.content === "string") {
          base64Content = Buffer.from(a.content).toString("base64");
        }
        return {
          filename: a.filename,
          content: base64Content,
        };
      }) || [];

      const finalAttachments = [...inlineLogoAttachment, ...userAttachments];

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: `Explomate <${fromEmail}>`,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          attachments: finalAttachments,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[Email Error] Resend API error (status ${res.status}): ${errorText}`);
        return false;
      }

      console.log(`[Email Success] Resend email delivered successfully to ${payload.to}`);
      return true;
    } else {
      console.log(`[Email Boilerplate] Simulating sending email to ${payload.to} with subject "${payload.subject}"`);
      return true;
    }
  } catch (error) {
    console.error("[Email Boilerplate] Error sending transactional email:", error);
    return false;
  }
}

/**
 * Triggered automatically upon a user registration to welcome them.
 */
export async function triggerWelcomeEmail(recipientEmail: string, name: string, role: string) {
  const subject = `👋 Welcome to explomate, ${name}!`;
  const content = `
    <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px; font-weight: 700;">Welcome to explomate!</h2>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Thank you for joining explomate! We are thrilled to welcome you to our community of global travelers and local tour guides.</p>
    <p>Your account has been successfully configured as a <strong>${role === "GUIDE" ? "Tour Guide" : "Tourist"}</strong>.</p>
    
    ${role === "GUIDE" 
      ? `<p>Please connect your Web3 payout wallet inside your guide dashboard and create your first gig to start receiving tour bookings with paymaster-sponsored escrow distribution!</p>`
      : `<p>Start exploring beautiful, authentic tour listings, chat directly with local guides, and book them securely with stablecoins (USDC/USDT).</p>`
    }
    
    <div style="margin: 32px 0; text-align: center;">
      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}" style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Go to Dashboard</a>
    </div>
    
    <p>Warm regards,<br/>The Explomate Onboarding Team</p>
  `;

  const html = getEmailLayout("User Onboarding", content);
  return sendTransactionalEmail({ to: recipientEmail, subject, html });
}

/**
 * Triggered when a user requests a password reset.
 */
export async function triggerPasswordResetEmail(recipientEmail: string, resetLink: string) {
  const subject = `🔑 Reset Your Password - explomate`;
  const content = `
    <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
    <p>Hello,</p>
    <p>We received a request to reset the password for your account on explomate.</p>
    <p>Please click the button below to reset your password. This link is valid for 1 hour:</p>
    
    <div style="margin: 32px 0; text-align: center;">
      <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Reset Password</a>
    </div>
    
    <p style="font-size: 11px; color: #6b7280;">If the button above does not work, copy and paste the following URL into your web browser:</p>
    <p style="font-size: 11px; color: #4f46e5; word-break: break-all;">${resetLink}</p>
    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="font-size: 11px; color: #9ca3af;">If you did not request a password reset, you can safely ignore this email.</p>
  `;

  const html = getEmailLayout("Account Security", content);
  return sendTransactionalEmail({ to: recipientEmail, subject, html });
}

// In-memory deduplication cache to prevent duplicate email receipts
const sentReceiptBookings = new Set<string>();

/**
 * Triggered automatically upon a successful booking creation/escrow funding.
 */
export async function triggerBookingSuccessEmail(bookingId: string, recipientEmail: string, gigTitle: string, amount: number, pdfBuffer?: Buffer) {
  if (sentReceiptBookings.has(bookingId)) {
    console.log(`[Email Deduplication] Receipt for booking ${bookingId} already sent. Skipping duplicate.`);
    return { success: true, skipped: true };
  }
  sentReceiptBookings.add(bookingId);

  const subject = `Booking Confirmed & Funds Escrowed - Explomate`;
  const content = `
    <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px; font-weight: 700;">Booking Confirmed</h2>
    <p>Hello,</p>
    <p>Your payment of <strong>$${amount.toFixed(2)} USDC</strong> for the tour <strong>"${gigTitle}"</strong> (Booking ID: ${bookingId}) has been securely deposited into the Avalanche Escrow smart contract.</p>
    <p>The funds will remain locked in the contract until the tour is completed or marked finished by you.</p>
    <p>Your official transaction receipt PDF is attached to this email.</p>
    <p>Thank you for exploring with Explomate.</p>
  `;

  const html = getEmailLayout("Transaction Receipt", content);
  
  const attachments = pdfBuffer ? [{
    filename: `Receipt-${bookingId}.pdf`,
    content: pdfBuffer,
    contentType: "application/pdf"
  }] : undefined;

  return sendTransactionalEmail({ to: recipientEmail, subject, html, attachments });
}

/**
 * Triggered automatically when funds are released/tour is completed.
 */
export async function triggerBookingCompletionEmail(bookingId: string, recipientEmail: string, gigTitle: string, amount: number) {
  const subject = `Payout Released to Wallet - Explomate`;
  const content = `
    <h2 style="color: #10b981; margin-top: 0; font-size: 20px; font-weight: 700;">Payout Released</h2>
    <p>Hello,</p>
    <p>The escrow funds for the tour <strong>"${gigTitle}"</strong> (Booking ID: ${bookingId}) have been successfully released to the Guide's payout address.</p>
    <p>Amount: <strong>$${amount.toFixed(2)} USDC</strong> (platform commission fee split distributed).</p>
    <p>Thank you for exploring with Explomate.</p>
  `;

  const html = getEmailLayout("Escrow Release", content);
  return sendTransactionalEmail({ to: recipientEmail, subject, html });
}

/**
 * Sent to the tourist when a tour is marked COMPLETED — confirms escrow was released.
 */
export async function triggerTouristCompletionEmail(
  bookingId: string,
  recipientEmail: string,
  gigTitle: string,
  guideName: string,
  totalPaid: number
) {
  const subject = `Tour Complete - Thank You for Exploring with Explomate`;
  const content = `
    <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px; font-weight: 700;">Tour Completed</h2>
    <p>Hello,</p>
    <p>We hope you had a great experience on <strong>"${gigTitle}"</strong> with your guide <strong>${guideName}</strong>.</p>
    <p>Your escrow payment of <strong>$${totalPaid.toFixed(2)} USDC</strong> has been released to the guide.</p>
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #065f46;">
        <strong>Booking ID:</strong> ${bookingId}<br/>
        <strong>Tour:</strong> ${gigTitle}<br/>
        <strong>Amount Released:</strong> $${totalPaid.toFixed(2)} USDC
      </p>
    </div>
    <p>Feel free to leave a review to help other travelers discover quality experiences.</p>
    <p>Thank you for traveling with us.<br/>The Explomate Team</p>
  `;

  const html = getEmailLayout("Tour Completion", content);
  return sendTransactionalEmail({ to: recipientEmail, subject, html });
}

/**
 * Sent to the guide when their escrow is released after tour completion.
 */
export async function triggerGuidePayoutEmail(
  bookingId: string,
  recipientEmail: string,
  guideName: string,
  gigTitle: string,
  guideNet: number,
  commissionAmount: number,
  xpEarned: number
) {
  const subject = `Payout Confirmed - $${guideNet.toFixed(2)} USDC Sent to Your Wallet`;
  const content = `
    <h2 style="color: #10b981; margin-top: 0; font-size: 20px; font-weight: 700;">Payout Confirmed</h2>
    <p>Hello <strong>${guideName}</strong>,</p>
    <p>The tour <strong>"${gigTitle}"</strong> has been completed and your escrow funds have been released on-chain.</p>
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #065f46;">
        <strong>Booking ID:</strong> ${bookingId}<br/>
        <strong>Your Net Earnings:</strong> $${guideNet.toFixed(2)} USDC<br/>
        <strong>Platform Fee (10%):</strong> $${commissionAmount.toFixed(2)} USDC<br/>
        <strong>XP Earned:</strong> +${xpEarned} XP
      </p>
    </div>
    <p>Thank you for delivering great experiences on Explomate.</p>
    <p>Best regards,<br/>The Explomate Team</p>
  `;

  const html = getEmailLayout("Payout Confirmed", content);
  return sendTransactionalEmail({ to: recipientEmail, subject, html });
}

/**
 * Sent to the guide when their Pro subscription is activated.
 */
export async function triggerSubscriptionActivatedEmail(
  recipientEmail: string,
  guideName: string,
  expiryDate: string
) {
  const subject = `Pro Subscription Activated - Explomate`;
  const content = `
    <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px; font-weight: 700;">Welcome to Pro</h2>
    <p>Hello <strong>${guideName}</strong>,</p>
    <p>Your <strong>Pro Guide Subscription</strong> is now active. Your profile and gigs are now highlighted across the Explomate platform.</p>
    <div style="background: #eef2ff; border-left: 4px solid #4f46e5; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #3730a3;">
        - Priority ranking in search results<br/>
        - Featured badge on listings<br/>
        - High-visibility profile placement<br/>
        - Advanced discoverability score boost<br/><br/>
        <strong>Active until:</strong> ${expiryDate}
      </p>
    </div>
    <p>Best regards,<br/>The Explomate Team</p>
  `;

  const html = getEmailLayout("Pro Subscription Active", content);
  return sendTransactionalEmail({ to: recipientEmail, subject, html });
}

/**
 * Sent to the guide when they successfully boost a gig.
 */
export async function triggerGigBoostEmail(
  recipientEmail: string,
  guideName: string,
  gigTitle: string,
  boostedUntil: string,
  amountPaid: number
) {
  const subject = `Gig Boosted - "${gigTitle}" is Now Featured`;
  const content = `
    <h2 style="color: #8b5cf6; margin-top: 0; font-size: 20px; font-weight: 700;">Your Gig is Boosted</h2>
    <p>Hello <strong>${guideName}</strong>,</p>
    <p>Your tour <strong>"${gigTitle}"</strong> has been boosted to a <strong>Featured</strong> position on Explomate.</p>
    <div style="background: #faf5ff; border-left: 4px solid #8b5cf6; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #5b21b6;">
        <strong>Gig:</strong> ${gigTitle}<br/>
        <strong>Amount Paid:</strong> $${amountPaid.toFixed(2)} USDC<br/>
        <strong>Featured Until:</strong> ${boostedUntil}<br/>
        <strong>Boost Type:</strong> Top Search Placement
      </p>
    </div>
    <p>Thank you for choosing to grow with Explomate.<br/>The Explomate Team</p>
  `;

  const html = getEmailLayout("Gig Boost Active", content);
  return sendTransactionalEmail({ to: recipientEmail, subject, html });
}

/**
 * Sent to admin/treasury when a tip is received from a tourist.
 * Also sends a warm thank-you note back to the tipper.
 */
export async function triggerTipReceivedEmail(
  tipperEmail: string,
  tipperName: string,
  amountUSD: number,
  gigTitle: string
) {
  const subject = `Thank You for Your Tip - Explomate`;
  const content = `
    <h2 style="color: #f59e0b; margin-top: 0; font-size: 20px; font-weight: 700;">Thank You for Your Support</h2>
    <p>Hello <strong>${tipperName}</strong>,</p>
    <p>Thank you very much for your tip of <strong>$${amountUSD.toFixed(2)} USDC</strong> following your experience with <strong>"${gigTitle}"</strong>.</p>
    <p>Your contribution directly supports our mission and local tour guides worldwide.</p>
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        <strong>Tip Amount:</strong> $${amountUSD.toFixed(2)} USDC<br/>
        <strong>Tour:</strong> ${gigTitle}<br/>
        <strong>Paid on-chain via:</strong> USDC (Avalanche Fuji)
      </p>
    </div>
    <p>Warm regards,<br/>The Explomate Team</p>
  `;

  const html = getEmailLayout("Tip Received", content);
  return sendTransactionalEmail({ to: tipperEmail, subject, html });
}
