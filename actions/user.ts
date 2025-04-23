"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma-singleton";
import bcrypt from "bcryptjs";
import { z } from "zod"; // You'll need to install this package if not already present
import { sendKYCEmail as sendEmail } from "@/lib/email_kyc";
import { sendWelcomeEmail } from "@/lib/email";

// ====== BASIC USER RETRIEVAL FUNCTIONS ======

export async function getAllUsers() {
  try {
    const users = await prisma.pt_users.findMany();
    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      message: "Failed to fetch users.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAllUsersWithUplineIdAndLevel() {
  try {
    const users = await prisma.pt_users.findMany({
      where: {
        user_upline_id: {
          not: null, // Ensures the `user_upline_id` is not null
        },
        user_level: {
          not: null, // Ensures the `user_level` is not null
        },
      },
    });
    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      message: "Failed to fetch users.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUsersWithUplineIdAndLevelByUplineId(uplineId: number) {
  try {
    const users: any = await prisma.$queryRaw`
      WITH RECURSIVE user_hierarchy AS (
        -- Base case: Start with the user with the given uplineId
        SELECT *, 1 AS depth
        FROM pt_users
        WHERE ID = ${uplineId}
        AND user_upline_id IS NOT NULL
        AND user_level IS NOT NULL

        UNION ALL

        -- Recursive case: Find users whose upline_id matches the previous level's ID
        SELECT u.*, uh.depth + 1 AS depth
        FROM pt_users u
        INNER JOIN user_hierarchy uh ON u.user_upline_id = uh.ID
        WHERE uh.depth < 10 -- Limit to 10 levels deep
      )
      SELECT 
        ID,
        business_address,
        business_name,
        display_name,
        merchant_id,
        otp_code,
        otp_expiry,
        profile_pic_url,
        social_media_page,
        terminal_id,
        travel_agency,
        travel_logo_url,
        user_activation_key,
        user_contact_number,
        user_credits,
        user_email,
        user_kyc,
        user_level,
        user_login,
        user_nicename,
        user_pass,
        user_referral_code,
        user_referred_by_id,
        user_registered,
        user_role,
        user_status,
        user_upline_id,
        user_url
      FROM user_hierarchy;
    `;

    // Handle case where no users are returned
    if (!users || users.length === 0) {
      return {
        success: true,
        data: [],
        message: "No users found in the hierarchy.",
      };
    }

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Error fetching users by upline ID:", error);
    return {
      success: false,
      message: "Failed to fetch users.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUserProfile(userId: string) {
  if (!userId || isNaN(Number.parseInt(userId, 10))) {
    return {
      success: false,
      message: "Invalid or missing user_id.",
    };
  }

  try {
    const user = await prisma.pt_users.findUnique({
      where: { ID: Number.parseInt(userId, 10) },
      select: {
        ID: true,
        user_login: true,
        user_email: true,
        user_contact_number: true,
        user_level: true,
        user_role: true,
        user_credits: true,
        user_referral_code: true,
        user_registered: true,
        travel_agency: true,
        social_media_page: true,
        user_upline_id: true,
        profile_pic_url: true,
        travel_logo_url: true,
        merchant_id: true,
        user_kyc: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      success: false,
      message: "Failed to fetch user profile.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getRetailerCountById(userId: number) {
  if (!userId) {
    return {
      success: false,
      message: "User ID is required",
    };
  }

  try {
    const user = await prisma.pt_users.findUnique({
      where: { ID: userId },
      select: { retailer_count: true },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      data: user.retailer_count,
    };
  } catch (error) {}
}

export async function getUserRole(userId: string) {
  if (!userId || isNaN(Number.parseInt(userId, 10))) {
    return {
      success: false,
      message: "Invalid or missing user_id.",
    };
  }

  try {
    const user = await prisma.pt_users.findUnique({
      where: { ID: Number.parseInt(userId, 10) },
      select: { user_role: true }, // Only fetching user_role
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    return {
      success: true,
      data: user.user_role,
    };
  } catch (error) {
    console.error("Error fetching user role:", error);
    return {
      success: false,
      message: "Failed to fetch user role.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUserInfo(userId: number) {
  try {
    const user = await prisma.pt_users.findUnique({
      where: { ID: userId },
      select: {
        ID: true,
        user_nicename: true,
        user_email: true,
        user_url: true,
        display_name: true,
        user_contact_number: true,
        merchant_id: true,
        business_name: true,
        business_address: true,
        travel_agency: true,
        social_media_page: true,
        profile_pic_url: true,
        travel_logo_url: true,
        user_kyc: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error("Error fetching user info:", error);
    throw error;
  }
}

// ====== USER MANAGEMENT FUNCTIONS ======

export async function updateProfile(data: any) {
  try {
    const { ID, current_password, new_password, ...updateData } = data;

    // Fetch the current user data
    const user = await prisma.pt_users.findUnique({ where: { ID } });
    if (!user) {
      return { success: false, message: "User not found." };
    }

    // If changing password, verify current password and hash new password
    if (current_password && new_password) {
      let isCurrentPasswordValid = false;

      // Check if the stored password is a bcrypt hash
      if (user.user_pass.startsWith("$2")) {
        // bcrypt hash
        isCurrentPasswordValid = await bcrypt.compare(
          current_password,
          user.user_pass
        );
      } else {
        // Plain text comparison (fallback)
        isCurrentPasswordValid = current_password === user.user_pass;
      }

      if (!isCurrentPasswordValid) {
        return { success: false, message: "Current password is incorrect." };
      }

      // Hash the new password with bcrypt
      const hashedNewPassword = await bcrypt.hash(new_password, 10);
      updateData.user_pass = hashedNewPassword;
    }

    // Update user data
    await prisma.pt_users.update({
      where: { ID },
      data: updateData,
    });

    revalidatePath("/profile/edit");
    return { success: true, message: "Profile updated successfully." };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      message: "An error occurred while updating the profile.",
    };
  }
}

export async function getOrganizationMembers(userId: number) {
  try {
    // Step 1: Fetch the organization tree using a recursive query
    const members: Array<{
      ID: number;
      user_nicename: string | null;
      user_email: string | null;
      user_role: string | null;
      merchant_id: string | null;
      business_name: string | null;
      travel_agency: string | null;
      social_media_page: string | null;
      travel_logo_url: string | null;
      user_status: number | null;
      user_registered: Date | null;
      level: number;
    }> = await prisma.$queryRaw`
      WITH RECURSIVE organization_tree AS (
        SELECT 
          ID, 
          user_upline_id, 
          user_nicename, 
          user_email, 
          user_role, 
          merchant_id, 
          business_name,
          travel_agency,
          social_media_page,
          travel_logo_url,
          user_status, 
          user_registered,
          0 AS level
        FROM pt_users
        WHERE ID = ${userId}

        UNION ALL

        SELECT 
          u.ID, 
          u.user_upline_id, 
          u.user_nicename, 
          u.user_email, 
          u.user_role, 
          u.merchant_id, 
          u.business_name,
          u.travel_agency,
          u.social_media_page,
          u.travel_logo_url,
          u.user_status, 
          u.user_registered,
          ot.level + 1
        FROM pt_users u
        JOIN organization_tree ot ON u.user_upline_id = ot.ID
        WHERE ot.level < 9
      )
      SELECT 
        ID, 
        user_nicename, 
        user_email, 
        user_role, 
        merchant_id, 
        business_name,
        travel_agency,
        social_media_page,
        travel_logo_url,
        user_status, 
        user_registered,
        level
      FROM organization_tree
      WHERE ID != ${userId}
      ORDER BY level, user_nicename;
    `;

    // Step 2: Extract merchant IDs and fetch transactions in a single query
    const merchantIds = members
      .filter((member) => member.merchant_id)
      .map((member) => member.merchant_id);

    const transactions = await prisma.pt_atm_transaction.findMany({
      where: {
        merchant_id: {
          in: merchantIds.filter((id): id is string => id !== null),
        },
        status: "approved",
      },
      orderBy: {
        approved_date: "desc",
      },
      select: {
        merchant_id: true,
        approved_date: true,
      },
    });

    // Step 3: Map transactions to members
    const membersWithTransactions = members.map((member) => {
      const transaction = transactions.find(
        (t) => t.merchant_id === member.merchant_id
      );
      return {
        ...member,
        latestTransaction: transaction
          ? { approved_date: transaction.approved_date }
          : null,
      };
    });

    return { success: true, data: membersWithTransactions };
  } catch (error) {
    console.error("Error fetching organization members:", error);
    return { success: false, error: "Error fetching organization members" };
  }
}

export type UserRole =
  | "Basic_Merchant_Package"
  | "Premium_Merchant_Package"
  | "Elite_Distributor_Package"
  | "Elite_Plus_Distributor_Package";

// ====== USER FILTERING AND SEARCH FUNCTIONS ======

export async function getUsersMerchant(filters: any = {}, sorting: any = []) {
  try {
    const where = {
      ...(filters.role && {
        user_role:
          filters.role === "Package" ? { contains: "Package" } : filters.role,
      }),
      ...(filters.search && {
        OR: [
          { user_login: { contains: filters.search } },
          { user_email: { contains: filters.search } },
          { display_name: { contains: filters.search } },
          { business_name: { contains: filters.search } },
        ],
      }),
      ...(filters.dateRange && {
        user_registered: {
          gte: filters.dateRange.from
            ? new Date(filters.dateRange.from)
            : undefined,
          lte: filters.dateRange.to
            ? new Date(filters.dateRange.to)
            : undefined,
        },
      }),
      ...(filters.creditRange && {
        user_credits: {
          gte: filters.creditRange[0],
          lte: filters.creditRange[1],
        },
      }),
      // Add this condition to always include users with 'package' in their role
      OR: [
        { user_role: { contains: "package" } },
        ...(filters.role && filters.role !== "package"
          ? [{ user_role: filters.role }]
          : []),
      ],
    };

    const users = await prisma.pt_users.findMany({
      where,
      orderBy:
        sorting.length > 0
          ? sorting.map((sort: any) => ({
              [sort.id]: sort.desc ? "desc" : "asc",
            }))
          : { ID: "desc" }, // Ensure sorting by ID by default
    });

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function getUsersAdmin(filters: any = {}, sorting: any = []) {
  try {
    const allowedRoles = [
      "admin",
      "uploader",
      "verifier",
      "approver",
      "kyc_approver",
      "voucher_uploader",
      "travel_approver",
    ];

    const where = {
      user_role: { in: allowedRoles },
      ...(filters.role &&
        allowedRoles.includes(filters.role) && { user_role: filters.role }),
      ...(filters.search && {
        OR: [
          { user_login: { contains: filters.search } },
          { user_email: { contains: filters.search } },
          { display_name: { contains: filters.search } },
          { business_name: { contains: filters.search } },
        ],
      }),
      ...(filters.dateRange && {
        user_registered: {
          gte: filters.dateRange.from
            ? new Date(filters.dateRange.from)
            : undefined,
          lte: filters.dateRange.to
            ? new Date(filters.dateRange.to)
            : undefined,
        },
      }),
      ...(filters.creditRange && {
        user_credits: {
          gte: filters.creditRange[0],
          lte: filters.creditRange[1],
        },
      }),
    };

    const users = await prisma.pt_users.findMany({
      where,
      orderBy:
        sorting.length > 0
          ? sorting.map((sort: any) => ({
              [sort.id]: sort.desc ? "desc" : "asc",
            }))
          : { ID: "desc" }, // Ensure sorting by ID by default
    });

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

// ====== ORGANIZATION AND HIERARCHICAL USER RETRIEVAL ======

export async function getAllRegisteredUser(userId: number) {
  try {
    // Recursive query to get all members under a specific root user with user_status = 0
    const members = await prisma.$queryRaw`
      WITH RECURSIVE organization_tree AS (
        -- Base case: Select the root user with user_status = 0
        SELECT 
          ID, 
          user_nicename, 
          user_email, 
          user_role, 
          user_upline_id, 
          merchant_id,
          business_name, 
          business_address,
          social_media_page,
          travel_logo_url,
          travel_agency,
          user_status,
          user_registered
        FROM pt_users
        WHERE ID = ${userId}

        UNION ALL

        -- Recursive case: Select all members whose upline is in the organization_tree and have user_status = 0
        SELECT 
          u.ID, 
          u.user_nicename, 
          u.user_email, 
          u.user_role, 
          u.user_upline_id, 
          u.merchant_id,
          u.business_name, 
          u.business_address, 
          u.travel_agency,
          u.social_media_page,
          u.travel_logo_url,
          u.user_status,
          u.user_registered
        FROM pt_users u
        JOIN organization_tree ot ON u.user_upline_id = ot.ID
        WHERE u.user_status = 0  -- Ensure only members with user_status = 0 are included
      )
      -- Select from the recursive tree, excluding the root user and filtering by user_status = 0
      SELECT 
        ID, 
        user_nicename, 
        user_email, 
        user_role, 
        merchant_id, 
        business_name, 
        business_address,
        user_status,
        user_registered
      FROM organization_tree
      WHERE ID != ${userId} -- Excluding the root member and only returning active members
    `;

    // Return the result in the correct format
    return { success: true, data: members };
  } catch (error) {
    console.error("Error fetching organization members:", error);
    return { success: false, error: "Error fetching organization members" };
  }
}

export async function getRegisteredUserInfo(userId: number) {
  try {
    const user = await prisma.pt_users.findUnique({
      where: { ID: userId },
      select: {
        ID: true,
        user_login: true,
        user_pass: true,
        user_nicename: true,
        user_email: true,
        user_contact_number: true,
        user_url: true,
        user_registered: true,
        user_activation_key: true,
        user_status: true,
        display_name: true,
        user_role: true,
        user_level: true,
        user_upline_id: true,
        user_credits: true,
        user_referral_code: true,
        user_referred_by_id: true,
        merchant_id: true,
        business_name: true,
        business_address: true,
        travel_agency: true,
        social_media_page: true,
        travel_logo_url: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error("Error fetching user info:", error);
    throw error;
  }
}

// ====== USER DATA VALIDATION FUNCTIONS ======

export async function isEmailExist(user_email: string) {
  try {
    // Use findUnique for unique constraints
    const existingUser = await prisma.pt_users.findUnique({
      where: {
        user_email: user_email.trim().toLowerCase(), // Normalize email
      },
      select: { ID: true }, // Only get necessary field
    });

    return !!existingUser;
  } catch (error) {
    console.error("Error checking email existence:", error);
    throw new Error("Failed to verify email availability");
  }
}

export async function adminUpdateUser(data: any) {
  try {
    const { ID, ...updateData } = data;

    // Fetch the current user data to verify it exists
    const user = await prisma.pt_users.findUnique({ where: { ID } });
    if (!user) {
      return { success: false, message: "User not found." };
    }

    // Update user data
    await prisma.pt_users.update({
      where: { ID },
      data: updateData,
    });

    // Revalidate the admin users page
    revalidatePath("/admin/users");

    return { success: true, message: "User updated successfully." };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      message: "An error occurred while updating the user.",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ====== NEW FUNCTIONS ======

// Function to get user info by multiple IDs (safer version)
export async function getUserInfoByIds(userIds: number[]) {
  if (!userIds || userIds.length === 0) {
    return {
      success: false,
      error: "No user IDs provided",
      data: null,
    };
  }

  try {
    // Using Prisma instead of raw queries for type safety and SQL injection prevention
    const users = await prisma.pt_users.findMany({
      where: {
        ID: {
          in: userIds, // This is safe - Prisma handles parameterization
        },
      },
      select: {
        ID: true,
        user_nicename: true,
        display_name: true,
        user_login: true,
      },
    });

    // Format the response with the same logic as original function
    const formattedUsers = users.map((user) => ({
      id: user.ID,
      nicename:
        user.user_nicename ||
        user.display_name ||
        user.user_login ||
        `User #${user.ID}`,
    }));

    return {
      success: true,
      data: formattedUsers,
    };
  } catch (error) {
    console.error("Error fetching user information:", error);
    return {
      success: false,
      error: "Failed to fetch user information",
      data: null,
    };
  }
}

// Function to search users by name/email with pagination
export async function searchUsers(query: string, page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize;

    const users = await prisma.pt_users.findMany({
      where: {
        OR: [
          { user_nicename: { contains: query } },
          { user_email: { contains: query } },
          { display_name: { contains: query } },
          { user_login: { contains: query } },
        ],
      },
      select: {
        ID: true,
        user_nicename: true,
        display_name: true,
        user_email: true,
        user_role: true,
        user_registered: true,
      },
      skip,
      take: pageSize,
      orderBy: {
        user_registered: "desc",
      },
    });

    const totalCount = await prisma.pt_users.count({
      where: {
        OR: [
          { user_nicename: { contains: query } },
          { user_email: { contains: query } },
          { display_name: { contains: query } },
          { user_login: { contains: query } },
        ],
      },
    });

    return {
      success: true,
      data: users,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        pageSize,
      },
    };
  } catch (error) {
    console.error("Error searching users:", error);
    return {
      success: false,
      error: "Failed to search users",
    };
  }
}

// Zod schema for input validation
const UserStatusUpdateSchema = z.object({
  userId: z.number(),
  status: z.number().min(0).max(1),
});

// Function to update user status with validation
export async function updateUserStatus(data: {
  userId: number;
  status: number;
}) {
  try {
    // Validate input
    const validated = UserStatusUpdateSchema.parse(data);

    const result = await prisma.pt_users.update({
      where: { ID: validated.userId },
      data: { user_status: validated.status },
    });

    revalidatePath("/admin/users");

    return {
      success: true,
      message: `User status updated to ${
        validated.status === 0 ? "Active" : "Inactive"
      }`,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        details: error.errors,
      };
    }

    console.error("Error updating user status:", error);
    return {
      success: false,
      error: "Failed to update user status",
    };
  }
}

// Function to get user statistics
export async function getUserStatistics() {
  try {
    const totalUsers = await prisma.pt_users.count();

    const usersByRole = await prisma.$queryRaw`
      SELECT user_role, COUNT(*) as count 
      FROM pt_users 
      GROUP BY user_role
    `;

    const recentUsers = await prisma.pt_users.findMany({
      select: {
        ID: true,
        user_nicename: true,
        user_email: true,
        user_role: true,
        user_registered: true,
      },
      orderBy: {
        user_registered: "desc",
      },
      take: 5,
    });

    return {
      success: true,
      data: {
        totalUsers,
        usersByRole,
        recentUsers,
      },
    };
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    return {
      success: false,
      error: "Failed to fetch user statistics",
    };
  }
}

// Function to bulk update user credits
export async function bulkUpdateUserCredits(
  userIds: number[],
  creditAdjustment: number
) {
  if (!userIds || userIds.length === 0) {
    return {
      success: false,
      error: "No user IDs provided",
    };
  }

  try {
    // Start a transaction to ensure all updates succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // For each user, update their credits
      const updates = await Promise.all(
        userIds.map(async (userId) => {
          const user = await tx.pt_users.findUnique({
            where: { ID: userId },
            select: { user_credits: true },
          });

          if (!user) return null;

          // Calculate new credit value, ensuring it doesn't go below 0
          const newCredits = Math.max(
            0,
            (user.user_credits || 0) + creditAdjustment
          );

          return tx.pt_users.update({
            where: { ID: userId },
            data: { user_credits: newCredits },
          });
        })
      );

      // Filter out nulls (users not found)
      return updates.filter(Boolean);
    });

    revalidatePath("/admin/users");

    return {
      success: true,
      message: `Updated credits for ${result.length} users`,
      data: result,
    };
  } catch (error) {
    console.error("Error updating user credits:", error);
    return {
      success: false,
      error: "Failed to update user credits",
    };
  }
}

// ====== KYC VERIFICATION FUNCTIONS ======

export async function uploadKYC(data: {
  userId: number;
  validIdUrl: string;
  selfieUrl: string;
}) {
  try {
    const { userId, validIdUrl, selfieUrl } = data;

    // Validate required fields
    if (!userId || !validIdUrl || !selfieUrl) {
      return { success: false, message: "Missing required fields." };
    }

    // Create KYC record
    await prisma.pt_users_kyc.create({
      data: {
        user_id: userId,
        valid_id_url: validIdUrl,
        selfie_pic_url: selfieUrl,
        status: "pending",
        date_submitted: new Date(),
      },
    });

    // Update the pt_users table setting user_kyc to 0 for this user
    await prisma.pt_users.update({
      where: { ID: userId },
      data: { user_kyc: 0 },
    });

    revalidatePath("/user-dashboard/");

    return { success: true, message: "KYC submitted successfully!" };
  } catch (error) {
    console.error("KYC Submission Error:", error);
    return {
      success: false,
      message: "Failed to submit KYC documents",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function kycVerificationRequestByUserId(userId: number) {
  try {
    // Fetch KYC request by user ID
    const kycRequest = await prisma.pt_users_kyc.findFirst({
      where: { user_id: userId },
      select: {
        user_id: true,
        valid_id_url: true,
        selfie_pic_url: true,
        status: true,
        date_submitted: true,
        reason_of_reject: true,
        date_approve_denied: true,
      },
    });

    if (!kycRequest) {
      return { success: false, message: "KYC request not found." };
    }

    return { success: true, data: kycRequest };
  } catch (error) {
    console.error("Error fetching KYC request:", error);
    return {
      success: false,
      message: "Failed to fetch KYC request.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUserKYCStatus(userId: string) {
  try {
    const kycStatus = await prisma.pt_users.findUnique({
      where: { ID: Number.parseInt(userId, 10) },
      select: {
        user_kyc: true,
      },
    });

    return {
      success: true,
      data: kycStatus?.user_kyc,
    };
  } catch (error) {
    console.error("Error fetching KYC status:", error);
    return {
      success: false,
      message: "Failed to fetch KYC status",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAllKYCVerification() {
  try {
    console.log("Executing getAllKYCVerification server action");

    // Check if the prisma client is properly initialized
    if (!prisma) {
      console.error("Prisma client is not initialized");
      return {
        success: false,
        message: "Database connection error",
        error: "Prisma client is not initialized",
      };
    }

    // Try to access the pt_users_kyc table
    const kycRequests = await prisma.pt_users_kyc.findMany({
      select: {
        user_id: true,
        valid_id_url: true,
        selfie_pic_url: true,
        status: true,
        date_submitted: true,
        date_approve_denied: true,
        reason_of_reject: true,
      },
      orderBy: {
        date_submitted: "desc",
      },
    });

    console.log(`Found ${kycRequests.length} KYC requests`);

    return { success: true, data: kycRequests };
  } catch (error) {
    console.error("Error fetching all KYC verifications:", error);

    // Provide more detailed error information
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific Prisma errors
      if (
        errorMessage.includes("Table") &&
        errorMessage.includes("does not exist")
      ) {
        errorMessage =
          "The KYC verification table does not exist in the database";
      }
    }

    return {
      success: false,
      message: "Failed to fetch KYC verifications.",
      error: errorMessage,
    };
  }
}

export async function updateKYCStatus(kycData: {
  user_id: number;
  status: string;
  rejection_reason?: string;
  sendNotification?: boolean;
}) {
  try {
    console.log(
      `Updating KYC status for user ID: ${kycData.user_id} to ${kycData.status}`
    );

    // Map the status string to the correct enum value
    // This assumes your Prisma schema has an enum like: enum pt_users_kyc_status { PENDING, APPROVED, REJECTED }
    let statusValue;
    switch (kycData.status.toLowerCase()) {
      case "approved":
        statusValue = "APPROVED";
        break;
      case "rejected":
      case "denied":
        statusValue = "REJECTED";
        break;
      case "pending":
      default:
        statusValue = "PENDING";
        break;
    }

    // Update the KYC status in the database
    const updatedKYC = await prisma.pt_users_kyc.update({
      where: { user_id: kycData.user_id },
      data: {
        status: statusValue, // Use the mapped enum value
        reason_of_reject: kycData.rejection_reason, // Using the correct field name
        date_approve_denied: new Date(),
      },
    });

    // If status is approved, update the user_kyc field in pt_users table to 1
    if (kycData.status.toLowerCase() === "approved") {
      try {
        console.log(
          `Updating user_kyc field to 1 for user ID: ${kycData.user_id}`
        );

        // Try to update the pt_users table
        await prisma.pt_users.update({
          where: { ID: kycData.user_id },
          data: { user_kyc: 1 },
        });

        console.log(
          `Successfully updated user_kyc field for user ID: ${kycData.user_id}`
        );
      } catch (error) {
        // Log the error but don't fail the whole operation
        console.error(
          `Error updating user_kyc field for user ID ${kycData.user_id}:`,
          error
        );
        console.log("Continuing with the KYC status update process...");
      }
    }

    // If notification is requested, send an email to the user
    if (kycData.sendNotification) {
      // Get user information to get the email address
      const userInfo = await getUserInfo(kycData.user_id);

      if (userInfo && userInfo.user_email) {
        console.log(`Sending notification email to ${userInfo.user_email}`);

        const userName =
          userInfo.user_nicename || userInfo.user_email.split("@")[0];
        const businessName = userInfo.business_name;

        if (kycData.status.toLowerCase() === "approved") {
          // Send approval email
          await sendEmail("approval", {
            email: userInfo.user_email,
            name: userName,
            businessName: businessName || undefined,
          });
        } else if (
          kycData.status.toLowerCase() === "rejected" ||
          kycData.status.toLowerCase() === "denied"
        ) {
          // Send rejection email
          await sendEmail("rejection", {
            email: userInfo.user_email,
            name: userName,
            businessName: businessName || undefined,
            rejectionReason:
              kycData.rejection_reason ||
              "Your submission did not meet our verification requirements.",
          });
        }
      } else {
        console.warn(
          `Could not send notification email: No email found for user ID ${kycData.user_id}`
        );
      }
    }

    return {
      success: true,
      data: updatedKYC,
      message: `KYC status updated to ${kycData.status} successfully`,
    };
  } catch (error) {
    console.error("Error updating KYC status:", error);
    return {
      success: false,
      message: "Failed to update KYC status.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ====== NEW FUNCTION: Get pending KYC verifications with pagination ======

export async function getPendingKYCVerifications(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;

    // Get only pending KYC requests with user information
    const pendingRequests = await prisma.pt_users_kyc.findMany({
      where: {
        status: "PENDING", // Using the enum value that matches your schema
      },
      select: {
        user_id: true,
        valid_id_url: true,
        selfie_pic_url: true,
        status: true,
        date_submitted: true,
      },
      skip,
      take: limit,
      orderBy: {
        date_submitted: "asc", // Oldest first, as they've been waiting longer
      },
    });

    // Count total pending requests for pagination
    const totalCount = await prisma.pt_users_kyc.count({
      where: {
        status: "PENDING",
      },
    });

    // Fetch user information for each pending KYC request
    const userIds = pendingRequests.map((request) => request.user_id);

    const users = await prisma.pt_users.findMany({
      where: {
        ID: {
          in: userIds,
        },
      },
      select: {
        ID: true,
        user_nicename: true,
        user_email: true,
        user_contact_number: true,
        business_name: true,
        user_registered: true,
      },
    });

    // Merge KYC data with user information
    const enrichedRequests = pendingRequests.map((request) => {
      const userInfo = users.find((user) => user.ID === request.user_id);
      return {
        ...request,
        user: userInfo || null,
      };
    });

    return {
      success: true,
      data: enrichedRequests,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        pageSize: limit,
      },
    };
  } catch (error) {
    console.error("Error fetching pending KYC verifications:", error);
    return {
      success: false,
      message: "Failed to fetch pending KYC requests",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUserByUuid(uid: string) {
  try {
    if (!uid) {
      return {
        success: false,
        message: "Invalid or missing user ID",
      };
    }

    // Try to parse the ID as an integer
    const userId = Number.parseInt(uid, 10);

    if (isNaN(userId)) {
      return {
        success: false,
        message: "Invalid user ID format",
      };
    }

    const user = await prisma.pt_users.findUnique({
      where: { ID: userId },
      select: {
        ID: true,
        user_nicename: true,
        user_email: true,
        user_login: true,
        display_name: true,
        business_name: true,
        travel_agency: true,
        social_media_page: true,
        travel_logo_url: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found with this ID",
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return {
      success: false,
      message: "Failed to fetch user information",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUsers(filters: any = {}, sorting: any = []) {
  try {
    // Build the where clause based on filters
    const where: any = {};

    if (filters.name) {
      where.user_nicename = {
        contains: filters.name,
      };
    }

    if (filters.email) {
      where.user_email = {
        contains: filters.email,
      };
    }

    if (filters.role && filters.role !== "all") {
      where.user_role = filters.role;
    }

    if (filters.status !== undefined && filters.status !== "all") {
      where.user_status = filters.status;
    }

    if (filters.merchantId) {
      where.merchant_id = {
        contains: filters.merchantId,
      };
    }

    if (filters.businessName) {
      where.business_name = {
        contains: filters.businessName,
      };
    }

    if (filters.dateRange && (filters.dateRange.from || filters.dateRange.to)) {
      where.user_registered = {};

      if (filters.dateRange.from) {
        where.user_registered.gte = filters.dateRange.from;
      }

      if (filters.dateRange.to) {
        where.user_registered.lte = filters.dateRange.to;
      }
    }

    if (filters.hasCredits) {
      where.user_credits = {
        gt: 0,
      };
    }

    // Build the orderBy clause based on sorting
    const orderBy: any[] = [];

    if (sorting && sorting.length > 0) {
      sorting.forEach((sort: any) => {
        orderBy.push({
          [sort.id]: sort.desc ? "desc" : "asc",
        });
      });
    } else {
      // Default sorting
      orderBy.push({ ID: "desc" });
    }

    // Execute the query
    const users = await prisma.pt_users.findMany({
      where,
      orderBy,
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      message: "Failed to fetch users",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get a single user by ID
export async function getUserById(id: number) {
  try {
    const user = await prisma.pt_users.findUnique({
      where: { ID: id },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      success: false,
      message: "Failed to fetch user",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Create a new user
export async function createUser(data: any) {
  try {
    // Check if username already exists
    const existingName = await prisma.pt_users.findFirst({
      where: { user_nicename: data.user_nicename },
      select: { ID: true },
    });

    if (existingName) {
      return {
        success: false,
        message: "Name already exists",
      };
    }

    // Check if email already exists
    if (data.user_email) {
      const existingEmail = await prisma.pt_users.findFirst({
        where: { user_email: data.user_email },
      });

      if (existingEmail) {
        return {
          success: false,
          message: "Email already exists",
        };
      }
    }

    // Check if merchant ID already exists
    if (data.merchant_id) {
      const existingMerchantId = await prisma.pt_users.findFirst({
        where: { merchant_id: data.merchant_id },
      });

      if (existingMerchantId) {
        return {
          success: false,
          message: "Merchant ID already exists",
        };
      }
    }

    // Hash the password if provided
    if (data.user_pass) {
      data.user_pass = await bcrypt.hash(data.user_pass, 10);
    }

    // Set registration date if not provided
    if (!data.user_registered) {
      data.user_registered = new Date();
    }

    // Create the user
    const newUser = await prisma.pt_users.create({
      data: data,
    });

    // Revalidate the users page
    revalidatePath("/users");

    return {
      success: true,
      data: newUser,
      message: "User created successfully",
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      message: "Failed to create user",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Update a user
export async function updateUser(data: any) {
  try {
    const { ID, ...updateData } = data;

    if (!ID) {
      return {
        success: false,
        message: "User ID is required",
      };
    }

    // Check if user exists
    const existingUser = await prisma.pt_users.findUnique({
      where: { ID },
    });

    if (!existingUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Check if email already exists (if it was changed)
    if (
      updateData.user_email &&
      updateData.user_email !== existingUser.user_email
    ) {
      const duplicateEmail = await prisma.pt_users.findFirst({
        where: {
          user_email: updateData.user_email,
          ID: { not: ID },
        },
      });

      if (duplicateEmail) {
        return {
          success: false,
          message: "Email already exists",
        };
      }
    }

    // Check if merchant ID already exists (if it was changed)
    if (
      updateData.merchant_id &&
      updateData.merchant_id !== existingUser.merchant_id
    ) {
      const duplicateMerchantId = await prisma.pt_users.findFirst({
        where: {
          merchant_id: updateData.merchant_id,
          ID: { not: ID },
        },
      });

      if (duplicateMerchantId) {
        return {
          success: false,
          message: "Merchant ID already exists",
        };
      }
    }

    // Hash the password if provided
    if (updateData.user_pass) {
      updateData.user_pass = await bcrypt.hash(updateData.user_pass, 10);
    }

    // Update the user
    const updatedUser = await prisma.pt_users.update({
      where: { ID },
      data: updateData,
    });

    // Revalidate the users page
    revalidatePath("/users");

    return {
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      message: "Failed to update user",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Delete a user
export async function deleteUser(id: number) {
  try {
    // Check if user exists
    const existingUser = await prisma.pt_users.findUnique({
      where: { ID: id },
    });

    if (!existingUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Delete the user
    await prisma.pt_users.delete({
      where: { ID: id },
    });

    // Revalidate the users page
    revalidatePath("/users");

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      message: "Failed to delete user",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Check if merchant ID already exists
export async function checkMerchantIdExists(merchantId: string) {
  try {
    const user = await prisma.pt_users.findFirst({
      where: { merchant_id: merchantId },
      select: { ID: true },
    });

    return {
      exists: !!user,
      success: true,
    };
  } catch (error) {
    console.error("Error checking merchant ID:", error);
    return {
      success: false,
      message: "Failed to check merchant ID",
      error: error instanceof Error ? error.message : "Unknown error",
      exists: false,
    };
  }
}

const BulkUserSchema = z.object({
  user_nicename: z.string().min(1, "Name is required"),
  user_email: z.string().email("Invalid email format"),
  user_login: z.string().optional(),
  user_pass: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  user_contact_number: z.string().optional(),
  user_role: z.string().optional(),
  user_level: z.number().optional(),
  user_upline_id: z.number().optional(),
  user_credits: z.number().optional(),
  user_status: z.number().optional(),
  merchant_id: z.string().optional(),
  terminal_id: z.string().optional(),
  business_name: z.string().optional(),
  business_address: z.string().optional(),
  retailer_count: z.number().optional(),
  travel_agency: z.string().optional(),
  social_media_page: z.string().optional(),
  user_registered: z.string().optional(),
  display_name: z.string().optional(),
});

export type BulkUserInput = z.infer<typeof BulkUserSchema>;

// Function to validate a single user
const validateUser = async (userData: BulkUserInput) => {
  try {
    // Validate against schema
    BulkUserSchema.parse(userData);

    // Check if email already exists
    if (userData.user_email) {
      const existingEmail = await prisma.pt_users.findFirst({
        where: { user_email: userData.user_email },
      });

      if (existingEmail) {
        return {
          success: false,
          message: `Email ${userData.user_email} already exists`,
        };
      }
    }

    // Check if username already exists
    if (userData.user_login) {
      const existingUsername = await prisma.pt_users.findFirst({
        where: { user_login: userData.user_login },
      });

      if (existingUsername) {
        return {
          success: false,
          message: `Username ${userData.user_login} already exists`,
        };
      }
    }

    // Check if merchant ID already exists
    if (userData.merchant_id) {
      const existingMerchantId = await prisma.pt_users.findFirst({
        where: { merchant_id: userData.merchant_id },
      });

      if (existingMerchantId) {
        return {
          success: false,
          message: `Merchant ID ${userData.merchant_id} already exists`,
        };
      }
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors.map((e) => `${e.path}: ${e.message}`).join(", "),
      };
    }
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown validation error",
    };
  }
};

// Function to create a single user
const createSingleUser = async (userData: BulkUserInput) => {
  try {
    // Format date properly
    const formattedData: any = { ...userData };
    let password = "";

    // Handle user_registered date format
    if (userData.user_registered) {
      try {
        // Try to parse the date
        const date = new Date(userData.user_registered);
        if (!isNaN(date.getTime())) {
          formattedData.user_registered = date;
        } else {
          delete formattedData.user_registered; // Remove invalid date
        }
      } catch (e) {
        delete formattedData.user_registered; // Remove invalid date
      }
    } else {
      formattedData.user_registered = new Date(); // Default to current date
    }

    // Hash password if provided
    if (formattedData.user_pass) {
      password = formattedData.user_pass; // Store the plain password before hashing
      formattedData.user_pass = await bcrypt.hash(formattedData.user_pass, 10);
    } else {
      const generatedPassword = generateRandomPassword();
      password = generatedPassword;
      formattedData.user_pass = await bcrypt.hash(generatedPassword, 10);
    }

    // Generate username if not provided
    if (!formattedData.user_login) {
      formattedData.user_login =
        formattedData.user_email.split("@")[0] +
        Math.floor(Math.random() * 1000);
    }

    // Set display_name if not provided
    if (!formattedData.display_name) {
      formattedData.display_name = formattedData.user_nicename;
    }

    // Create the user
    const newUser = await prisma.pt_users.create({
      data: formattedData,
    });

    return {
      success: true,
      data: newUser,
      password, // Return the plain password
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error creating user",
    };
  }
};

// Main bulk upload function - Modified to process users in batches of 2
// Bulk upload users

export async function bulkUploadUsers(
  userData: BulkUserInput,
  shouldSendWelcomeEmail = false,
  emailTemplate?: string,
  antiSpamFeatures?: {
    dkim: boolean;
    spf: boolean;
    personalizedSubject: boolean;
    unsubscribeLink: boolean;
    plainTextAlternative: boolean;
  }
) {
  try {
    const formattedData: any = { ...userData };
    let password = "";

    if (userData.user_registered) {
      try {
        const date = new Date(userData.user_registered);
        if (!isNaN(date.getTime())) {
          formattedData.user_registered = date;
        } else {
          delete formattedData.user_registered;
        }
      } catch (e) {
        delete formattedData.user_registered;
      }
    } else {
      formattedData.user_registered = new Date();
    }

    if (formattedData.user_pass) {
      password = formattedData.user_pass;
      formattedData.user_pass = await bcrypt.hash(formattedData.user_pass, 10);
    } else {
      const generatedPassword = generateRandomPassword();
      password = generatedPassword;
      formattedData.user_pass = await bcrypt.hash(generatedPassword, 10);
    }

    if (!formattedData.user_login) {
      formattedData.user_login =
        formattedData.user_email.split("@")[0] +
        Math.floor(Math.random() * 1000);
    }

    if (!formattedData.display_name) {
      formattedData.display_name = formattedData.user_nicename;
    }

    const newUser: any = await prisma.pt_users.create({
      data: formattedData,
    });

    if (shouldSendWelcomeEmail) {
      try {
        await sendWelcomeEmail(
          newUser.user_email,
          newUser,
          password,
          emailTemplate,
          antiSpamFeatures
        );
      } catch (emailError) {
        console.error(
          `Failed to send welcome email to ${newUser.user_email}:`,
          emailError
        );
      }
    }

    revalidatePath("/users");

    return {
      success: true,
      data: newUser,
      message: "User created successfully",
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error creating user",
      message: "Failed to create user",
    };
  }
}

export async function updatePassword({
  ID,
  password,
}: {
  ID: number;
  password: string;
}) {
  if (!ID || !password) {
    return {
      success: false,
      message: "User ID and password are required",
    };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.pt_users.update({
      where: { ID },
      data: {
        user_pass: hashedPassword, // ✅ this matches your Prisma schema
      },
    });

    return {
      success: true,
      user: updatedUser,
      plainPassword: password, // return plain password for email use
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      message: "Failed to update password",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to generate a secure random password
function generateRandomPassword(): string {
  //this is the format for the password
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Function to validate bulk upload data without creating users
export async function validateBulkUsers(users: BulkUserInput[]) {
  const results = {
    valid: [] as BulkUserInput[],
    invalid: [] as { user: BulkUserInput; error: string }[],
    total: users.length,
  };

  // Validate all users
  const validationResults = await Promise.all(
    users.map(async (user) => {
      const validation = await validateUser(user);
      return {
        user,
        validation,
      };
    })
  );

  // Process validation results
  for (const { user, validation } of validationResults) {
    if (validation.success) {
      results.valid.push(user);
    } else {
      results.invalid.push({
        user,
        error: validation.message || "Validation failed",
      });
    }
  }

  return {
    success: true,
    data: results,
    message: `${results.valid.length} out of ${results.total} users are valid`,
  };
}

export async function bulkUpdateUserRetailerCount(update: {
  ID: number;
  retailer_count: number;
}) {
  try {
    if (!update || !update.ID || update.retailer_count < 0) {
      return {
        success: false,
        message: `Invalid data for user ID ${update.ID || "unknown"}`,
      };
    }

    // Update single user
    await prisma.pt_users.update({
      where: { ID: update.ID },
      data: { retailer_count: update.retailer_count },
    });

    // Revalidate the users page
    revalidatePath("/users");

    return {
      success: true,
      message: `Updated retailer count for user ID ${update.ID}`,
      data: {
        ID: update.ID,
        retailer_count: update.retailer_count,
      },
    };
  } catch (error) {
    console.error("Error in bulkUpdateUserRetailerCount:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update retailer count",
    };
  }
}
