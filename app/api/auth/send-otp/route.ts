import { NextResponse } from "next/server";

interface OTPRecord {
  otp: string;
  expiresAt: number;
}

// In-memory store for OTPs (temporary, use Redis in production)
const otpStore: Record<string, OTPRecord> = {};

// Helper function to generate a random 6-digit OTP
function generateOTP(length = 6): string {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    // Generate OTP and store it with an expiration time (5 minutes)
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min expiration
    otpStore[email] = { otp, expiresAt };

    console.log(`OTP for ${email}: ${otp}`); // Replace with actual email sending logic

    return NextResponse.json({ message: "OTP sent successfully." });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
