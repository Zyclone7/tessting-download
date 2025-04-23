import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-singleton";

export async function POST(req: NextRequest) {
    try {
      const { user_email } = await req.json();
      console.log("🔍 Updating user status & upline_id for:", user_email);
  
      if (!user_email) {
        console.error("❌ Missing user_email in request");
        return NextResponse.json({ error: "User email is required." }, { status: 400 });
      }
  
      const existingUser = await prisma.pt_users.findUnique({ where: { user_email } });
      console.log("👤 Existing user found:", existingUser);
  
      if (!existingUser) {
        console.error("❌ User not found");
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
  
      // ✅ Update user_status to 1 & user_upline_id to 1
      const updatedUser = await prisma.pt_users.update({
        where: { user_email },
        data: {
          user_status: 1,
          user_upline_id: 1,
        },
      });
  
      console.log("✅ Successfully updated user:", updatedUser);
      return NextResponse.json({ message: "User updated successfully", updatedUser }, { status: 200 });
  
    } catch (error) {
      console.error("❌ Error updating user:", error);
      return NextResponse.json({ error: "Error updating user." }, { status: 500 });
    }
  }
  
