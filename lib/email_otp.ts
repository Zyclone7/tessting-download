import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "mail.philtechbusiness.ph", // Replace with your Bluehost mail server
  port: 465, // Use 587 for TLS or 465 for SSL
  secure: true, // true for SSL, false for TLS
  auth: {
    user: process.env.BLUEHOST_EMAIL, // Your Bluehost email (e.g., info@yourdomain.com)
    pass: process.env.BLUEHOST_PASS, // Your email password
  },
});

export async function sendOTPEmail(email: string, otp: string, name: string) {
  try {
    await transporter.sendMail({
      from: {
        name: "PHILTECH BUSINESS GROUP",
        address: process.env.BLUEHOST_EMAIL as string,
      },
      to: email,
      subject: "Your Login OTP",
      html: `
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
      `,
    });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
}
