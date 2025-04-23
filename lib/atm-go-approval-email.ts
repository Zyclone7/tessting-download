"use server"

import nodemailer from "nodemailer"
import { format } from "date-fns"
import { convert } from "html-to-text"

type EmailPayload = {
  to: string
  subject: string
  html: string
  antiSpamFeatures?: {
    dkim: boolean
    spf: boolean
    personalizedSubject: boolean
    unsubscribeLink: boolean
    plainTextAlternative: boolean
  }
  userName?: string
}

// Enhanced interface for application details
interface ApplicationDetails {
  id: number
  complete_name: string
  business_name: string
  email: string
  admin_notes?: string
  merchant_logo_url?: string | null
  merchant_contact?: string | null
  merchant_website?: string | null
  business_industry?: string
  atm_serial_number?: string
}

export async function sendEmail(payload: EmailPayload) {
  try {
    const { to, subject, html, antiSpamFeatures, userName } = payload

    // Create transporter with Bluehost SMTP
    const transporter = nodemailer.createTransport({
      host: "mail.philtechbusiness.ph",
      port: 465,
      secure: true, // true for SSL
      auth: {
        user: process.env.BLUEHOST_EMAIL || "myservices@philtechbusiness.ph",
        pass: process.env.BLUEHOST_PASS || "PtG#1717@2025!",
      },
      // Enable DKIM if available and requested
      ...(antiSpamFeatures?.dkim &&
        process.env.BLUEHOST_DKIM_PRIVATE_KEY && {
          dkim: {
            domainName: "philtechbusiness.ph",
            keySelector: "default",
            privateKey: process.env.BLUEHOST_DKIM_PRIVATE_KEY,
          },
        }),
    })

    // Prepare email headers and content
    const emailOptions: any = {
      from: {
        name: "PHILTECH Business Group",
        address: process.env.BLUEHOST_EMAIL || "myservices@philtechbusiness.ph",
      },
      to,
      subject:
        antiSpamFeatures?.personalizedSubject && userName ? `ATM GO Application Status for ${userName}` : subject,
      html,
    }

    // Add plain text alternative if requested
    if (antiSpamFeatures?.plainTextAlternative) {
      emailOptions.text = convert(html, {
        wordwrap: 130,
        selectors: [
          { selector: "img", format: "skip" },
          { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
        ],
      })
    }

    // Add List-Unsubscribe header if requested
    if (antiSpamFeatures?.unsubscribeLink) {
      emailOptions.headers = {
        "List-Unsubscribe": `<mailto:unsubscribe@philtechbusiness.ph?subject=Unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      }
    }

    // Add SPF verification if requested
    if (antiSpamFeatures?.spf) {
      if (!emailOptions.headers) {
        emailOptions.headers = {}
      }
      emailOptions.headers["X-SPF"] = "pass"
    }

    // Send email
    const info = await transporter.sendMail(emailOptions)

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Error sending email:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Function to send ATM GO approval email
export async function sendATMGOApprovalEmail(
  application: ApplicationDetails,
  emailTemplate?: string,
  antiSpamFeatures?: {
    dkim: boolean
    spf: boolean
    personalizedSubject: boolean
    unsubscribeLink: boolean
    plainTextAlternative: boolean
  },
) {
  const userName = application.complete_name
  const businessName = application.business_name
  const currentYear = new Date().getFullYear()

  // Get the email template or use default
  const template =
    emailTemplate ||
    `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ATM GO Application Approved</title>
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
      max-width: 650px;
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
      background: linear-gradient(135deg, #4481eb 0%, #04befe 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 35px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #444;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      background-color: #f9f9f9;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
    }
    .details-table th, .details-table td {
      padding: 14px 18px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .details-table th {
      background-color: #e8f4fd;
      font-weight: 600;
      width: 35%;
      color: #2c3e50;
    }
    .details-table tr:last-child td,
    .details-table tr:last-child th {
      border-bottom: none;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #4481eb 0%, #04befe 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      font-size: 16px;
      letter-spacing: 0.5px;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
    }
    .info-box {
      background-color: #e8f4fd;
      border-left: 4px solid #4481eb;
      padding: 18px;
      margin: 25px 0;
      border-radius: 0 6px 6px 0;
    }
    .requirements-box {
      background-color: #fff8f0;
      border-left: 4px solid #f5a623;
      padding: 18px;
      margin: 25px 0;
      border-radius: 0 6px 6px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px;
      text-align: center;
      font-size: 14px;
      color: #555;
      border-top: 1px solid #e0e0e0;
    }
    .highlight {
      background-color: #e8f4fd;
      padding: 3px 6px;
      border-radius: 3px;
      font-weight: 500;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    ul {
      margin: 20px 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 12px;
      position: relative;
    }
    .requirements-list {
      margin: 15px 0;
      padding-left: 5px;
      list-style-type: none;
    }
    .requirements-list li {
      margin-bottom: 12px;
      padding-left: 25px;
      position: relative;
    }
    .requirements-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #f5a623;
      font-weight: bold;
    }
    .note {
      font-style: italic;
      color: #666;
      font-size: 14px;
      margin-top: 10px;
    }
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 30px 0;
    }
    .social-links {
      margin-top: 20px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #4481eb;
      text-decoration: none;
    }
    .contact-info {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
      font-size: 13px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo-container">
      ${
        application.merchant_logo_url
          ? `<img src="${application.merchant_logo_url}" alt="ATM GO Logo" class="logo">`
          : `<h2 style="color: #4481eb; margin: 0; font-weight: 600;">ATM GO</h2>`
      }
    </div>
    <div class="header">
      <h1>Application Approved</h1>
      <p>Your ATM GO journey begins now</p>
    </div>
    <div class="content">
      <p class="greeting">Good day, ${userName},</p>
      <p>We are pleased to inform you that your ATM GO application for <strong>${businessName}</strong> has been <span class="highlight">APPROVED</span>!</p>
      
      ${
        application.admin_notes
          ? `
      <div class="info-box">
        <strong>Admin Notes:</strong>
        <p>{{adminNotes}}</p>
      </div>
      `
          : ""
      }
      
      <h3>Application Details</h3>
      <table class="details-table">
        <tr>
          <th>Application ID</th>
          <td>{{applicationId}}</td>
        </tr>
        <tr>
          <th>Business Name</th>
          <td>{{businessName}}</td>
        </tr>
        <tr>
          <th>Industry</th>
          <td>{{businessIndustry}}</td>
        </tr>
        <tr>
          <th>Approval Date</th>
          <td>{{approvalDate}}</td>
        </tr>
      </table>
      
      <div class="requirements-box">
        <h3>Required Documents for Upload</h3>
        <p>To complete your application, please upload the following requirements:</p>
        <ol class="requirements-list">
          <li><strong>Business Permit or Barangay Permit</strong></li>
          <li><strong>DTI CERTIFICATE</strong>, or SEC for Corporation, CDA for cooperative</li>
          <li><strong>Clear copy of BANK ACCOUNT</strong></li>
          <li><strong>Signed Terms & Conditions</strong></li>
          <li><strong>Picture of STORE</strong> (interior and exterior)</li>
        </ol>
        <p class="note">If you cannot find the upload section, please refresh your browser.</p>
      </div>
      
      <div class="divider"></div>
      
      <h3>Next Steps</h3>
      <ul>
        <li>Upload all required documents mentioned above</li>
        <li>Our team will contact you with final onboarding details</li>
        <li>Prepare any additional required documentation</li>
        <li>Get ready to activate your ATM GO services</li>
      </ul>
      
      <div class="button-container">
        <a href="{{dashboardUrl}}" class="button">Access Dashboard</a>
      </div>
      
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      
      <p>Best regards,<br><strong>ATM GO Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; {{year}} ATM GO. All rights reserved.</p>
      ${application.merchant_contact ? `<p>Support: {{merchantContact}}</p>` : ""}
      ${application.merchant_website ? `<p>Visit: <a href="{{merchantWebsite}}" style="color: #4481eb;">{{merchantWebsite}}</a></p>` : ""}
      <div class="contact-info">
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  // Replace placeholders with actual values
  let html = template
    .replace(/{{userName}}/g, userName)
    .replace(/{{businessName}}/g, businessName)
    .replace(/{{applicationId}}/g, application.id.toString())
    .replace(/{{businessIndustry}}/g, application.business_industry || "Not Specified")
    .replace(/{{approvalDate}}/g, format(new Date(), "MMMM dd, yyyy"))
    .replace(/{{dashboardUrl}}/g, process.env.DASHBOARD_URL || "#")
    .replace(/{{year}}/g, currentYear.toString())

  // Add conditional replacements
  if (application.admin_notes) {
    html = html.replace(/{{adminNotes}}/g, application.admin_notes)
  }
  if (application.merchant_contact) {
    html = html.replace(/{{merchantContact}}/g, application.merchant_contact)
  }
  if (application.merchant_website) {
    html = html.replace(/{{merchantWebsite}}/g, application.merchant_website)
  }

  // Add unsubscribe link if requested
  const finalHtml = antiSpamFeatures?.unsubscribeLink
    ? html.replace(
        "</body>",
        `
      <div style="text-align: center; font-size: 12px; color: #666; margin-top: 20px; padding: 10px;">
        <p>If you no longer wish to receive these emails, you can <a href="mailto:unsubscribe@philtechbusiness.ph?subject=Unsubscribe&body=Please%20unsubscribe%20me%20from%20all%20future%20emails.">unsubscribe here</a>.</p>
      </div>
    </body>`,
      )
    : html

  return sendEmail({
    to: application.email,
    subject: `ATM GO Application #${application.id} - Status Update`,
    html: finalHtml,
    antiSpamFeatures,
    userName,
  })
}

// Function to send ATM GO rejection email
export async function sendATMGORejectionEmail(
  application: ApplicationDetails,
  rejectionReason?: string,
  emailTemplate?: string,
  antiSpamFeatures?: {
    dkim: boolean
    spf: boolean
    personalizedSubject: boolean
    unsubscribeLink: boolean
    plainTextAlternative: boolean
  },
) {
  const userName = application.complete_name
  const businessName = application.business_name
  const currentYear = new Date().getFullYear()

  // Get the email template or use default
  const template =
    emailTemplate ||
    `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ATM GO Application Status Update</title>
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
      max-width: 650px;
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
      background: linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 35px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #444;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      background-color: #f9f9f9;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
    }
    .details-table th, .details-table td {
      padding: 14px 18px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .details-table th {
      background-color: #f9f0f2;
      font-weight: 600;
      width: 35%;
      color: #2c3e50;
    }
    .details-table tr:last-child td,
    .details-table tr:last-child th {
      border-bottom: none;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      font-size: 16px;
      letter-spacing: 0.5px;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
    }
    .info-box {
      background-color: #f9f0f2;
      border-left: 4px solid #fc5c7d;
      padding: 18px;
      margin: 25px 0;
      border-radius: 0 6px 6px 0;
    }
    .reapply-box {
      background-color: #f0f5ff;
      border-left: 4px solid #6a82fb;
      padding: 18px;
      margin: 25px 0;
      border-radius: 0 6px 6px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px;
      text-align: center;
      font-size: 14px;
      color: #555;
      border-top: 1px solid #e0e0e0;
    }
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 30px 0;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .contact-info {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
      font-size: 13px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo-container">
      ${
        application.merchant_logo_url
          ? `<img src="${application.merchant_logo_url}" alt="ATM GO Logo" class="logo">`
          : `<h2 style="color: #6a82fb; margin: 0; font-weight: 600;">ATM GO</h2>`
      }
    </div>
    <div class="header">
      <h1>Application Status Update</h1>
      <p>Important information about your application</p>
    </div>
    <div class="content">
      <p class="greeting">Dear ${userName},</p>
      <p>Thank you for your interest in ATM GO services for <strong>${businessName}</strong>. After careful review, we regret to inform you that your application has not been approved at this time.</p>
      
      <div class="info-box">
        <strong>Application Status:</strong>
        <p>Your application (ID: {{applicationId}}) has been reviewed and could not be approved based on our current requirements.</p>
        ${
          rejectionReason
            ? `
        <strong>Reason:</strong>
        <p>{{note}}</p>
        `
            : ""
        }
      </div>
      
      <h3>Application Details</h3>
      <table class="details-table">
        <tr>
          <th>Application ID</th>
          <td>{{applicationId}}</td>
        </tr>
        <tr>
          <th>Business Name</th>
          <td>{{businessName}}</td>
        </tr>
        <tr>
          <th>Industry</th>
          <td>{{businessIndustry}}</td>
        </tr>
        <tr>
          <th>Review Date</th>
          <td>{{reviewDate}}</td>
        </tr>
      </table>
      
      <div class="reapply-box">
        <p>If you believe there has been an error or if your circumstances change, you may be eligible to reapply after 30 days.</p>
      </div>
      
      <div class="divider"></div>
      
      <p>If you have any questions or need clarification regarding this decision, please contact our support team. We appreciate your understanding.</p>
      
      <div class="button-container">
        <a href="{{supportUrl}}" class="button">Contact Support</a>
      </div>
      
      <p>Best regards,<br><strong>ATM GO Team</strong></p>
      </div>
    <div class="footer">
      <p>&copy; {{year}} ATM GO. All rights reserved.</p>
      ${application.merchant_contact ? `<p>Support: {{merchantContact}}</p>` : ""}
      ${application.merchant_website ? `<p>Visit: <a href="{{merchantWebsite}}" style="color: #6a82fb;">{{merchantWebsite}}</a></p>` : ""}
      <div class="contact-info">
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  // Replace placeholders with actual values
  let html = template
    .replace(/{{userName}}/g, userName)
    .replace(/{{businessName}}/g, businessName)
    .replace(/{{applicationId}}/g, application.id.toString())
    .replace(/{{businessIndustry}}/g, application.business_industry || "Not Specified")
    .replace(/{{reviewDate}}/g, format(new Date(), "MMMM dd, yyyy"))
    .replace(/{{supportUrl}}/g, process.env.SUPPORT_URL || process.env.DASHBOARD_URL || "#")
    .replace(/{{year}}/g, currentYear.toString())

  // Add conditional replacements
  if (rejectionReason) {
    html = html.replace(/{{note}}/g, rejectionReason)
  }
  if (application.merchant_contact) {
    html = html.replace(/{{merchantContact}}/g, application.merchant_contact)
  }
  if (application.merchant_website) {
    html = html.replace(/{{merchantWebsite}}/g, application.merchant_website)
  }

  // Add unsubscribe link if requested
  const finalHtml = antiSpamFeatures?.unsubscribeLink
    ? html.replace(
        "</body>",
        `
      <div style="text-align: center; font-size: 12px; color: #666; margin-top: 20px; padding: 10px;">
        <p>If you no longer wish to receive these emails, you can <a href="mailto:unsubscribe@philtechbusiness.ph?subject=Unsubscribe&body=Please%20unsubscribe%20me%20from%20all%20future%20emails.">unsubscribe here</a>.</p>
      </div>
    </body>`,
      )
    : html

  return sendEmail({
    to: application.email,
    subject: `ATM GO Application #${application.id} - Status Update`,
    html: finalHtml,
    antiSpamFeatures,
    userName,
  })
}

// Function to send ATM GO pending review email
export async function sendATMGOPendingReviewEmail(
  application: ApplicationDetails,
  additionalInfo?: string,
  emailTemplate?: string,
  antiSpamFeatures?: {
    dkim: boolean
    spf: boolean
    personalizedSubject: boolean
    unsubscribeLink: boolean
    plainTextAlternative: boolean
  },
) {
  const userName = application.complete_name
  const businessName = application.business_name
  const currentYear = new Date().getFullYear()

  // Get the email template or use default
  const template =
    emailTemplate ||
    `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ATM GO Application Under Review</title>
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
      max-width: 650px;
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
      background: linear-gradient(135deg, #f7b733 0%, #fc4a1a 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 35px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #444;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      background-color: #f9f9f9;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
    }
    .details-table th, .details-table td {
      padding: 14px 18px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .details-table th {
      background-color: #fff8e8;
      font-weight: 600;
      width: 35%;
      color: #2c3e50;
    }
    .details-table tr:last-child td,
    .details-table tr:last-child th {
      border-bottom: none;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #f7b733 0%, #fc4a1a 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      font-size: 16px;
      letter-spacing: 0.5px;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
    }
    .info-box {
      background-color: #fff8e8;
      border-left: 4px solid #f7b733;
      padding: 18px;
      margin: 25px 0;
      border-radius: 0 6px 6px 0;
    }
    .timeline-box {
      background-color: #f0f8ff;
      border-left: 4px solid #5a7fd6;
      padding: 18px;
      margin: 25px 0;
      border-radius: 0 6px 6px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px;
      text-align: center;
      font-size: 14px;
      color: #555;
      border-top: 1px solid #e0e0e0;
    }
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 30px 0;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .timeline {
      list-style-type: none;
      padding-left: 0;
      position: relative;
      margin: 20px 0;
    }
    .timeline li {
      position: relative;
      padding-left: 35px;
      margin-bottom: 20px;
    }
    .timeline li:before {
      content: "";
      position: absolute;
      left: 0;
      top: 5px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background-color: #5a7fd6;
      z-index: 1;
    }
    .timeline li:after {
      content: "";
      position: absolute;
      left: 8px;
      top: 23px;
      height: calc(100% + 7px);
      border-left: 2px solid #5a7fd6;
    }
    .timeline li:last-child:after {
      display: none;
    }
    .highlight {
      background-color: #fff8e8;
      padding: 3px 6px;
      border-radius: 3px;
      font-weight: 500;
    }
    .contact-info {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
      font-size: 13px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo-container">
      ${
        application.merchant_logo_url
          ? `<img src="${application.merchant_logo_url}" alt="ATM GO Logo" class="logo">`
          : `<h2 style="color: #f7b733; margin: 0; font-weight: 600;">ATM GO</h2>`
      }
    </div>
    <div class="header">
      <h1>Application Under Review</h1>
      <p>Your application is being processed</p>
    </div>
    <div class="content">
      <p class="greeting">Dear ${userName},</p>
      <p>Thank you for your application to join the ATM GO network with your business <strong>${businessName}</strong>. We are writing to inform you that your application is currently <span class="highlight">UNDER REVIEW</span>.</p>
      
      <div class="info-box">
        <strong>Application Status:</strong>
        <p>Your application (ID: {{applicationId}}) has been received and is currently being reviewed by our team.</p>
        ${
          additionalInfo
            ? `
        <strong>Additional Information:</strong>
        <p>{{additionalInfo}}</p>
        `
            : ""
        }
      </div>
      
      <h3>Application Details</h3>
      <table class="details-table">
        <tr>
          <th>Application ID</th>
          <td>{{applicationId}}</td>
        </tr>
        <tr>
          <th>Business Name</th>
          <td>{{businessName}}</td>
        </tr>
        <tr>
          <th>Industry</th>
          <td>{{businessIndustry}}</td>
        </tr>
        <tr>
          <th>Submission Date</th>
          <td>{{submissionDate}}</td>
        </tr>
      </table>
      
      <div class="timeline-box">
        <h3>What Happens Next?</h3>
        <ul class="timeline">
          <li><strong>Initial Review</strong> - We're currently here</li>
          <li><strong>Document Verification</strong> - We'll verify all your submitted documents</li>
          <li><strong>Final Decision</strong> - You'll receive an approval or rejection notice</li>
          <li><strong>Onboarding</strong> - If approved, we'll guide you through the setup process</li>
        </ul>
      </div>
      
      <div class="divider"></div>
      
      <p>The review process typically takes <strong>3-5 business days</strong>. We appreciate your patience during this time. If we need any additional information, our team will contact you directly.</p>
      
      <div class="button-container">
        <a href="{{statusUrl}}" class="button">Check Application Status</a>
      </div>
      
      <p>If you have any questions about your application or need assistance, please don't hesitate to contact our support team.</p>
      
      <p>Thank you for your interest in ATM GO!</p>
      
      <p>Best regards,<br><strong>ATM GO Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; {{year}} ATM GO. All rights reserved.</p>
      ${application.merchant_contact ? `<p>Support: {{merchantContact}}</p>` : ""}
      ${application.merchant_website ? `<p>Visit: <a href="{{merchantWebsite}}" style="color: #f7b733;">{{merchantWebsite}}</a></p>` : ""}
      <div class="contact-info">
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  // Replace placeholders with actual values
  let html = template
    .replace(/{{userName}}/g, userName)
    .replace(/{{businessName}}/g, businessName)
    .replace(/{{applicationId}}/g, application.id.toString())
    .replace(/{{businessIndustry}}/g, application.business_industry || "Not Specified")
    .replace(/{{submissionDate}}/g, format(new Date(), "MMMM dd, yyyy"))
    .replace(/{{statusUrl}}/g, process.env.STATUS_URL || process.env.DASHBOARD_URL || "#")
    .replace(/{{year}}/g, currentYear.toString())

  // Add conditional replacements
  if (additionalInfo) {
    html = html.replace(/{{additionalInfo}}/g, additionalInfo)
  }
  if (application.merchant_contact) {
    html = html.replace(/{{merchantContact}}/g, application.merchant_contact)
  }
  if (application.merchant_website) {
    html = html.replace(/{{merchantWebsite}}/g, application.merchant_website)
  }

  // Add unsubscribe link if requested
  const finalHtml = antiSpamFeatures?.unsubscribeLink
    ? html.replace(
        "</body>",
        `
      <div style="text-align: center; font-size: 12px; color: #666; margin-top: 20px; padding: 10px;">
        <p>If you no longer wish to receive these emails, you can <a href="mailto:unsubscribe@philtechbusiness.ph?subject=Unsubscribe&body=Please%20unsubscribe%20me%20from%20all%20future%20emails.">unsubscribe here</a>.</p>
      </div>
    </body>`,
      )
    : html

  return sendEmail({
    to: application.email,
    subject: `ATM GO Application #${application.id} - Under Review`,
    html: finalHtml,
    antiSpamFeatures,
    userName,
  })
}

// Function to send ATM GO completed application email
export async function sendATMGOCompletedEmail(
  application: ApplicationDetails,
  emailTemplate?: string,
  antiSpamFeatures?: {
    dkim: boolean
    spf: boolean
    personalizedSubject: boolean
    unsubscribeLink: boolean
    plainTextAlternative: boolean
  },
) {
  const userName = application.complete_name
  const businessName = application.business_name
  const currentYear = new Date().getFullYear()

  // Get the email template or use default
  const template =
    emailTemplate ||
    `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ATM GO Setup Complete</title>
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
      max-width: 650px;
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
      background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 35px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #444;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      background-color: #f9f9f9;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
    }
    .details-table th, .details-table td {
      padding: 14px 18px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .details-table th {
      background-color: #e6f7f2;
      font-weight: 600;
      width: 35%;
      color: #2c3e50;
    }
    .details-table tr:last-child td,
    .details-table tr:last-child th {
      border-bottom: none;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      font-size: 16px;
      letter-spacing: 0.5px;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
    }
    .info-box {
      background-color: #e6f7f2;
      border-left: 4px solid #43cea2;
      padding: 18px;
      margin: 25px 0;
      border-radius: 0 6px 6px 0;
    }
    .next-steps-box {
      background-color: #f0f8ff;
      border-left: 4px solid #185a9d;
      padding: 18px;
      margin: 25px 0;
      border-radius: 0 6px 6px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px;
      text-align: center;
      font-size: 14px;
      color: #555;
      border-top: 1px solid #e0e0e0;
    }
    .highlight {
      background-color: #e6f7f2;
      padding: 3px 6px;
      border-radius: 3px;
      font-weight: 500;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 30px 0;
    }
    .atm-serial {
      font-family: monospace;
      font-size: 110%;
      padding: 8px 12px;
      background-color: #f2f2f2;
      border-radius: 4px;
      border: 1px solid #ddd;
      display: inline-block;
      margin: 8px 0;
      letter-spacing: 1px;
    }
    .contact-info {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
      font-size: 13px;
      color: #777;
    }
    .success-icon {
      text-align: center;
      margin: 20px 0;
      font-size: 48px;
      color: #43cea2;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo-container">
      ${
        application.merchant_logo_url
          ? `<img src="${application.merchant_logo_url}" alt="ATM GO Logo" class="logo">`
          : `<h2 style="color: #185a9d; margin: 0; font-weight: 600;">ATM GO</h2>`
      }
    </div>
    <div class="header">
      <h1>Setup Complete</h1>
      <p>Your ATM GO device is ready for use</p>
    </div>
    <div class="content">
      <div class="success-icon">✓</div>
      <p class="greeting">Congratulations, ${userName}!</p>
      <p>We are pleased to inform you that your ATM GO application for <strong>${businessName}</strong> is now <span class="highlight">COMPLETED</span> and your device is ready for use!</p>
      
      <div class="info-box">
        <strong>Setup Complete:</strong>
        <p>Your ATM GO device has been successfully provisioned and is now activated for your business.</p>
        ${
          application.atm_serial_number
            ? `
        <strong>Your ATM Serial Number:</strong>
        <p class="atm-serial">{{atmSerialNumber}}</p>
        <p style="font-size: 14px; color: #666;">Please keep this number for your records. You'll need it when contacting support.</p>
        `
            : ""
        }
      </div>
      
      <h3>Application Details</h3>
      <table class="details-table">
        <tr>
          <th>Application ID</th>
          <td>{{applicationId}}</td>
        </tr>
        <tr>
          <th>Business Name</th>
          <td>{{businessName}}</td>
        </tr>
        <tr>
          <th>Industry</th>
          <td>{{businessIndustry}}</td>
        </tr>
        <tr>
          <th>Completion Date</th>
          <td>{{completionDate}}</td>
        </tr>
      </table>
      
      <div class="divider"></div>
      
      <div class="next-steps-box">
        <h3>Getting Started</h3>
        <p>Here's what you need to know to begin using your ATM GO service:</p>
        <ul>
          <li><strong>Support Hotline:</strong> Call our dedicated merchant support line for assistance</li>
          <li><strong>First Transactions:</strong> Follow the quick-start guide included with your device</li>
          <li><strong>Merchant Dashboard:</strong> Access your transaction history and reports online</li>
          <li><strong>Technical Support:</strong> Available 7 days a week from 8am to 8pm</li>
        </ul>
      </div>
      
      <div class="button-container">
        <a href="{{dashboardUrl}}" class="button">Access Your Dashboard</a>
      </div>
      
      <p>Thank you for choosing ATM GO as your financial service partner. We're excited to help your business grow!</p>
      
      <p>Best regards,<br><strong>ATM GO Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; {{year}} ATM GO. All rights reserved.</p>
      ${application.merchant_contact ? `<p>Support: {{merchantContact}}</p>` : ""}
      ${application.merchant_website ? `<p>Visit: <a href="{{merchantWebsite}}" style="color: #185a9d;">{{merchantWebsite}}</a></p>` : ""}
      <div class="contact-info">
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `

  // Replace placeholders with actual values
  let html = template
    .replace(/{{userName}}/g, userName)
    .replace(/{{businessName}}/g, businessName)
    .replace(/{{applicationId}}/g, application.id.toString())
    .replace(/{{businessIndustry}}/g, application.business_industry || "Not Specified")
    .replace(/{{completionDate}}/g, format(new Date(), "MMMM dd, yyyy"))
    .replace(/{{dashboardUrl}}/g, process.env.DASHBOARD_URL || "#")
    .replace(/{{year}}/g, currentYear.toString())

  // Add conditional replacements
  if (application.atm_serial_number) {
    html = html.replace(/{{atmSerialNumber}}/g, application.atm_serial_number)
  }
  if (application.merchant_contact) {
    html = html.replace(/{{merchantContact}}/g, application.merchant_contact)
  }
  if (application.merchant_website) {
    html = html.replace(/{{merchantWebsite}}/g, application.merchant_website)
  }

  // Add unsubscribe link if requested
  const finalHtml = antiSpamFeatures?.unsubscribeLink
    ? html.replace(
        "</body>",
        `
        <div style="text-align: center; font-size: 12px; color: #666; margin-top: 20px; padding: 10px;">
          <p>If you no longer wish to receive these emails, you can <a href="mailto:unsubscribe@philtechbusiness.ph?subject=Unsubscribe&body=Please%20unsubscribe%20me%20from%20all%20future%20emails.">unsubscribe here</a>.</p>
        </div>
      </body>`,
      )
    : html

  return sendEmail({
    to: application.email,
    subject: `ATM GO Application #${application.id} - Setup Complete`,
    html: finalHtml,
    antiSpamFeatures,
    userName,
  })
}

export default sendATMGOApprovalEmail
