import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const generateInvitationCode = () => {
  const prefix = "PACK";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let generatedPart = "";

  for (let i = 0; i < 6; i++) {
    generatedPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return `${prefix}${generatedPart}`;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packages, user_id, paymentMethod } = body;

    if (!Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json(
        { success: false, message: "Packages must be a non-empty array." },
        { status: 400 }
      );
    }

    // Fetch user's current credit and role
    const user: any = await prisma.pt_users.findUnique({
      where: { ID: parseInt(user_id.toString(), 10) },
      select: { user_credits: true, user_role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    const totalAmount = packages.reduce(
      (total, pkg) => total + pkg.amount * pkg.quantity,
      0
    );

    // Check if user has enough credit when paying with credits
    if (paymentMethod === "credits" && user.user_credits < totalAmount) {
      return NextResponse.json(
        { success: false, message: "Insufficient credit." },
        { status: 400 }
      );
    }

    const datePurchased = new Date().toISOString();
    const newCodes: any[] = [];

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (prisma) => {
      for (const pkg of packages) {
        const { packageName, amount, quantity } = pkg;

        for (let i = 0; i < quantity; i++) {
          const code = generateInvitationCode();
          const newCode = await prisma.pt_invitation_codes.create({
            data: {
              code,
              package: packageName || null,
              amount: parseFloat(amount.toString()) || null,
              user_id: parseInt(user_id.toString(), 10),
              redeemed_by: parseInt(user_id.toString(), 10), // Set redeemed_by to the purchaser's user_id
              date_purchased: datePurchased,
            },
          });
          newCodes.push(newCode);
        }
      }

      // Update user's credit if payment method is 'credits'
      if (paymentMethod === "credits") {
        await prisma.pt_users.update({
          where: { ID: parseInt(user_id.toString(), 10) },
          data: { user_credits: { decrement: totalAmount } },
        });
      }

      // Ensure user's role is set to '1'
      await prisma.pt_users.update({
        where: { ID: parseInt(user_id.toString(), 10) },
        data: { user_status: 1 },
      });
    });

    // Fetch updated user credit and role
    const updatedUser = await prisma.pt_users.findUnique({
      where: { ID: parseInt(user_id.toString(), 10) },
      select: { user_credits: true, user_role: true },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Invitation codes created successfully.",
        data: newCodes,
        updatedCredit: updatedUser?.user_credits,
        updatedRole: updatedUser?.user_role,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating invitation codes:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create invitation codes.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
