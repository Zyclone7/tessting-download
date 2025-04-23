"use server";

import { prisma } from "@/lib/prisma-singleton";
import nodemailer from "nodemailer";

// Email template for multiple vouchers
const createMultiVoucherEmail = (
  voucherRows: string,
  product_code: string,
  stocks: number,
  totalAmount: number,
  payment_method: string,
  basePrice = 0,
  serviceFee = 0,
  phoneNumber = ""
) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TV Subscription Purchase Confirmation</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f5f5f5; 
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff; 
      box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
      border-radius: 8px; 
      overflow: hidden; 
    }
    .logo-section {
      text-align: center;
      padding: 30px;
      background-color: #afdaf5;
      border-bottom: 1px solid #e0e0e0;
    }
    .logo {
      max-width: 300px;
      height: auto;
    }
    .header {
      background: linear-gradient(135deg, #3c89d6 0%, #afdaf5 100%);
      padding: 25px;
      text-align: center;
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
    }
    .header p {
      margin: 10px 0 0;
      font-size: 18px;
    }
    .content {
      padding: 30px;
    }
    .summary {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 25px;
      border-left: 4px solid #3c89d6;
    }
    .summary h3 {
      margin-top: 0;
      color: #3c89d6;
    }
    .summary p {
      margin: 8px 0;
      font-size: 16px;
      line-height: 1.5;
    }
    .voucher-details h2 {
      color: #3c89d6;
      border-bottom: 2px solid #afdaf5;
      padding-bottom: 10px;
      margin-top: 0;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border-radius: 6px;
      overflow: hidden;
      table-layout: fixed; /* Added for better mobile display */
    }
    .details-table th, .details-table td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: center;
      word-wrap: break-word; /* Added to handle long text */
    }
    .details-table th {
      background-color: #3c89d6;
      color: #fff;
      font-weight: 600;
    }
    .details-table tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    .details-table tr:nth-child(odd) {
      background-color: #ffffff;
    }
    .details-table tr:hover {
      background-color: #afdaf5;
      transition: background-color 0.3s ease;
    }
    .btn-container {
      margin: 30px 0;
      text-align: center;
    }
    .btn-activate {
      background-color: #3c89d6;
      color: white;
      padding: 14px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      font-size: 16px;
      display: inline-block;
      mso-padding-alt: 14px 30px;
      mso-line-height-rule: exactly;
      transition: background-color 0.3s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .btn-activate:hover {
      background-color: #2a6db3;
    }
    .btn-fallback {
      margin-top: 12px;
      font-size: 14px;
      color: #666;
    }
    .btn-fallback a {
      color: #3c89d6;
      text-decoration: none;
    }
    .warning {
      background-color: #fff8f8;
      border-left: 4px solid #e53e3e;
      padding: 15px;
      margin: 25px 0;
      border-radius: 0 4px 4px 0;
    }
    .warning p {
      color: #e53e3e;
      font-weight: bold;
      margin: 0;
      font-size: 16px;
    }
    .footer {
      margin-top: 30px;
      padding: 25px;
      background-color: #afdaf5;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #333;
    }
    .footer a {
      color: #3c89d6;
      text-decoration: none;
      font-weight: bold;
    }
    .usage-instructions {
      margin-top: 40px;
      background-color: #f5f9ff;
      border-radius: 8px;
      padding: 25px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .usage-instructions h3 {
      color: #3c89d6;
      margin-top: 0;
      margin-bottom: 20px;
      text-align: center;
      font-size: 22px;
      border-bottom: 2px solid #afdaf5;
      padding-bottom: 10px;
    }
    .instruction-card {
      background-color: white;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .instruction-step {
      display: flex;
      padding: 20px;
      border-bottom: 1px solid #eaeaea;
    }
    .instruction-step:last-child {
      border-bottom: none;
    }
    .step-number {
      background-color: #3c89d6;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .step-content {
      flex: 1;
    }
    .step-content h4 {
      margin-top: 0;
      margin-bottom: 10px;
      color: #333;
    }
    .note {
      color: #666;
      font-style: italic;
      margin-bottom: 15px;
    }
    .download-links {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 10px;
    }
    .download-link {
      display: flex;
      align-items: center;
      background-color: #f0f7ff;
      padding: 10px 15px;
      border-radius: 6px;
      text-decoration: none;
      color: #3c89d6;
      font-weight: 500;
      transition: background-color 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .download-link:hover {
      background-color: #e0f0ff;
    }
    .icon {
      margin-right: 8px;
      font-size: 18px;
    }
    .steps-list {
      margin: 0;
      padding-left: 20px;
    }
    .steps-list li {
      margin-bottom: 8px;
      color: #444;
    }
    .steps-list li:last-child {
      margin-bottom: 0;
    }
    
    /* Enhanced Mobile Responsiveness */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      .content {
        padding: 15px !important;
      }
      .logo-section {
        padding: 20px !important;
      }
      .logo {
        max-width: 80% !important;
      }
      .header {
        padding: 20px 15px !important;
      }
      .header h1 {
        font-size: 24px !important;
      }
      .header p {
        font-size: 16px !important;
      }
      
      /* Table Responsiveness */
      .details-table {
        display: block !important;
        width: 100% !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
      }
      .details-table th {
        min-width: 100px !important;
      }
      .details-table th:first-child {
        min-width: 50px !important;
      }
      
      /* Other Mobile Adjustments */
      .summary {
        padding: 15px !important;
      }
      .usage-instructions {
        padding: 15px !important;
      }
      .instruction-step {
        padding: 15px !important;
        flex-direction: column !important;
      }
      .step-number {
        margin-bottom: 10px !important;
        margin-right: 0 !important;
      }
      .download-links {
        flex-direction: column !important;
        gap: 10px !important;
      }
      .warning p {
        font-size: 14px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo-section">
      <img src="https://philtechbusiness.ph/wp-content/uploads/2023/06/20000-X-5000-TRANSPARENT13.png" alt="PHILTECH BUSINESS GROUP Logo" class="logo">
    </div>
    
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <p>Your TV Subscription Purchase is Successful</p>
    </div>
    
    <div class="content">
      <div class="summary">
        <h3>Purchase Summary:</h3>
        <p><strong>Package:</strong> ${product_code}</p>
        <p><strong>Quantity:</strong> ${stocks} subscription(s)</p>
        <p><strong>Total Amount:</strong> ₱${totalAmount}</p>
        <p><strong>Payment Method:</strong> ${payment_method}</p>
        ${
          phoneNumber
            ? `<p><strong>Phone Number:</strong> ${phoneNumber}</p>`
            : ""
        }
      </div>
      
      <div class="voucher-details">
        <h2>Your TV Subscription Details:</h2>
        <table class="details-table" cellspacing="0" cellpadding="0" border="0" width="100%">
          <thead>
            <tr>
              <th>Package</th>
              <th>Card Number</th>
              <th>Voucher Code</th>
            </tr>
          </thead>
          <tbody>
            ${voucherRows}
          </tbody>
        </table>
      </div>
      
      <div class="warning">
        <p>IMPORTANT: Keep your subscription details secure. Do not share them with anyone.</p>
      </div>
      
      <div class="usage-instructions">
        <h3>How to use the TV voucher?</h3>
        <div class="instruction-card">
          <div class="instruction-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Download and install the APK</h4>
              <p class="note">(For Android Cellphone & Android TV only)</p>
              <div class="download-links">
                <a href="https://stb.filitv.net/meta2" class="download-link">
                  <span class="icon">🖥️</span>
                  <span class="link-text">TV version</span>
                </a>
                <a href="https://mobile.filitv.net/meta2" class="download-link">
                  <span class="icon">📲</span>
                  <span class="link-text">Mobile version</span>
                </a>
              </div>
            </div>
          </div>
          <div class="instruction-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Activate your subscription</h4>
              <ul class="steps-list">
                <li>If you have installed it already, copy the voucher code</li>
                <li>Open the Fili App</li>
                <li>Go to profile and click <strong>RECHARGE</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>© ${new Date().getFullYear()} PHILTECH BUSINESS GROUP</strong></p>
      <p>For support, contact <a href="mailto:support@philtechbusiness.ph">support@philtechbusiness.ph</a></p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;
};

// For single voucher email template
const createSingleVoucherEmail = (
  voucher: any,
  totalAmount: number,
  basePrice: number,
  serviceFee: number,
  phoneNumber = ""
) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TV Subscription Purchase Confirmation</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f5f5f5; 
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff; 
      box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
      border-radius: 8px; 
      overflow: hidden; 
    }
    .logo-section {
      text-align: center;
      padding: 30px;
      background-color: #afdaf5;
      border-bottom: 1px solid #e0e0e0;
    }
    .logo {
      max-width: 300px;
      height: auto;
    }
    .header {
      background: linear-gradient(135deg, #3c89d6 0%, #afdaf5 100%);
      padding: 25px;
      text-align: center;
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
    }
    .header p {
      margin: 10px 0 0;
      font-size: 18px;
    }
    .content {
      padding: 30px;
    }
    .voucher-details h2 {
      color: #3c89d6;
      border-bottom: 2px solid #afdaf5;
      padding-bottom: 10px;
      margin-top: 0;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border-radius: 6px;
      overflow: hidden;
      table-layout: fixed; /* Added for better mobile display */
    }
    .details-table th, .details-table td {
      border: 1px solid #ddd;
      padding: 12px;
      word-wrap: break-word; /* Added to handle long text */
    }
    .details-table th {
      background-color: #3c89d6;
      color: #fff;
      width: 40%;
      font-weight: 600;
      text-align: left;
    }
    .details-table td {
      background-color: #fafafa;
    }
    .code-highlight {
      background-color: #e8f5e9;
      border-left: 4px solid #3c89d6;
      padding: 15px;
      margin: 20px 0;
      font-size: 18px;
      text-align: center;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .code-highlight strong {
      color: #3c89d6;
      letter-spacing: 1px;
    }
    .warning {
      background-color: #fff8f8;
      border-left: 4px solid #e53e3e;
      padding: 15px;
      margin: 25px 0;
      border-radius: 0 4px 4px 0;
    }
    .warning p {
      color: #e53e3e;
      font-weight: bold;
      margin: 0;
      font-size: 16px;
    }
    .btn-container {
      margin: 30px 0;
      text-align: center;
    }
    .btn-activate {
      background-color: #3c89d6;
      color: white;
      padding: 14px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      font-size: 16px;
      display: inline-block;
      mso-padding-alt: 14px 30px;
      mso-line-height-rule: exactly;
      transition: background-color 0.3s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .btn-activate:hover {
      background-color: #2a6db3;
    }
    .btn-fallback {
      margin-top: 12px;
      font-size: 14px;
      color: #666;
    }
    .btn-fallback a {
      color: #3c89d6;
      text-decoration: none;
    }
    .footer {
      margin-top: 30px;
      padding: 25px;
      background-color: #afdaf5;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #333;
    }
    .footer a {
      color: #3c89d6;
      text-decoration: none;
      font-weight: bold;
    }
    .usage-instructions {
      margin-top: 40px;
      background-color: #f5f9ff;
      border-radius: 8px;
      padding: 25px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .usage-instructions h3 {
      color: #3c89d6;
      margin-top: 0;
      margin-bottom: 20px;
      text-align: center;
      font-size: 22px;
      border-bottom: 2px solid #afdaf5;
      padding-bottom: 10px;
    }
    .instruction-card {
      background-color: white;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .instruction-step {
      display: flex;
      padding: 20px;
      border-bottom: 1px solid #eaeaea;
    }
    .instruction-step:last-child {
      border-bottom: none;
    }
    .step-number {
      background-color: #3c89d6;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .step-content {
      flex: 1;
    }
    .step-content h4 {
      margin-top: 0;
      margin-bottom: 10px;
      color: #333;
    }
    .note {
      color: #666;
      font-style: italic;
      margin-bottom: 15px;
    }
    .download-links {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 10px;
    }
    .download-link {
      display: flex;
      align-items: center;
      background-color: #f0f7ff;
      padding: 10px 15px;
      border-radius: 6px;
      text-decoration: none;
      color: #3c89d6;
      font-weight: 500;
      transition: background-color 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .download-link:hover {
      background-color: #e0f0ff;
    }
    .icon {
      margin-right: 8px;
      font-size: 18px;
    }
    .steps-list {
      margin: 0;
      padding-left: 20px;
    }
    .steps-list li {
      margin-bottom: 8px;
      color: #444;
    }
    .steps-list li:last-child {
      margin-bottom: 0;
    }
    
    /* Enhanced Mobile Responsiveness */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      .content {
        padding: 15px !important;
      }
      .logo-section {
        padding: 20px !important;
      }
      .logo {
        max-width: 80% !important;
      }
      .header {
        padding: 20px 15px !important;
      }
      .header h1 {
        font-size: 24px !important;
      }
      .header p {
        font-size: 16px !important;
      }
      
      /* Table Responsiveness */
      .details-table {
        display: block !important;
        width: 100% !important;
      }
      .details-table thead, 
      .details-table tbody, 
      .details-table th, 
      .details-table td, 
      .details-table tr {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .details-table th {
        text-align: left !important;
        border-bottom: none !important;
        border-top-left-radius: 6px !important;
        border-top-right-radius: 6px !important;
      }
      .details-table td {
        border-top: none !important;
        text-align: left !important;
        padding-top: 8px !important;
        padding-bottom: 16px !important;
        margin-bottom: 8px !important;
        border-bottom-left-radius: 6px !important;
        border-bottom-right-radius: 6px !important;
      }
      .details-table tr {
        margin-bottom: 15px !important;
        border-radius: 6px !important;
        overflow: hidden !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
      }
      
      /* Other Mobile Adjustments */
      .code-highlight {
        padding: 10px !important;
        font-size: 16px !important;
      }
      .usage-instructions {
        padding: 15px !important;
      }
      .instruction-step {
        padding: 15px !important;
        flex-direction: column !important;
      }
      .step-number {
        margin-bottom: 10px !important;
        margin-right: 0 !important;
      }
      .download-links {
        flex-direction: column !important;
        gap: 10px !important;
      }
      .warning p {
        font-size: 14px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo-section">
      <img src="https://philtechbusiness.ph/wp-content/uploads/2023/06/20000-X-5000-TRANSPARENT13.png" alt="PHILTECH BUSINESS GROUP Logo" class="logo">
    </div>
    
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <p>Your TV Subscription Purchase is Successful</p>
    </div>
    
    <div class="content">
      <div class="voucher-details">
        <h2>TV Subscription Details:</h2>
        <div class="code-highlight">
          <p>Your Voucher Code: <strong>${voucher.voucher_code}</strong></p>
        </div>
        <table class="details-table" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr><th>Package</th><td>${voucher.product_name}</td></tr>
          <tr><th>Card Number</th><td>${voucher.card_number}</td></tr>
          <tr><th>Voucher Code</th><td>${voucher.voucher_code}</td></tr>
          ${
            phoneNumber
              ? `<tr><th>Phone Number</th><td>${phoneNumber}</td></tr>`
              : ""
          }
          <tr><th>Total Amount</th><td>₱${totalAmount}</td></tr>
        </table>
      </div>
      
      <div class="warning">
        <p>IMPORTANT: Keep your subscription details secure. Do not share them with anyone.</p>
      </div>
      
      <div class="usage-instructions">
        <h3>How to use the TV voucher?</h3>
        <div class="instruction-card">
          <div class="instruction-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Download and install the APK</h4>
              <p class="note">(For Android Cellphone & Android TV only)</p>
              <div class="download-links">
                <a href="https://stb.filitv.net/meta2" class="download-link">
                  <span class="icon">🖥️</span>
                  <span class="link-text">TV version</span>
                </a>
                <a href="https://mobile.filitv.net/meta2" class="download-link">
                  <span class="icon">📲</span>
                  <span class="link-text">Mobile version</span>
                </a>
              </div>
            </div>
          </div>
          <div class="instruction-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Activate your subscription</h4>
              <ul class="steps-list">
                <li>If you have installed it already, copy the voucher code</li>
                <li>Open the Fili App</li>
                <li>Go to profile and click <strong>RECHARGE</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>© ${new Date().getFullYear()} PHILTECH BUSINESS GROUP</strong></p>
      <p>For support, contact <a href="mailto:support@philtechbusiness.ph">support@philtechbusiness.ph</a></p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;
};

// Email sending function
const sendBulkEmail = async (
  toEmail: string,
  emailBody: string,
  subject = "TV Subscription Purchase Successful"
) => {
  const transporter = nodemailer.createTransport({
    host: "mail.philtechbusiness.ph",
    port: 465,
    secure: true,
    auth: {
      user: process.env.BLUEHOST_EMAIL,
      pass: process.env.BLUEHOST_PASS,
    },
  });

  const mailOptions: any = {
    from: {
      name: "PHILTECH BUSINESS GROUP",
      address: process.env.BLUEHOST_EMAIL as string,
    },
    to: toEmail,
    subject: subject,
    text: emailBody,
    html: emailBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email to ${toEmail}`);
  }
};

// Server action for assigning TV vouchers with service fee
export async function assignTvVouchers(formData: FormData) {
  try {
    const user_id = formData.get("user_id") as string;
    const product_code = formData.get("product_code") as string;
    const email = formData.get("email") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const stocks = Number.parseInt(formData.get("stocks") as string, 10);
    const payment_method = formData.get("payment_method") as string;
    const proof_of_payment = formData.get("proof_of_payment") as string;

    // Batch processing configuration - handles 5 vouchers at a time to stay within time limits
    const batchIndex = Number.parseInt(
      (formData.get("batchIndex") as string) || "0",
      10
    );
    const batchSize = 5; // Process 5 vouchers at a time to avoid timeout
    const isFirstBatch = batchIndex === 0;
    const processedVouchers = JSON.parse(
      (formData.get("processedVouchers") as string) || "[]"
    );

    // Fix: Parse the price as a float and ensure it has 2 decimal places
    const priceString = formData.get("price") as string;
    const discount = Number.parseFloat(
      (formData.get("discount") as string) || "0"
    );
    const price = priceString
      ? Number.parseFloat(Number.parseFloat(priceString).toFixed(2))
      : 0;

    const service_fee = Number.parseFloat(
      Number.parseFloat((formData.get("service_fee") as string) || "0").toFixed(
        2
      )
    );

    const base_price = Number.parseFloat(
      Number.parseFloat((formData.get("base_price") as string) || "0").toFixed(
        2
      )
    );

    const total_price = Number.parseFloat(
      Number.parseFloat(
        (formData.get("total_amount") as string) || "0"
      ).toFixed(2)
    );

    if (!user_id || !product_code || !email || isNaN(stocks)) {
      return {
        success: false,
        message: "Missing required parameters.",
      };
    }

    // Get user information including role
    const user = await prisma.pt_users.findUnique({
      where: { ID: Number.parseInt(user_id, 10) },
      select: {
        user_credits: true,
        user_role: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const productType = "tv";
    const userRole = user.user_role || "Basic Merchant"; // Default role if none is set

    // Get product base price and role-based discounted price
    const productInfo = await prisma.pt_products.findUnique({
      where: { product_code, product_type: productType },
      include: {
        pt_product_role_prices: {
          where: { role: userRole, product_type: productType },
        },
      },
    });

    // Use provided price or fallback to product info
    let voucherPrice = price;
    if (!voucherPrice && productInfo) {
      if (
        productInfo.pt_product_role_prices.length > 0 &&
        productInfo.pt_product_role_prices[0].discounted_price !== null
      ) {
        // Use role-based discounted price
        voucherPrice = Number.parseFloat(
          productInfo.pt_product_role_prices[0].discounted_price!.toFixed(2)
        );
      } else {
        // Use base price if no role-specific price is found
        voucherPrice = Number.parseFloat(
          (productInfo?.base_price || 0).toFixed(2)
        );
      }
    }

    const voucherSubtotal = Number.parseFloat(
      (voucherPrice * stocks).toFixed(2)
    );
    const totalAmount = Number.parseFloat(
      (voucherSubtotal + service_fee).toFixed(2)
    ); // Total with service fee

    // Calculate how many vouchers are left to process
    const remainingStocks = stocks - processedVouchers.length;

    // If no vouchers left to process, we're done
    if (remainingStocks <= 0) {
      // Send email with all processed vouchers
      await sendVoucherEmails(
        email,
        processedVouchers,
        product_code,
        stocks,
        total_price,
        payment_method,
        voucherPrice,
        service_fee,
        phoneNumber,
        base_price
      );

      return {
        success: true,
        message:
          "All TV subscriptions assigned, credits deducted, and emails sent successfully.",
        data: processedVouchers,
        completed: true,
      };
    }

    // Calculate how many vouchers to process in this batch
    const currentBatchSize = Math.min(batchSize, remainingStocks);

    // Check for sufficient voucher stock for this batch
    const vouchers = await prisma.pt_tv_voucher.findMany({
      where: {
        product_name: product_code,
        owned_by: null,
      },
      take: currentBatchSize,
    });

    if (vouchers.length === 0) {
      return {
        success: false,
        message: `No TV subscriptions are available.`,
      };
    }

    if (vouchers.length < currentBatchSize) {
      return {
        success: false,
        message: `Only ${vouchers.length} TV subscriptions are available. Requested: ${remainingStocks}`,
      };
    }

    // Begin transaction to ensure both voucher assignment and credit deduction are atomic
    const result = await prisma.$transaction(async (prisma) => {
      // If payment method is credits and this is the first batch, check and update user credits
      if (payment_method === "credits" && isFirstBatch) {
        // Get user's current credit balance
        const currentCredits = Number.parseFloat(
          user.user_credits?.toString() || "0"
        );

        // Check if user has enough credits for voucher subtotal (not including service fee)
        if (currentCredits < voucherSubtotal) {
          throw new Error("Insufficient credits for this purchase.");
        }

        // Deduct credits from user's account (only deduct the voucher price, not service fee)
        await prisma.pt_users.update({
          where: { ID: Number.parseInt(user_id, 10) },
          data: {
            user_credits: { decrement: voucherSubtotal },
          },
        });

        console.log(
          `Credits deducted: ${voucherSubtotal} from user ${user_id}`
        );
      }

      // Assign vouchers for this batch
      const assignedVouchers = [];
      for (const voucher of vouchers) {
        const updatedVoucher = await prisma.pt_tv_voucher.update({
          where: { tv_voucher_id: voucher.tv_voucher_id },
          data: {
            owned_by: Number.parseInt(user_id, 10),
            updated_at: new Date(),
            status: "used",
            amount: voucherPrice,
            discount: Number.parseFloat(discount.toFixed(1)),
          },
        });
        assignedVouchers.push(updatedVoucher);
      }

      return assignedVouchers;
    });

    // Combine newly processed vouchers with previously processed ones
    const allProcessedVouchers = [...processedVouchers, ...result];

    // Check if we've processed all vouchers
    const isComplete = allProcessedVouchers.length >= stocks;

    // Only send email when all vouchers are processed
    if (isComplete) {
      await sendVoucherEmails(
        email,
        allProcessedVouchers,
        product_code,
        stocks,
        totalAmount,
        payment_method,
        voucherPrice,
        service_fee,
        phoneNumber
      );
    }

    return {
      success: true,
      message: isComplete
        ? "All TV subscriptions assigned, credits deducted, and emails sent successfully."
        : `Batch ${batchIndex + 1} processed successfully. ${
            allProcessedVouchers.length
          }/${stocks} vouchers processed.`,
      data: allProcessedVouchers,
      nextBatchIndex: batchIndex + 1,
      completed: isComplete,
      progress: {
        processed: allProcessedVouchers.length,
        total: stocks,
        percentage: Math.round((allProcessedVouchers.length / stocks) * 100),
      },
    };
  } catch (error: any) {
    console.error("Error in TV voucher assignment:", error);
    return {
      success: false,
      message:
        error.message || "An error occurred during TV subscription assignment.",
      error: error.message,
    };
  }
}

// Helper function to send emails based on number of vouchers
async function sendVoucherEmails(
  email: string,
  vouchers: any[],
  product_code: string,
  stocks: number,
  totalAmount: number,
  payment_method: string,
  voucherPrice: number,
  service_fee: number,
  phoneNumber: string,
  base_price: number = 0
) {
  // Send a single consolidated email for all vouchers
  if (stocks > 1) {
    // For multiple vouchers, create a table of all voucher details
    let voucherRows = "";
    vouchers.forEach((voucher, index) => {
      voucherRows += `
        <tr>
          <td>${voucher.product_name}</td>
          <td>${voucher.card_number}</td>
          <td>${voucher.voucher_code}</td>
        </tr>
      `;
    });

    // Use the createMultiVoucherEmail function
    const emailBody = createMultiVoucherEmail(
      voucherRows,
      product_code,
      stocks,
      totalAmount,
      payment_method,
      base_price,
      service_fee,
      phoneNumber
    );

    // Send a single email with all voucher details
    await sendBulkEmail(
      email,
      emailBody,
      "TV Subscription Purchase Successful"
    );
  } else {
    // For single voucher, use the createSingleVoucherEmail function
    const voucher = vouchers[0];
    const emailBody = createSingleVoucherEmail(
      voucher,
      totalAmount,
      base_price,
      service_fee,
      phoneNumber
    );

    await sendBulkEmail(
      email,
      emailBody,
      "TV Subscription Purchase Successful"
    );
  }
}

// Function to get TV vouchers by user ID
export async function getTvVoucherByUserId(userId: any) {
  try {
    if (!userId || isNaN(Number.parseInt(userId, 10))) {
      return {
        success: false,
        message: "Invalid or missing user ID.",
      };
    }

    const userVouchers = await prisma.pt_tv_voucher.findMany({
      where: {
        owned_by: Number.parseInt(userId, 10),
      },
      orderBy: {
        updated_at: "desc",
      },
    });

    return {
      success: true,
      data: userVouchers,
    };
  } catch (error) {
    console.error("Error fetching TV vouchers by user ID:", error);
    return {
      success: false,
      message: "Failed to fetch vouchers for the specified user.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to get TV voucher stock
export async function getTvVoucherStock(productName: string): Promise<{
  success: boolean;
  count: number;
  isLowStock: boolean;
  error?: string;
}> {
  try {
    const count = await prisma.pt_tv_voucher.count({
      where: {
        product_name: productName,
        owned_by: null,
      },
    });

    return {
      success: true,
      count,
      isLowStock: count < 5,
    };
  } catch (error) {
    console.error("Error counting TV vouchers:", error);
    return {
      success: false,
      count: 0,
      isLowStock: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
