import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Email sending function
const sendEmail = async (toEmail: string, emailBody: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions: any = {
    from: {
      name: "PhilTech Inc.",
      address: process.env.GMAIL_USER,
    },
    to: toEmail,
    subject: "GSAT Voucher Assigned",
    text: emailBody, // Plain-text fallback
    html: emailBody, // HTML version
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email to ${toEmail}`);
  }
};

// API route handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, product_code, email, stocks } = body;

    if (!user_id || !product_code || !email || !stocks) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters." },
        { status: 400 }
      );
    }

    // Fetch available vouchers
    const vouchers = await prisma.pt_gsat_voucher.findMany({
      where: {
        product_code,
        owned_by: null, // Only unassigned vouchers
      },
      take: stocks,
    });

    if (vouchers.length < stocks) {
      return NextResponse.json(
        {
          success: false,
          message: `Only ${vouchers.length} vouchers are available. Requested: ${stocks}`,
        },
        { status: 400 }
      );
    }

    // Assign vouchers and send emails
    const assignedVouchers = [];
    for (const voucher of vouchers) {
      const updatedVoucher = await prisma.pt_gsat_voucher.update({
        where: { gsat_voucher_id: voucher.gsat_voucher_id },
        data: {
          owned_by: parseInt(user_id, 10),
          used_date: new Date(),
        },
      });

      // Generate email body
      const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .email-container { padding: 20px; background-color: #fff; border-radius: 8px; }
    .header { text-align: center; color: #4caf50; }
    .voucher-details { margin-top: 20px; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .details-table th, .details-table td { border: 1px solid #ddd; padding: 8px; }
    .details-table th { background-color: #4caf50; color: #fff; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <p>Your GSAT Voucher is Assigned!</p>
    </div>
    <div class="voucher-details">
      <h2>Voucher Details:</h2>
      <table class="details-table">
        <tr><th>Product Code</th><td>${voucher.product_code}</td></tr>
        <tr><th>Serial Number</th><td>${voucher.serial_number}</td></tr>
        <tr><th>Reference Number</th><td>${voucher.reference_number}</td></tr>
        <tr><th>Amount</th><td>₱${voucher.amount}</td></tr>
        <tr><th>Discount</th><td>₱${voucher.discount}</td></tr>
        <tr><th>Expiry Date</th><td>${voucher.expiry_date || "N/A"}</td></tr>
      </table>
    </div>
    <p>Thank you for choosing our service!</p>
  </div>
</body>
</html>
`;

      // Send email
      await sendEmail(email, emailBody);

      // Add to the assigned vouchers list
      assignedVouchers.push(updatedVoucher);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Vouchers assigned and emails sent successfully.",
        data: assignedVouchers,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in voucher assignment:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred.", error: error.message },
      { status: 500 }
    );
  }
}
