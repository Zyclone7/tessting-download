// utils/auth.ts
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export function verifyAuth(req: NextRequest) {
  const authTokenCookie = req.cookies.get("auth_token");
  const authToken = authTokenCookie?.value;

  if (!authToken) {
    return false; // No token, not authenticated
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error("JWT_SECRET is not defined.");
    jwt.verify(authToken, jwtSecret); // Verify token
    return true; // Valid token
  } catch (err) {
    console.error("Authentication failed:", err);
    return false; // Invalid token
  }
}
