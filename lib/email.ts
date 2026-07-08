import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: any;
    contentType: string;
  }[];
}

/**
 * Helper to wrap email bodies in a premium, responsive gradient banner layout.
 */
function getEmailLayout(title: string, contentHtml: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <!-- Premium Gradient Banner Header Block -->
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 32px 24px; text-align: center;">
        <img src="${baseUrl}/assets/navbar-logo.png" alt="Explomate Logo" style="height: 36px; display: block; margin: 0 auto 8px auto;" />
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
 * Uses Resend API if configured, otherwise falls back to mockup console logging.
 */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

    if (apiKey) {
      console.log(`[Email] Sending real email to ${payload.to} via Resend.com API...`);
      
      // Convert buffers or arrays into base64 for Resend.com API compatibility
      const mappedAttachments = payload.attachments?.map((a) => {
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
      });

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
          ...(mappedAttachments && { attachments: mappedAttachments }),
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
      if (payload.attachments && payload.attachments.length > 0) {
        console.log(`[Email Boilerplate] Simulated attachments:`, payload.attachments.map(a => a.filename));
      }
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

/**
 * Triggered automatically upon a successful booking creation/escrow funding.
 */
export async function triggerBookingSuccessEmail(bookingId: string, recipientEmail: string, gigTitle: string, amount: number, pdfBuffer?: Buffer) {
  const subject = `💳 Booking Confirmed & Funds Escrowed - explomate`;
  const content = `
    <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px; font-weight: 700;">Booking Confirmed!</h2>
    <p>Hello,</p>
    <p>Your payment of <strong>$${amount.toFixed(2)} USDC</strong> for the tour <strong>"${gigTitle}"</strong> (Booking ID: ${bookingId}) has been securely deposited into the Base Escrow contract.</p>
    <p>The funds will remain locked in the contract until the tour is completed or marked finished by you.</p>
    <p>Your official transaction receipt PDF is attached to this email.</p>
    <p>Thank you for exploring with explomate!</p>
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
  const subject = `💰 Payout Released to Wallet - explomate`;
  const content = `
    <h2 style="color: #10b981; margin-top: 0; font-size: 20px; font-weight: 700;">Payout Released!</h2>
    <p>Hello,</p>
    <p>The escrow funds for the tour <strong>"${gigTitle}"</strong> (Booking ID: ${bookingId}) have been successfully released to the Guide's payout address.</p>
    <p>Amount: <strong>$${amount.toFixed(2)} USDC/USDT</strong> (platform commission fee split distributed).</p>
    <p>Thank you for exploring with explomate!</p>
  `;

  const html = getEmailLayout("Escrow Release", content);
  return sendTransactionalEmail({ to: recipientEmail, subject, html });
}
