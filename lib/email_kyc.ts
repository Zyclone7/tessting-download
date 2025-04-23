"use server";

import { sendEmail } from "@/lib/email";

export async function sendKYCEmail(
  type: "approval" | "rejection",
  userData: {
    email: string;
    name: string;
    businessName?: string;
    rejectionReason?: string;
  }
) {
  try {
    const { email, name, businessName, rejectionReason } = userData;

    if (type === "approval") {
      return await sendEmail({
        to: email,
        subject: "Your KYC Verification Has Been Approved",
        html: await getApprovalEmailTemplate(name, businessName),
      });
    } else {
      return await sendEmail({
        to: email,
        subject: "Your KYC Verification Requires Attention",
        html: await getRejectionEmailTemplate(
          name,
          rejectionReason ||
            "Your submission did not meet our verification requirements.",
          businessName
        ),
      });
    }
  } catch (error) {
    console.error("Error sending KYC email:", error);
    throw error;
  }
}

export async function getApprovalEmailTemplate(
  userName: string,
  businessName?: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KYC Verification Approved</title>
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
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">KYC Verification Approved</h1>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 30px 20px;">
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Dear <strong>${
              userName || "Valued Customer"
            }</strong>,</p>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">We are pleased to inform you that your KYC (Know Your Customer) verification has been <strong style="color: #3c89d6;">approved</strong>.</p>
            
            ${
              businessName
                ? `<p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your business <strong>${businessName}</strong> is now fully verified on our platform.</p>`
                : ""
            }
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">You now have full access to all features and services on our platform. You can start using your account immediately.</p>
            
            <div style="background-color: #f0f7fc; border-left: 4px solid #3c89d6; padding: 20px; margin: 25px 0; text-align: center; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <h2 style="font-size: 20px; letter-spacing: 1px; margin: 0 0 15px 0; color: #3c89d6; font-weight: bold;">CONGRATULATIONS!</h2>
              <p style="margin: 0; font-size: 16px;">Your account is now fully verified and ready to use.</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Thank you for choosing our service!</p>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 0;">Best regards,<br>The Verification Team</p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #afdaf5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 14px; color: #333; margin: 0 0 10px 0;"><strong>© ${new Date().getFullYear()} PHILTECH INC BUSINESS GROUP. All rights reserved.</strong></p>
            <p style="font-size: 14px; color: #333; margin: 0;">For support, contact <a href="mailto:support@philtechbusiness.ph" style="color: #3c89d6; text-decoration: none; font-weight: bold;">support@philtechbusiness.ph</a></p>
            <p style="font-size: 14px; color: #333; margin: 10px 0 0 0;">This is an automated message, please do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function getRejectionEmailTemplate(
  userName: string,
  reason: string,
  businessName?: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KYC Verification Not Approved</title>
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
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">KYC Verification Not Approved</h1>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 30px 20px;">
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Dear <strong>${
              userName || "Valued Customer"
            }</strong>,</p>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">We regret to inform you that your KYC (Know Your Customer) verification has been <strong style="color: #F44336;">not approved</strong> at this time.</p>
            
            ${
              businessName
                ? `<p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">The verification for your business <strong>${businessName}</strong> requires additional attention.</p>`
                : ""
            }
            
            <div style="background-color: #fff4f4; padding: 20px; border-radius: 4px; margin: 25px 0; border-left: 4px solid #F44336; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <p style="margin: 0 0 10px 0;"><strong>Reason for Rejection:</strong></p>
              <p style="margin: 0;">${
                reason ||
                "Your submission did not meet our verification requirements."
              }</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 10px;"><strong>What to do next:</strong></p>
            <ol style="padding-left: 20px; margin-top: 0; margin-bottom: 20px;">
              <li style="margin-bottom: 8px;">Review the reason for rejection mentioned above</li>
              <li style="margin-bottom: 8px;">Make the necessary corrections to your submission</li>
              <li style="margin-bottom: 0;">Resubmit your KYC verification with the updated information</li>
            </ol>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">If you believe this is an error or need assistance with resubmitting your verification, please contact our support team.</p>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">We appreciate your understanding and cooperation.</p>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 0;">Best regards,<br>The Verification Team</p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #afdaf5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 14px; color: #333; margin: 0 0 10px 0;"><strong>© ${new Date().getFullYear()} PHILTECH INC BUSINESS GROUP. All rights reserved.</strong></p>
            <p style="font-size: 14px; color: #333; margin: 0;">For support, contact <a href="mailto:support@philtechbusiness.ph" style="color: #3c89d6; text-decoration: none; font-weight: bold;">support@philtechbusiness.ph</a></p>
            <p style="font-size: 14px; color: #333; margin: 10px 0 0 0;">This is an automated message, please do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function getOTPEmailTemplate(name: string, otp: string) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
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
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your One-Time Password (OTP) is:</p>
          
          <!-- OTP Box -->
          <div style="background-color: #f0f7fc; border-left: 4px solid #3c89d6; padding: 20px; margin: 25px 0; text-align: center; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h2 style="font-size: 32px; letter-spacing: 5px; margin: 0; color: #3c89d6; font-weight: bold;">${otp}</h2>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This OTP will expire in <strong>5 minutes</strong>.</p>
          
          <!-- Warning -->
          <div style="background-color: #fff8f8; border-left: 4px solid #e53e3e; padding: 15px; margin: 25px 0; border-radius: 0 4px 4px 0;">
            <p style="color: #e53e3e; font-weight: bold; margin: 0; font-size: 16px;">WARNING: Do not share this OTP with anyone. PHILTECH staff will never ask for your OTP.</p>
          </div>
          
          <p style="font-size: 14px; color: #718096; line-height: 1.5; margin-top: 30px;">If you didn't request this OTP, please ignore this email and contact support immediately.</p>
        </td>
      </tr>
      
      <!-- Footer -->
      <tr>
        <td style="background-color: #afdaf5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 14px; color: #333; margin: 0 0 10px 0;"><strong>© ${new Date().getFullYear()} PHILTECH INC BUSINESS GROUP. All rights reserved.</strong></p>
          <p style="font-size: 14px; color: #333; margin: 0;">For support, contact <a href="mailto:support@philtechbusiness.ph" style="color: #3c89d6; text-decoration: none; font-weight: bold;">support@philtechbusiness.ph</a></p>
          <p style="font-size: 14px; color: #333; margin: 10px 0 0 0;">This is an automated message, please do not reply to this email.</p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}
