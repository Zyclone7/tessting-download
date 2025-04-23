"use server";
import nodemailer from "nodemailer";
import { convert } from "html-to-text";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  antiSpamFeatures?: {
    dkim: boolean;
    spf: boolean;
    personalizedSubject: boolean;
    unsubscribeLink: boolean;
    plainTextAlternative: boolean;
  };
  userName?: string;
};

export async function sendEmail(payload: EmailPayload) {
  try {
    const { to, subject, html, antiSpamFeatures, userName } = payload;

    // Create transporter with Bluehost SMTP
    const transporter = nodemailer.createTransport({
      host: "mail.philtechbusiness.ph",
      port: 465,
      secure: true,
      auth: {
        user: process.env.BLUEHOST_EMAIL || "myservices@philtechbusiness.ph",
        pass: process.env.BLUEHOST_PASS || "PtG#1717@2025!",
      },
      ...(antiSpamFeatures?.dkim &&
        process.env.BLUEHOST_DKIM_PRIVATE_KEY && {
          dkim: {
            domainName: "philtechbusiness.ph",
            keySelector: "default",
            privateKey: process.env.BLUEHOST_DKIM_PRIVATE_KEY,
          },
        }),
    });

    // Prepare email headers and content
    const emailOptions: any = {
      from: {
        name: "PHILTECH Business Group",
        address: process.env.BLUEHOST_EMAIL || "myservices@philtechbusiness.ph",
      },
      to,
      subject:
        antiSpamFeatures?.personalizedSubject && userName
          ? `Welcome to PHILTECH Business Group, ${userName}!`
          : subject,
      html,
    };

    // Add plain text alternative if requested
    if (antiSpamFeatures?.plainTextAlternative) {
      emailOptions.text = convert(html, {
        wordwrap: 130,
        selectors: [
          { selector: "img", format: "skip" },
          { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
        ],
      });
    }

    // Add List-Unsubscribe header if requested
    if (antiSpamFeatures?.unsubscribeLink) {
      emailOptions.headers = {
        "List-Unsubscribe": `<mailto:unsubscribe@philtechbusiness.ph?subject=Unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      };
    }

    // Add SPF verification if requested
    if (antiSpamFeatures?.spf) {
      if (!emailOptions.headers) {
        emailOptions.headers = {};
      }
      emailOptions.headers["X-SPF"] = "pass";
    }

    // Send email
    const info = await transporter.sendMail(emailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to send welcome email with user credentials
export async function sendWelcomeEmail(
  email: string,
  user: any,
  password: string,
  emailTemplate?: string,
  antiSpamFeatures?: {
    dkim: boolean;
    spf: boolean;
    personalizedSubject: boolean;
    unsubscribeLink: boolean;
    plainTextAlternative: boolean;
  }
) {
  const userName = user.user_nicename || email.split("@")[0];
  const businessName = user.business_name || "your business";
  const currentYear = new Date().getFullYear();

  // Get the email template or use default
  const template =
    emailTemplate ||
    `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to PHILTECH BUSINESS GROUP</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
    <!-- Logo Section -->
    <tr>
      <td style="text-align: center; padding: 25px; background-color: #afdaf5; border-bottom: 1px solid #e0e0e0;">
        <img src="https://philtechbusiness.ph/wp-content/uploads/2023/06/20000-X-5000-TRANSPARENT13.png" alt="PHILTECH BUSINESS GROUP Logo" style="max-width: 250px; height: auto;">
      </td>
    </tr>
    
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #3c89d6 0%, #afdaf5 100%); padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">PHILTECH INC BUSINESS GROUP</h1>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 30px 20px;">
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">We are excited to inform you that your account has been successfully created! Below are your login credentials:</p>
        
        <!-- Credentials Box -->
        <div style="background-color: #f0f7fc; border-left: 4px solid #3c89d6; padding: 20px; margin: 25px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <table style="width: 100%; font-size: 16px;">
            <tr>
              <td style="padding: 8px 0;"><strong>Email:</strong></td>
              <td style="padding: 8px 0;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Password:</strong></td>
              <td style="padding: 8px 0;">${password}</td>
            </tr>
          </table>
        </div>
        
        <!-- Warning -->
        <div style="background-color: #fff8f8; border-left: 4px solid #e53e3e; padding: 15px; margin: 25px 0; border-radius: 0 4px 4px 0;">
          <p style="color: #e53e3e; font-weight: bold; margin: 0; font-size: 16px;">WARNING: Please ensure that you enter your login credentials exactly as shown above to avoid any errors. For your security, we strongly recommend that you change your password immediately after logging in.</p>
        </div>
        
        <!-- Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://app.philtechbusiness.ph/login" style="display: inline-block; background-color: #3c89d6; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: le4px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 16px; letter-spacing: 0.5px;">Log In & Change Password</a>
        </div>
        
        <p style="font-size: 14px; color: #718096; line-height: 1.5; margin-top: 30px;">If you didn't create this account, please ignore this email and contact support immediately.</p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #afdaf5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 14px; color: #333; margin: 0 0 10px 0;"><strong>© ${currentYear} PHILTECH INC BUSINESS GROUP. All rights reserved.</strong></p>
        <p style="font-size: 14px; color: #333; margin: 0;">For support, contact <a href="mailto:support@philtechbusiness.ph" style="color: #3c89d6; text-decoration: none; font-weight: bold;">support@philtechbusiness.ph</a></p>
        <p style="font-size: 14px; color: #333; margin: 10px 0 0 0;">This is an automated message, please do not reply to this email.</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

  // Replace placeholders with actual values
  const html = template
    .replace(/{{userName}}/g, userName)
    .replace(/{{email}}/g, email)
    .replace(/{{password}}/g, password)
    .replace(/{{year}}/g, currentYear.toString());

  // Add unsubscribe link if requested
  const finalHtml = antiSpamFeatures?.unsubscribeLink
    ? html.replace(
        "</body>",
        `
      <div style="text-align: center; font-size: 12px; color: #666; margin-top: 20px; padding: 10px;">
        <p>If you no longer wish to receive these emails, you can <a href="mailto:unsubscribe@philtechbusiness.ph?subject=Unsubscribe&body=Please%20unsubscribe%20me%20from%20all%20future%20emails.">unsubscribe here</a>.</p>
      </div>
    </body>`
      )
    : html;

  return sendEmail({
    to: email,
    subject: "Welcome to PHILTECH BUSINESS GROUP - Your Login Credentials",
    html: finalHtml,
    antiSpamFeatures,
    userName,
  });
}
