import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-singleton";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOTP } from "@/lib/utils";
import { sendOTPEmail } from "@/lib/email_otp";

// Define constants for bypass roles and JWT secret
const bypassRoles = [
  "admin",
  "verifier",
  "uploader",
  "approver",
  "kyc_approver",
  "voucher_uploader",
  "travel_approver",
];
const jwtSecret = process.env.JWT_SECRET || "secret";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.pt_users.findUnique({
      where: { user_email: email },
      select: {
        ID: true,
        user_email: true,
        user_pass: true,
        display_name: true,
        user_role: true,
        user_status: true,
        user_nicename: true,
        merchant_id: true,
        bank_name: true,
        bank_account_number: true,
        cf_share: true,
        business_address: true,
        business_name: true,
        user_contact_number: true,
        user_level: true,
        otp_code: true,
        otp_expiry: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Trim the stored password and validate it using bcrypt if applicable
    const storedPass = user.user_pass.trim();
    const isPasswordValid = storedPass.startsWith("$2")
      ? await bcrypt.compare(password, storedPass)
      : password === storedPass;

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Issue token immediately for bypass roles
    if (user.user_role && bypassRoles.includes(user.user_role)) {
      const token = jwt.sign(
        { userId: user.ID, email: user.user_email, role: user.user_role },
        jwtSecret,
        { expiresIn: "1h" }
      );

      return NextResponse.json({
        user: {
          id: user.ID,
          email: user.user_email,
          displayName: user.display_name,
          role: user.user_role,
        },
        token,
      });
    }

    // For other roles, generate and store OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.pt_users.update({
      where: { user_email: email },
      data: { otp_code: otp, otp_expiry: otpExpiry },
    });

    // Send OTP email
    await sendOTPEmail(email, otp, user.user_nicename || "User");

    return NextResponse.json({
      otpRequired: true,
      message: "OTP sent to your email address",
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
