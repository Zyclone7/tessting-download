import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";
import { setRedeemedBy } from "@/actions/invitation-codes";
import { prisma } from "@/lib/prisma-singleton";

// Helper function to generate a random 5-digit password
function generateRandomPassword(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Define the expected user data type
interface UserData {
  user_login: string;
  user_email: string;
  user_pass: string;
  display_name?: string;
  user_role?: string;
  user_level?: string | number;
  user_referral_code?: string | null;
  user_upline_id?: string | number | null;
  user_credits?: string | number;
  user_nicename?: string;
  user_url?: string;
  user_registered?: string;
  user_activation_key?: string;
  user_status?: string | number;
  user_contact_number: string | null;
  business_name: string | null;
  business_address: string | null;
}

function parseUserData(data: UserData, hashedPassword: string) {
  return {
    user_login: data.user_login,
    user_pass: hashedPassword,
    user_email: data.user_email,
    display_name: data.display_name || data.user_login,
    user_role: data.user_role || "Basic_Merchant_Package",
    user_level: data.user_level
      ? Number.parseInt(data.user_level as string, 10)
      : 2,
    user_referral_code: data.user_referral_code || null,
    user_upline_id: data.user_upline_id
      ? Number.parseInt(data.user_upline_id as string, 10)
      : null,
    user_nicename: data.user_nicename || data.user_login,
    user_url: data.user_url || "",
    user_registered: data.user_registered
      ? new Date(data.user_registered)
      : new Date(),
    user_activation_key: data.user_activation_key || "",
    user_status:
      data.user_referral_code && data.user_referral_code.trim() !== "" ? 1 : 0,
    user_contact_number: data.user_contact_number || null,
    business_name: data.business_name || null,
    business_address: data.business_address || null,
  };
}

export async function POST(req: NextRequest) {
  const body: UserData = await req.json();
  const { user_login, user_email, user_role, user_nicename } = body;

  if (!user_email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    // Check if email already exists
    const existingUserByEmail = await prisma.pt_users.findUnique({
      where: { user_email },
      select: { ID: true }, // Only select the ID field for efficiency
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "The email address is already registered." },
        { status: 409 }
      );
    }

    //Check if name already exists
    const existingUserByName = await prisma.pt_users.findUnique({
      where: { user_nicename: user_nicename },
      select: { ID: true },
    });

    if (existingUserByName) {
      return NextResponse.json(
        { error: "The name is already taken." },
        { status: 409 }
      );
    }

    const randomPassword = generateRandomPassword();
    // Use bcrypt to hash the password with a salt factor of 10
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const userCredit = (await prisma.pt_package_products.findFirst({
      where: {
        name: user_role,
      },
      select: {
        free_credits: true,
      },
    })) || { free_credits: 0 };

    const userData: any = parseUserData(
      { ...body, user_pass: randomPassword },
      hashedPassword
    );
    userData.user_credits = userCredit?.free_credits || 0;

    const newUser = await prisma.pt_users.create({
      data: userData,
      select: { ID: true }, // Only select the ID field for efficiency
    });

    if (body.user_referral_code) {
      await setRedeemedBy(body.user_referral_code, newUser.ID.toString());
    }

    await sendWelcomeEmail(user_email, userData, randomPassword);

    return NextResponse.json(
      {
        userId: newUser.ID,
        message:
          "User registered successfully. Check your email for login details.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: `An error occurred while saving the user: ${errorMessage}` },
      { status: 500 }
    );
  }
}
