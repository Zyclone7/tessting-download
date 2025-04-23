import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-singleton";
import jwt from "jsonwebtoken";

const jwtSecret: string = process.env.JWT_SECRET || "secret";
if (!jwtSecret) {
  throw new Error("JWT_SECRET is not defined");
}

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();

  if (!email || !otp) {
    return NextResponse.json(
      { message: "Email and OTP are required." },
      { status: 400 }
    );
  }

  try {
    // Retrieve user data using a minimal select
    const user = await prisma.pt_users.findUnique({
      where: { user_email: email },
      select: {
        ID: true,
        user_email: true,
        otp_code: true,
        otp_expiry: true,
        display_name: true,
        user_role: true,
        user_status: true,
        user_nicename: true,
        merchant_id: true,
        business_address: true,
        business_name: true,
        user_contact_number: true,
        user_level: true,
        travel_agency: true,
        social_media_page: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Validate OTP: if it doesn't match or is expired
    if (user.otp_code !== otp || new Date() > new Date(user.otp_expiry || "")) {
      return NextResponse.json(
        { message: "Invalid or expired OTP." },
        { status: 401 }
      );
    }

    // Clear OTP details after successful verification
    await prisma.pt_users.update({
      where: { user_email: email },
      data: { otp_code: null, otp_expiry: null },
    });

    // Generate JWT token
    const payload = {
      id: user.ID,
      email: user.user_email,
      role: user.user_role,
    };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "1d" });

    // Build response including setting the auth token in a cookie
    const response = NextResponse.json({
      user: {
        id: user.ID,
        email: user.user_email,
        name: user.display_name,
        role: user.user_role,
        status: user.user_status,
        nickname: user.user_nicename,
        merchant_id: user.merchant_id,
        business_name: user.business_name,
        business_address: user.business_address,
        contact_number: user.user_contact_number,
        level: user.user_level,
        travel_agency: user.travel_agency,
        social_media_page: user.social_media_page,
      },
      message: "Login successful.",
      redirect: "/user-dashboard",
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400, // 1 day in seconds
      path: "/login",
    });

    return response;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
