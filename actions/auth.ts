"use server";
import { prisma } from "@/lib/prisma-singleton";
import { PasswordHash } from "phpass";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers"; // For setting cookies in server actions

export async function handleLogin(formData: any) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    return {
      status: 400,
      json: { message: "Email and password are required." },
    };
  }

  try {
    // Find user by email
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
        business_address: true,
        business_name: true,
        user_contact_number: true,
        travel_agency: true,
        social_media_page: true,

      },
    });

    if (!user) {
      return { status: 401, json: { message: "Invalid email or password." } };
    }

    // Verify password using PHPass
    const hasher = new PasswordHash();
    const isPasswordValid = hasher.checkPassword(password, user.user_pass);

    if (!isPasswordValid) {
      return { status: 401, json: { message: "Invalid email or password." } };
    }

    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return { status: 500, json: { message: "Internal server error." } };
    }

    // Generate JWT token
    const payload = {
      id: user.ID,
      email: user.user_email,
      role: user.user_role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Set the auth_token cookie
    (await cookies()).set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400, // 1 day in seconds
      path: "/login",
    });

    return {
      status: 200,
      json: {
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
          travel_agency: user.travel_agency,
          social_media: user.social_media_page,

        },
        message: "Login successful.",
        redirect: "/user-dashboard", // Optional redirect after login
      },
    };
  } catch (error) {
    console.error("Error logging in:", error);
    return { status: 500, json: { message: "Internal server error." } };
  }
}