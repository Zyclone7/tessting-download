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
  serviceFee = 0
) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GSAT ePIN Purchase Confirmation</title>
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
    .btn-load {
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
    .btn-load:hover {
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
      .summary {
        padding: 15px !important;
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
      .details-table th, .details-table td {
        padding: 10px 8px !important;
        font-size: 13px !important;
      }
      
      /* Button Adjustments */
      .btn-load {
        padding: 12px 25px !important;
        font-size: 15px !important;
        display: block !important;
        margin: 0 auto !important;
        width: 80% !important;
        text-align: center !important;
      }
      .btn-fallback {
        font-size: 13px !important;
        padding: 0 15px !important;
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
      <p>Your GSAT ePINs Purchase is Successful</p>
    </div>
    
    <div class="content">
      <div class="summary">
        <h3>Purchase Summary:</h3>
        <p><strong>Product:</strong> ${product_code}</p>
        <p><strong>Quantity:</strong> ${stocks} ePIN(s)</p>
        <p><strong>Total Amount:</strong> ₱${totalAmount}</p>
        <p><strong>Payment Method:</strong> ${payment_method}</p>
      </div>
      
      <div class="voucher-details">
        <h2>Your GSAT ePins:</h2>
        <table class="details-table" cellspacing="0" cellpadding="0" border="0" width="100%">
          <thead>
            <tr>
              <th>#</th>
              <th>Product Code</th>
              <th>Serial Number</th>
              <th>Reference Number</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${voucherRows}
          </tbody>
        </table>
      </div>
      
      <div class="warning">
        <p>IMPORTANT: Keep your ePIN details secure. Do not share them with anyone.</p>
      </div>
      
      <div class="btn-container">
        <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.gsat.asia/webloading.php" style="height:45px;v-text-anchor:middle;width:220px;" arcsize="10%" stroke="f" fillcolor="#3c89d6">
            <w:anchorlock/>
            <center>
        <![endif]-->
            <a href="https://www.gsat.asia/webloading.php" class="btn-load" target="_blank">LOAD YOUR ePIN NOW</a>
        <!--[if mso]>
            </center>
          </v:roundrect>
        <![endif]-->
        <div class="btn-fallback">
          If the button doesn't work, copy and paste this link: <a href="https://www.gsat.asia/webloading.php">https://www.gsat.asia/webloading.php</a>
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
  serviceFee: number
) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GSAT ePIN Purchase Confirmation</title>
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
    .pin-highlight {
      background-color: #e8f5e9;
      border-left: 4px solid #3c89d6;
      padding: 15px;
      margin: 20px 0;
      font-size: 18px;
      text-align: center;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .pin-highlight strong {
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
    .btn-load {
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
    .btn-load:hover {
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
      .pin-highlight {
        padding: 10px !important;
        font-size: 16px !important;
      }
      .btn-load {
        padding: 12px 25px !important;
        font-size: 15px !important;
        display: block !important;
        margin: 0 auto !important;
        width: 80% !important;
        text-align: center !important;
      }
      .btn-fallback {
        font-size: 13px !important;
        padding: 0 15px !important;
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
      <p>Your GSAT ePIN Purchase is Successful</p>
    </div>
    
    <div class="content">
      <div class="voucher-details">
        <h2>GSAT ePIN Details:</h2>
        <div class="pin-highlight">
          <p>Your Reference Number: <strong>${
            voucher.reference_number
          }</strong></p>
        </div>
        <table class="details-table" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr><th>Product Code</th><td>${voucher.product_code}</td></tr>
          <tr><th>Serial Number</th><td>${voucher.serial_number}</td></tr>
          <tr><th>Reference Number</th><td>${voucher.reference_number}</td></tr>
          <tr><th>Total Amount</th><td>₱${totalAmount}</td></tr>
        </table>
      </div>
      
      <div class="warning">
        <p>IMPORTANT: Keep your ePIN details secure. Do not share them with anyone.</p>
      </div>
      
      <div class="btn-container">
        <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.gsat.asia/webloading.php" style="height:45px;v-text-anchor:middle;width:220px;" arcsize="10%" stroke="f" fillcolor="#3c89d6">
            <w:anchorlock/>
            <center>
        <![endif]-->
            <a href="https://www.gsat.asia/webloading.php" class="btn-load" target="_blank">LOAD YOUR ePIN NOW</a>
        <!--[if mso]>
            </center>
          </v:roundrect>
        <![endif]-->
        <div class="btn-fallback">
          If the button doesn't work, copy and paste this link: <a href="https://www.gsat.asia/webloading.php">https://www.gsat.asia/webloading.php</a>
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

// Email sending function for GSAT vouchers
const sendBulkEmail = async (
  toEmail: string,
  emailBody: string,
  subject = "GSAT ePin Purchase Successful"
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

// Update the assignVouchers function to handle role-based discounts
export async function assignVouchers(formData: FormData) {
  try {
    const user_id = formData.get("user_id") as string;
    const product_code = formData.get("product_code") as string;
    const email = formData.get("email") as string;
    const stocks = Number.parseInt(formData.get("stocks") as string, 10);
    const payment_method = formData.get("payment_method") as string;
    const proof_of_payment = formData.get("proof_of_payment") as string;

    // Fix: Parse the price as a float and ensure it has 2 decimal places
    const priceString = formData.get("price") as string;
    const discount = Number.parseFloat(
      (formData.get("discount") as string) || "0"
    );
    const price = Number.parseFloat(Number.parseFloat(priceString).toFixed(2));

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

    const productType = "gsat";

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

    if (!productInfo) {
      return {
        success: false,
        message: `Product ${product_code} not found.`,
      };
    }

    // Determine the price to use (discounted or base)
    let voucherPrice: number;

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
        (productInfo.base_price || 0).toFixed(2)
      );
    }

    const voucherSubtotal = Number.parseFloat(
      (voucherPrice * stocks).toFixed(2)
    );
    const totalAmount = Number.parseFloat(
      (voucherSubtotal + service_fee).toFixed(2)
    ); // Total with service fee

    // Find available vouchers
    const vouchers = await prisma.pt_gsat_voucher.findMany({
      where: {
        product_code,
        owned_by: null,
        status: { not: "used" }, // Ensure vouchers are not already used
      },
      take: stocks,
    });

    if (vouchers.length < stocks) {
      return {
        success: false,
        message: `Only ${vouchers.length} ePINs are available. Requested: ${stocks}`,
      };
    }

    // Begin transaction to ensure both voucher assignment and credit deduction are atomic
    const result = await prisma.$transaction(async (prisma) => {
      // If payment method is credits, check and update user credits
      if (payment_method === "credits") {
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

      // Assign vouchers
      const assignedVouchers = [];
      for (const voucher of vouchers) {
        // Calculate discount if base price is available

        const updatedVoucher = await prisma.pt_gsat_voucher.update({
          where: { gsat_voucher_id: voucher.gsat_voucher_id },
          data: {
            owned_by: Number.parseInt(user_id, 10),
            used_date: new Date(),
            status: "used",
            amount: Number.parseFloat(price.toFixed(2)),
            discount: Number.parseFloat(discount.toFixed(1)),
          },
        });
        assignedVouchers.push(updatedVoucher);
      }

      return assignedVouchers;
    });

    // Calculate discount percentage for display in email
    const basePrice = productInfo.base_price || 0;
    const discountPercentage =
      basePrice > 0 ? ((basePrice - voucherPrice) / basePrice) * 100 : 0;
    const formattedDiscountPercentage = discountPercentage.toFixed(1);

    // Send a single consolidated email for all vouchers
    if (stocks > 1) {
      // For multiple vouchers, create a table of all voucher details
      let voucherRows = "";
      result.forEach((voucher, index) => {
        voucherRows += `
          <tr>
            <td>${index + 1}</td>
            <td>${voucher.product_code}</td>
            <td>${voucher.serial_number}</td>
            <td>${voucher.reference_number}</td>
            <td>₱${base_price}</td>
          </tr>
        `;
      });

      // Use the new createMultiVoucherEmail function
      const emailBody = createMultiVoucherEmail(
        voucherRows,
        product_code,
        stocks,
        totalAmount,
        payment_method,
        base_price,
        service_fee
      );

      // Send a single email with all voucher details
      await sendBulkEmail(email, emailBody, "GSAT ePINs Purchase Successful");
    } else {
      // For single voucher, use the new createSingleVoucherEmail function
      const voucher = result[0];
      const emailBody = createSingleVoucherEmail(
        voucher,
        totalAmount,
        base_price,
        service_fee
      );

      await sendBulkEmail(email, emailBody, "GSAT ePINs Purchase Successful");
    }

    return {
      success: true,
      message:
        "ePINs assigned, credits deducted, and emails sent successfully.",
      data: result,
    };
  } catch (error: any) {
    console.error("Error in ePINs assignment:", error);
    return {
      success: false,
      message: error.message || "An error occurred during ePINs assignment.",
      error: error.message,
    };
  }
}

// Function to get GSAT vouchers by user ID
export async function getGsatVoucherByUserId(userId: any) {
  try {
    if (!userId || isNaN(Number.parseInt(userId, 10))) {
      return {
        success: false,
        message: "Invalid or missing user ID.",
      };
    }

    const userVouchers = await prisma.pt_gsat_voucher.findMany({
      where: {
        owned_by: Number.parseInt(userId, 10),
      },
      orderBy: {
        used_date: "desc",
      },
    });

    return {
      success: true,
      data: userVouchers,
    };
  } catch (error) {
    console.error("Error fetching ePINs by user ID:", error);
    return {
      success: false,
      message: "Failed to fetch ePINs for the specified user.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to get GSAT voucher stock
export async function getGsatVoucherStock(productCode: string): Promise<{
  success: boolean;
  count: number;
  isLowStock: boolean;
  error?: string;
}> {
  try {
    const count = await prisma.pt_gsat_voucher.count({
      where: {
        product_code: productCode,
        owned_by: null,
        status: { not: "used" },
      },
    });

    return {
      success: true,
      count,
      isLowStock: count < 5,
    };
  } catch (error) {
    console.error("Error counting GSAT ePINs:", error);
    return {
      success: false,
      count: 0,
      isLowStock: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
