"use server"

import nodemailer from "nodemailer"
import { convert } from "html-to-text"

type TransferEmailData = {
  senderEmail: string
  senderName: string
  recipientEmail: string
  recipientName: string
  amount: number
  serviceFee?: number
  date: Date
  note?: string
  newSenderBalance: number
  transactionReference: string
  isIncoming?: boolean // To determine if it's a sent or received notification
}

/**
 * Sends email notification for credit transfers
 * @param data Information about the credit transfer
 * @returns Email send result
 */
export async function sendCreditTransferEmail(data: TransferEmailData) {
  const {
    senderEmail,
    senderName,
    recipientEmail,
    recipientName,
    amount,
    serviceFee = 0,
    date,
    note,
    newSenderBalance,
    transactionReference,
    isIncoming = false
  } = data

  try {
    // Format values for display
    const formattedAmount = amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
    const formattedServiceFee = serviceFee.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
    const formattedDate = date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    const formattedBalance = newSenderBalance.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })

    // Determine which email template to use based on whether it's a send or receive notification
    const emailTemplate = isIncoming ? getReceivedEmailTemplate() : getSentEmailTemplate()

    // Replace placeholders in the template
    const html = emailTemplate
      .replace(/{{senderName}}/g, senderName)
      .replace(/{{recipientName}}/g, recipientName)
      .replace(/{{amount}}/g, formattedAmount)
      .replace(/{{serviceFee}}/g, formattedServiceFee)
      .replace(/{{formattedDate}}/g, formattedDate)
      .replace(/{{note}}/g, note || 'No note provided')
      .replace(/{{newBalance}}/g, formattedBalance)
      .replace(/{{transactionReference}}/g, transactionReference)
      .replace(/{{year}}/g, new Date().getFullYear().toString())

    // Determine the recipient of this email notification
    const emailRecipient = isIncoming ? recipientEmail : senderEmail
    
    // Determine subject line based on notification type
    const subject = isIncoming 
      ? `You've Received ${formattedAmount} Credits from ${senderName}`
      : `Credit Transfer Confirmation: ${formattedAmount} Sent to ${recipientName}`

    // Create plain text version for better email deliverability
    const plainText = convert(html, {
      wordwrap: 130,
      selectors: [
        { selector: 'img', format: 'skip' },
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } }
      ]
    })

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "mail.philtechbusiness.ph",
      port: 465,
      secure: true, // true for SSL
      auth: {
        user: process.env.BLUEHOST_EMAIL || "myservices@philtechbusiness.ph",
        pass: process.env.BLUEHOST_PASS || "PtG#1717@2025!",
      },
      // Enable DKIM if available
      ...(process.env.BLUEHOST_DKIM_PRIVATE_KEY && {
        dkim: {
          domainName: "philtechbusiness.ph",
          keySelector: "default",
          privateKey: process.env.BLUEHOST_DKIM_PRIVATE_KEY,
        },
      }),
    })

    // Prepare email options
    const emailOptions = {
      from: {
        name: "PHILTECH Business Group",
        address: process.env.BLUEHOST_EMAIL || "myservices@philtechbusiness.ph",
      },
      to: emailRecipient,
      subject: subject,
      html: html,
      text: plainText, // Include plain text alternative
      headers: {
        "List-Unsubscribe": `<mailto:unsubscribe@philtechbusiness.ph?subject=Unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "X-SPF": "pass" // Add SPF verification
      }
    }

    // Send the email
    const info = await transporter.sendMail(emailOptions)

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Error sending credit transfer email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending email",
    }
  }
}

/**
 * Send both sender and recipient notifications for a credit transfer
 * @param params Transfer details needed for the notifications
 * @returns Result of both email sending operations
 */
export async function sendCreditTransferNotifications(params: {
  senderId: number,
  senderEmail: string,
  senderName: string,
  recipientId: number,
  recipientEmail: string,
  recipientName: string,
  amount: number,
  serviceFee?: number,
  note?: string,
  newSenderBalance: number,
  transactionReference: string
}) {
  const { 
    senderEmail, 
    senderName, 
    recipientEmail, 
    recipientName, 
    amount, 
    serviceFee, 
    note, 
    newSenderBalance, 
    transactionReference 
  } = params;
  
  const currentDate = new Date();
  
  try {
    // Send notification to sender (outgoing transfer)
    const senderNotification = await sendCreditTransferEmail({
      senderEmail,
      senderName,
      recipientEmail,
      recipientName,
      amount,
      serviceFee,
      date: currentDate,
      note,
      newSenderBalance,
      transactionReference,
      isIncoming: false
    });
    
    // Send notification to recipient (incoming transfer)
    const recipientNotification = await sendCreditTransferEmail({
      senderEmail,
      senderName,
      recipientEmail,
      recipientName,
      amount,
      serviceFee,
      date: currentDate,
      note,
      newSenderBalance: 0, // Not relevant for recipient
      transactionReference,
      isIncoming: true
    });
    
    return {
      success: senderNotification.success && recipientNotification.success,
      senderNotification,
      recipientNotification
    };
  } catch (error) {
    console.error("Error sending credit transfer notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending notifications"
    };
  }
}

/**
 * Email template for sender (outgoing transfer)
 */
function getSentEmailTemplate() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credit Transfer Confirmation</title>
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
      width: 40%;
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
    .note-box {
      background-color: #f8f8f8;
      border-left: 4px solid #3f87d6;
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
    .success-icon {
      font-size: 48px;
      color: #4CAF50;
      text-align: center;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo-container">
      <img src="https://philtechbusiness.ph/wp-content/uploads/2023/06/20000-X-5000-TRANSPARENT13.png" alt="PHILTECH BUSINESS GROUP Logo" class="logo">
    </div>
    <div class="header">
      <h1>Credit Transfer Confirmation</h1>
    </div>
    <div class="content">
      <div class="success-icon">✓</div>
      <p class="greeting">Dear {{senderName}},</p>
      <p>Your credit transfer has been <span class="highlight">successfully completed</span>. Here are the details of your transaction:</p>
      
      <table class="details-table">
        <tr><th>Recipient</th><td>{{recipientName}}</td></tr>
        <tr><th>Amount Sent</th><td>{{amount}}</td></tr>
        <tr><th>Service Fee</th><td>{{serviceFee}}</td></tr>
        <tr><th>Transaction Date</th><td>{{formattedDate}}</td></tr>
        <tr><th>Transaction Reference</th><td>{{transactionReference}}</td></tr>
        <tr><th>New Balance</th><td>{{newBalance}}</td></tr>
      </table>

      <div class="note-box">
        <p><strong>Your Note:</strong></p>
        <p style="font-style: italic;">{{note}}</p>
      </div>

      <p>If you didn't authorize this transfer or notice any discrepancies, please contact our support team immediately.</p>
      
      <div class="button-container">
        <a href="https://app.philtechbusiness.ph/user-dashboard" class="button">View Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{year}} PHILTECH BUSINESS GROUP. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Email template for recipient (incoming transfer)
 */
function getReceivedEmailTemplate() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credits Received</title>
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
      background-color: #4CAF50;
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
      background-color: #e8f5e9;
      font-weight: 600;
      width: 40%;
      color: #333;
    }
    .button {
      display: inline-block;
      background-color: #4CAF50;
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
      background-color: #43a047;
    }
    .note-box {
      background-color: #f8f8f8;
      border-left: 4px solid #4CAF50;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    .footer {
      background-color: #e8f5e9;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #333;
    }
    .highlight {
      background-color: #e8f5e9;
      padding: 2px 4px;
      border-radius: 2px;
      color: #2e7d32;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .amount-display {
      font-size: 32px;
      font-weight: bold;
      color: #4CAF50;
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo-container">
      <img src="https://philtechbusiness.ph/wp-content/uploads/2023/06/20000-X-5000-TRANSPARENT13.png" alt="PHILTECH BUSINESS GROUP Logo" class="logo">
    </div>
    <div class="header">
      <h1>You've Received Credits!</h1>
    </div>
    <div class="content">
      <p class="greeting">Dear {{recipientName}},</p>
      <p>Good news! <span class="highlight">{{senderName}}</span> has sent you credits to your account.</p>
      
      <div class="amount-display">{{amount}}</div>
      
      <table class="details-table">
        <tr><th>Sent By</th><td>{{senderName}}</td></tr>
        <tr><th>Amount Received</th><td>{{amount}}</td></tr>
        <tr><th>Transaction Date</th><td>{{formattedDate}}</td></tr>
        <tr><th>Transaction Reference</th><td>{{transactionReference}}</td></tr>
      </table>

      <div class="note-box">
        <p><strong>Note from {{senderName}}:</strong></p>
        <p style="font-style: italic;">{{note}}</p>
      </div>

      <p>The credits have been added to your account balance and are available for immediate use.</p>
      
      <div class="button-container">
        <a href="https://app.philtechbusiness.ph/user-dashboard" class="button">View My Balance</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{year}} PHILTECH BUSINESS GROUP. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `
}