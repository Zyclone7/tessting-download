"use server";

import { prisma } from "@/lib/prisma-singleton";
import nodemailer from "nodemailer";

// Email sending function for WiFi vouchers
const sendBulkEmail = async (
  toEmail: string,
  emailBody: string,
  subject: string = "WiFi Voucher Assigned"
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

// Updated server action for assigning WiFi vouchers with consolidated emails
export async function assignWiFiVouchers(formData: FormData) {
  try {
    const user_id = formData.get("user_id") as string;
    const duration = formData.get("duration") as string;
    const email = formData.get("email") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const stocks = parseInt(formData.get("stocks") as string, 10);
    const payment_method = formData.get("payment_method") as string;
    const proof_of_payment = formData.get("proof_of_payment") as string;
    const service_fee = parseFloat(formData.get("service_fee") as string) || 0;

    if (!user_id || !duration || !email || isNaN(stocks)) {
      return {
        success: false,
        message: "Missing required parameters.",
      };
    }

    // Define price lookup based on WiFi duration
    const durationPrices: { [key: string]: number } = {
      "2 Hour": 5,
      "5 Hour": 10,
      "24 Hour": 25,
      "5 Days": 50,
      "1 month": 200,
    };

    const voucherPrice = durationPrices[duration] || 0;
    const voucherSubtotal = voucherPrice * stocks;
    const totalAmount = voucherSubtotal + service_fee; // Total with service fee

    // Check for sufficient voucher stock
    const vouchers = await prisma.pt_wifi_voucher.findMany({
      where: {
        duration,
        owned_by: null,
        status: "null",
      },
      take: stocks,
    });

    if (vouchers.length < stocks) {
      return {
        success: false,
        message: `Only ${vouchers.length} vouchers are available. Requested: ${stocks}`,
      };
    }

    // Begin transaction to ensure both voucher assignment and credit deduction are atomic
    const result = await prisma.$transaction(async (prisma) => {
      // If payment method is credits, check and update user credits
      if (payment_method === "credits") {
        // Get user's current credit balance
        const user: { user_credits: number | null } | null =
          await prisma.pt_users.findUnique({
            where: { ID: parseInt(user_id, 10) },
            select: { user_credits: true },
          });

        if (!user) {
          throw new Error("User not found");
        }

        const currentCredits = parseFloat(user.user_credits?.toString() || "0");

        // Check if user has enough credits for voucher subtotal (not including service fee)
        if (currentCredits < voucherSubtotal) {
          throw new Error("Insufficient credits for this purchase.");
        }

        // Deduct credits from user's account (only deduct the voucher price, not service fee)
        await prisma.pt_users.update({
          where: { ID: parseInt(user_id, 10) },
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
        const updatedVoucher = await prisma.pt_wifi_voucher.update({
          where: { wifi_voucher_id: voucher.wifi_voucher_id },
          data: {
            owned_by: parseInt(user_id, 10),
            updated_at: new Date(),
            status: "used",
          },
        });
        assignedVouchers.push(updatedVoucher);
      }

      return assignedVouchers;
    });

    // Send a single consolidated email for all vouchers
    if (stocks > 1) {
      // For multiple vouchers, create a table of all voucher details
      let voucherRows = "";
      result.forEach((voucher, index) => {
        voucherRows += `
          <tr>
            <td>${index + 1}</td>
            <td>${voucher.code}</td>
            <td>${voucher.duration}</td>
            <td>${voucher.validity_text || `${voucher.validity_days} days`}</td>
            <td>${voucher.surfing || "Unlimited"}</td>
          </tr>
        `;
      });

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
    .details-table th, .details-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
    .details-table th { background-color: #4caf50; color: #fff; }
    .pricing-info { margin-top: 15px; font-size: 14px; }
    .summary { margin-top: 20px; background-color: #f9f9f9; padding: 10px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <p>WiFi Vouchers Purchase Successful</p>
    </div>
    
    <div class="summary">
      <h3>Purchase Summary:</h3>
      <p><strong>Duration:</strong> ${duration}</p>
      <p><strong>Quantity:</strong> ${stocks} voucher(s)</p>
      <p><strong>Total Amount:</strong> ₱${totalAmount.toFixed(2)}</p>
      <p><strong>Payment Method:</strong> ${payment_method}</p>
      <p><strong>Phone Number:</strong> ${phoneNumber}</p>
    </div>
    
    <div class="voucher-details">
      <h2>Your WiFi Vouchers:</h2>
      <table class="details-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Voucher Code</th>
            <th>Duration</th>
            <th>Validity</th>
            <th>Surfing Hours</th>
          </tr>
        </thead>
        <tbody>
          ${voucherRows}
        </tbody>
      </table>
    </div>
    
    <p>Please Copy the voucher codes and enter them to XpressWi-Fi SSID</p>
    <p>Thank you for choosing our service!</p>
    <p>PHILTECH BUSINESS GROUP</p>
  </div>
</body>
</html>
`;

      // Send a single email with all voucher details
      await sendBulkEmail(
        email,
        emailBody,
        "WiFi Vouchers Purchase Successful"
      );
    } else {
      // For single voucher (keeping the original email format)
      const voucher = result[0];
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
    .pricing-info { margin-top: 15px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <p>Purchase is Successful</p>
    </div>
    <div class="voucher-details">
      <h2>Voucher Details:</h2>
      <table class="details-table">
        <tr><th>Voucher Code</th><td>${voucher.code}</td></tr>
        <tr><th>Amount</th><td>₱${totalAmount.toFixed(2)}</td></tr>
        <tr><th>Duration</th><td>${voucher.duration}</td></tr>
        <tr><th>Validity</th><td>${
          voucher.validity_text || `${voucher.validity_days} days`
        }</td></tr>
        <tr><th>Surfing Hours</th><td>${
          voucher.surfing || "Unlimited"
        }</td></tr>
        <tr><th>Phone Number</th><td>${phoneNumber}</td></tr>
      </table>
    </div>
    <p>Please Copy the voucher code and enter it to XpressWi-Fi SSID</p>
    <p>Thank you for choosing our service!</p>
    <p>PHILTECH BUSINESS GROUP</p>
  </div>
</body>
</html>
`;
      await sendBulkEmail(email, emailBody, "WiFi Voucher Assigned");
    }

    return {
      success: true,
      message:
        "WiFi vouchers assigned, credits deducted, and emails sent successfully.",
      data: result,
    };
  } catch (error: any) {
    console.error("Error in WiFi voucher assignment:", error);
    return {
      success: false,
      message:
        error.message || "An error occurred during WiFi voucher assignment.",
      error: error.message,
    };
  }
}

// Function to get WiFi vouchers by user ID (unchanged)
export async function getWiFiVoucherByUserId(userId: any) {
  try {
    if (!userId || isNaN(parseInt(userId, 10))) {
      return {
        success: false,
        message: "Invalid or missing user ID.",
      };
    }

    const userVouchers = await prisma.pt_wifi_voucher.findMany({
      where: {
        owned_by: parseInt(userId, 10),
      },
    });

    return {
      success: true,
      data: userVouchers,
    };
  } catch (error) {
    console.error("Error fetching WiFi vouchers by user ID:", error);
    return {
      success: false,
      message: "Failed to fetch vouchers for the specified user.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
