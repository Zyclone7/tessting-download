"use server";

import nodemailer from "nodemailer";

interface EmailEntry {
  email: string;
  imageLink: string;
  name?: string;
}

interface EmailTemplate {
  subject: string;
  htmlContent: string;
}

export async function sendSingleEmail(
  entry: EmailEntry,
  template: EmailTemplate
) {
  try {
    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Extract recipient name (fallback to email username)
    const recipientName = entry.name || entry.email.split("@")[0];

    // Process template variables
    const processedSubject = template.subject
      .replace(/{{name}}/g, recipientName)
      .replace(/{{email}}/g, entry.email);

    const processedHtmlContent = template.htmlContent
      .replace(/{{name}}/g, recipientName)
      .replace(/{{email}}/g, entry.email)
      .replace(/{{imageLink}}/g, entry.imageLink);

    console.log(`Sending email to: ${entry.email}`);

    // Send email
    const info = await transporter.sendMail({
      from: `"PhilTech Business Group" <${process.env.GMAIL_USER}>`,
      to: entry.email,
      subject: processedSubject,
      html: processedHtmlContent,
    });

    console.log("Email sent successfully:", info.messageId);

    return {
      success: true,
      email: entry.email,
    };
  } catch (error) {
    console.error(`Error sending to ${entry.email}:`, error);

    // Provide more specific error messages for common issues
    let errorMessage = "Unknown error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific error types
      if (errorMessage.includes("Missing credentials")) {
        errorMessage =
          "Email authentication failed: Missing or invalid credentials. Please check your GMAIL_USER and GMAIL_PASS environment variables.";
      } else if (errorMessage.includes("Invalid login")) {
        errorMessage =
          "Email authentication failed: Invalid login credentials. Please check your GMAIL_USER and GMAIL_PASS environment variables.";
      } else if (errorMessage.includes("security settings")) {
        errorMessage =
          "Email authentication failed: Your Google account security settings may be blocking the login. Please enable 'Less secure app access' or use an App Password.";
      }
    }

    return {
      success: false,
      email: entry.email,
      error: errorMessage,
    };
  }
}

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendWelcomeEmailAction(payload: EmailPayload) {
  try {
    const { to, subject, html } = payload;

    // Validate required fields
    if (!to || !subject || !html) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"PhilTech Business Group" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

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
  password: string
) {
  const userName = user.user_nicename || email.split("@")[0];
  const businessName = user.business_name || "your business";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to PHILTECH BUSINESS GROUP</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #e0e0e0;
    }
    .logo-container {
      text-align: center;
      padding: 25px;
      background-color: #f8f8f8;
      border-bottom: 1px solid #e0e0e0;
    }
    .logo {
      max-width: 250px;
      height: auto;
    }
    .header {
      background-color: #3f87d6;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background-color: #f9f9f9;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }
    .details-table th, .details-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .details-table th {
      background-color: #addaf7;
      font-weight: 600;
      width: 30%;
      color: #333;
    }
    .button {
      display: inline-block;
      background-color: #3f87d6;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: background-color 0.3s ease;
      font-size: 16px;
      letter-spacing: 0.5px;
    }
    .button:hover {
      background-color: #3678c0;
    }
    .warning {
      background-color: #fff8f8;
      border-left: 4px solid #ff5252;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    .footer {
      background-color: #addaf7;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #333;
    }
    .highlight {
      background-color: #addaf7;
      padding: 2px 4px;
      border-radius: 2px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo-container">
      <img src="https://philtechbusiness.ph/wp-content/uploads/2023/06/20000-X-5000-TRANSPARENT13.png" alt="PHILTECH BUSINESS GROUP Logo" class="logo">
    </div>
    <div class="header">
      <h1>Welcome to PHILTECH BUSINESS GROUP!</h1>
    </div>
    <div class="content">
      <p class="greeting">Good day Mr/Ms <strong>${userName}</strong>,</p>
      <p>We are excited to inform you that your account has been <span class="highlight">successfully created</span>! Below are your login credentials:</p>
      <table class="details-table">
        <tr><th>Email</th><td>${email}</td></tr>
        <tr><th>Password</th><td>${password}</td></tr>
      </table>
      <div class="warning">
        <p style="margin: 0;"><strong>IMPORTANT:</strong> Please ensure that you enter your login credentials exactly as shown above to avoid any errors.
        For your security, we strongly recommend that you change your password immediately after logging in.</p>
      </div>
      <div class="button-container">
        <a href="https://app.philtechbusiness.ph/login" class="button">Log In & Change Password</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PHILTECH BUSINESS GROUP. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendWelcomeEmailAction({
    to: email,
    subject: "Welcome to PHILTECH BUSINESS GROUP - Your Login Credentials",
    html,
  });
}
