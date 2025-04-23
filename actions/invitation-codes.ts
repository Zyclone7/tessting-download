"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma-singleton";


export async function getInvitationCodes(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        message: "User ID is required.",
      };
    }

    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId)) {
      return {
        success: false,
        message: "Invalid user ID.",
      };
    }

    const invitationCodes = await prisma.pt_invitation_codes.findMany({
      where: { user_id: parsedUserId },
    });

    if (!invitationCodes || invitationCodes.length === 0) {
      return {
        success: true,
        message: "No invitation codes found for the given user ID.",
        data: [],
      };
    }

    return {
      success: true,
      data: invitationCodes,
    };
  } catch (error) {
    console.error("Error fetching invitation codes:", error);
    return {
      success: false,
      message: "Something went wrong while fetching invitation codes.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getInvitationCodeByCode(code: string) {
  try {
    if (!code) {
      return {
        success: false,
        status: 400,
        error: "Invitation code is required.",
      };
    }

    const invitation = await prisma.pt_invitation_codes.findFirst({
      where: { code },
    });

    if (!invitation || !invitation.user_id) {
      return {
        success: false,
        status: 404,
        error: "Invitation code not found or invalid.",
      };
    }

    const userLine = await prisma.pt_users.findFirst({
      where: { ID: invitation.user_id },
    });

    if (!userLine) {
      return {
        success: false,
        status: 404,
        error: "User associated with the code not found.",
      };
    }

    return {
      success: true,
      status: 200,
      data: {
        user_id: userLine.ID,
        user_level: userLine.user_level,
        user_upline_id: userLine.user_upline_id,
        user_role: invitation.package,
      },
    };
  } catch (error) {
    console.error("Error fetching invitation code owner:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the invitation code details.",
    };
  }
}

export async function setRedeemedBy(code: string, userId: string) {
  try {
    if (!code || !userId) {
      return {
        success: false,
        status: 400,
        error: "Code and user ID are required.",
      };
    }

    const invitation = await prisma.pt_invitation_codes.findFirst({
      where: { code },
    });

    if (!invitation) {
      return {
        success: false,
        status: 404,
        error: "Invitation code not found.",
      };
    }

    if (invitation.redeemed_by) {
      return {
        success: false,
        status: 400,
        error: "Invitation code has already been redeemed.",
      };
    }

    const updatedInvitation = await prisma.pt_invitation_codes.update({
      where: { id: invitation.id },
      data: { redeemed_by: parseInt(userId, 10), date_activated: new Date() },
    });

    return {
      success: true,
      status: 200,
      data: updatedInvitation,
    };
  } catch (error) {
    console.error("Error updating invitation code:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while updating the invitation code.",
    };
  }
}

export async function getInvitationCodeOwner(code: string) {
  try {
    const invitation = await prisma.pt_invitation_codes.findFirst({
      where: { code },
    });

    if (!invitation || !invitation.user_id) {
      return { error: "Invitation code not found or invalid" };
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
      return { error: "User associated with the invitation code not found" };
    }

    return {
      user_id: invitation.user_id,
      user_level: userLine.user_level,
      user_role: userLine.user_role,
      user_credits: userLine.user_credits,
      user_referral_code: userLine.user_referral_code,
      invitation_code: invitation.code,
      invitation_package: invitation.package,
      invitation_amount: invitation.amount,
    };
  } catch (error) {
    console.error("Error fetching invitation code owner:", error);
    return {
      error: "An error occurred while fetching the invitation code owner",
    };
  }
}

export async function getInvitationCodesByUserId(userId: string) {
  if (!userId || isNaN(parseInt(userId, 10))) {
    return {
      success: false,
      message: "Invalid or missing user_id.",
    };
  }

  try {
    const invitationCodes = await prisma.pt_invitation_codes.findMany({
      where: { user_id: parseInt(userId, 10) },
    });

    return {
      success: true,
      data: invitationCodes || [],
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch invitation codes.",
    };
  }
}

const generateInvitationCode = () => {
  const prefix = "PACK";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let generatedPart = "";

  for (let i = 0; i < 6; i++) {
    generatedPart += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return `${prefix}${generatedPart}`;
};

export async function createInvitationCodes({
  packages,
  user_id,
  paymentMethod,
}: {
  packages: { packageName: string; amount: number; quantity: number }[];
  user_id: number;
  paymentMethod: string;
}) {
  try {
    if (!Array.isArray(packages) || packages.length === 0) {
      return {
        success: false,
        message: "Packages must be a non-empty array.",
        status: 400,
      };
    }

    // Fetch user's current credit
    const user: any = await prisma.pt_users.findUnique({
      where: { ID: user_id },
      select: { user_credits: true },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
        status: 404,
      };
    }

    const totalAmount = packages.reduce(
      (total, pkg) => total + pkg.amount * pkg.quantity,
      0
    );

    // Check if user has enough credit when paying with credits
    if (paymentMethod === "credits" && user.user_credits < totalAmount) {
      return {
        success: false,
        message: "Insufficient credit.",
        status: 400,
      };
    }

    const datePurchased = new Date().toISOString();
    const newCodes: any[] = [];

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (transactionPrisma) => {
      for (const pkg of packages) {
        const { packageName, amount, quantity } = pkg;

        for (let i = 0; i < quantity; i++) {
          const code = generateInvitationCode();
          const newCode = await transactionPrisma.pt_invitation_codes.create({
            data: {
              code,
              package: packageName || null,
              amount: parseFloat(amount.toString()) || null,
              user_id,
              date_purchased: datePurchased,
            },
          });
          newCodes.push(newCode);
        }
      }

      // Update user's credit if payment method is 'credits'
      if (paymentMethod === "credits") {
        await transactionPrisma.pt_users.update({
          where: { ID: user_id },
          data: { user_credits: { decrement: totalAmount } },
        });
      }
    });

    // Fetch updated user credit
    const updatedUser = await prisma.pt_users.findUnique({
      where: { ID: user_id },
      select: { user_credits: true },
    });

    return {
      success: true,
      message: "Invitation codes created successfully.",
      data: newCodes,
      updatedCredit: updatedUser?.user_credits,
      status: 201,
    };
  } catch (error: any) {
    console.error("Error creating invitation codes:", error);
    return {
      success: false,
      message: "Failed to create invitation codes.",
      error: error.message,
      status: 500,
    };
  }
}

export async function buyOwnInvitationCodes({
  packages,
  user_id,
  paymentMethod,
}: {
  packages: { packageName: string; amount: number; quantity: number }[];
  user_id: number;
  paymentMethod: string;
}) {
  try {
    if (!Array.isArray(packages) || packages.length === 0) {
      return {
        success: false,
        message: "Packages must be a non-empty array.",
        status: 400,
      };
    }

    // Fetch user's current credit
    const user: any = await prisma.pt_users.findUnique({
      where: { ID: user_id },
      select: { user_credits: true, user_status: true },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
        status: 404,
      };
    }

    const totalAmount = packages.reduce(
      (total, pkg) => total + pkg.amount * pkg.quantity,
      0
    );

    // Check if user has enough credit when paying with credits
    if (paymentMethod === "credits" && user.user_credits < totalAmount) {
      return {
        success: false,
        message: "Insufficient credit.",
        status: 400,
      };
    }

    const datePurchased = new Date().toISOString();
    const newCodes: any[] = [];

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (transactionPrisma) => {
      for (const pkg of packages) {
        const { packageName, amount, quantity } = pkg;

        for (let i = 0; i < quantity; i++) {
          const code = generateInvitationCode();
          const newCode = await transactionPrisma.pt_invitation_codes.create({
            data: {
              code,
              package: packageName || null,
              amount: parseFloat(amount.toString()) || null,
              user_id,
              redeemed_by: user_id, // Set redeemed_by to the purchaser's user_id
              date_purchased: datePurchased,
            },
          });
          newCodes.push(newCode);
        }
      }

      // Update user's credit if payment method is 'credits'
      if (paymentMethod === "credits") {
        await transactionPrisma.pt_users.update({
          where: { ID: user_id },
          data: { user_credits: { decrement: totalAmount } },
        });
      }

      // Update user status to 1
      await transactionPrisma.pt_users.update({
        where: { ID: user_id },
        data: { user_status: 1 },
      });
    });

    // Fetch updated user credit and status
    const updatedUser = await prisma.pt_users.findUnique({
      where: { ID: user_id },
      select: { user_credits: true, user_status: true },
    });

    return {
      success: true,
      message: "Invitation codes created successfully.",
      data: newCodes,
      updatedCredit: updatedUser?.user_credits,
      updatedStatus: updatedUser?.user_status,
      status: 201,
    };
  } catch (error: any) {
    console.error("Error creating invitation codes:", error);
    return {
      success: false,
      message: "Failed to create invitation codes.",
      error: error.message,
      status: 500,
    };
  }
}

interface InvitationCodeResponse {
  success: boolean;
  data?: {
    user_role: string;
    user_id: number | null;
    user_level: number | null;
  };
  error?: string;
  status: number;
}

export async function getInvitationCodeByCodeforRegister(
  code: string
): Promise<InvitationCodeResponse> {
  if (!code || code.length !== 10) {
    return {
      success: false,
      error: "Invalid code format",
      status: 400,
    };
  }

  try {
    console.log("Received Code:", code);

    // Fetch the invitation code details
    const invitation = await prisma.pt_invitation_codes.findFirst({
      where: {
        code,
        redeemed_by: null, // Ensure the code hasn't been used
      },
      select: {
        package: true,
        user_id: true,
      },
    });

    console.log("Invitation Query Result:", invitation);

    if (!invitation) {
      return {
        success: false,
        error: "Invitation code not found or has been used",
        status: 404,
      };
    }

    // Fetch the user details
    const user = await prisma.pt_users.findFirst({
      where: {
        ID: invitation.user_id as number, // Ensures it's a valid number
      },
      select: {
        ID: true,
        user_level: true,
      },
    });

    console.log("User Query Result:", user);

    if (!invitation.package || !invitation.user_id) {
      return {
        success: false,
        error: "Invalid invitation code details",
        status: 400,
      };
    }

    return {
      success: true,
      data: {
        user_role: invitation.package,
        user_id: invitation.user_id,
        user_level: user?.user_level ?? null, // Explicitly handle null values
      },
      status: 200,
    };
  } catch (error) {
    console.error("Error fetching invitation code:", error);
    return {
      success: false,
      error: "An error occurred while fetching the invitation code",
      status: 500,
    };
  } 
}

export async function getActivationCodes(userId: number) {
  try {
    const codes = await prisma.pt_invitation_codes.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const codesWithRedeemerNames = await Promise.all(
      codes.map(async (code) => {
        if (code.redeemed_by) {
          const redeemer = await prisma.pt_users.findUnique({
            where: { ID: code.redeemed_by },
            select: { user_nicename: true },
          });
          return {
            ...code,
            redeemed_by_name: redeemer?.user_nicename || null,
          };
        }
        return {
          ...code,
          redeemed_by_name: null,
        };
      })
    );

    return codesWithRedeemerNames;
  } catch (error) {
    console.error('Failed to fetch activation codes:', error);
    throw error;
  } 
}

export async function getAvailableCodes(userId: number, pkg: string) {
  try {
    const user = await prisma.pt_invitation_codes.findMany({
      where: { user_id: userId, redeemed_by: null, package: pkg},
      select: {
        user_id: true,
        id: true,
        code: true,
        package: true,
        amount: true,
        redeemed_by: true,
        date_purchased:true,
        created_at: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching available codes:", error);
    throw error;
  }
}