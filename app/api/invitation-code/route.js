import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const { code } = params;

  try {
    // Check if the invitation code exists
    const invitation = await prisma.pt_invitation_codes.findFirst({
      where: { code },
    });

    if (!invitation || !invitation.user_id) {
      return NextResponse.json(
        { error: "Invitation code not found or invalid" },
        { status: 404 }
      );
    }

    const userLine = await prisma.pt_users.findUnique({
      where: { ID: invitation.user_id },
      select: {
        ID: true,
        user_level: true,
        user_role: true,
        user_credits: true,
        user_referral_code: true,
      },
    });

    if (!userLine) {
      return NextResponse.json(
        { error: "User associated with the invitation code not found" },
        { status: 404 }
      );
    }

    // Return the user ID of the code owner and additional user information
    return NextResponse.json({
      user_id: invitation.user_id,
      user_level: userLine.user_level,
      user_role: userLine.user_role,
      user_credits: userLine.user_credits,
      user_referral_code: userLine.user_referral_code,
      invitation_code: invitation.code,
      invitation_package: invitation.package,
      invitation_amount: invitation.amount,
    });
  } catch (error) {
    console.error("Error fetching invitation code owner:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the invitation code owner" },
      { status: 500 }
    );
  }
}
