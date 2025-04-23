"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma-singleton";
import { z } from "zod";

// Define sensitive fields that require verification
const SENSITIVE_FIELDS = [
  "bank_name",
  "bank_account_number",
  "cf_share",
  "merchant_id",
  "terminal_id",
  "user_pass",
];

// Schema for bank details update
const BankDetailsSchema = z.object({
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  cf_share: z.number().optional(),
  merchant_id: z.string().optional(),
  terminal_id: z.string().optional(),
});

// Schema for update request
const UpdateRequestSchema = z.object({
  userId: z.number(),
  updates: BankDetailsSchema,
  userRole: z.string(),
});

/**
 * Process updates to bank details
 * - Admin updates are applied immediately
 * - Non-admin updates are stored as pending updates for verification
 */
export async function updateBankDetails(
  data: z.infer<typeof UpdateRequestSchema>
) {
  try {
    // Validate input data
    const validatedData = UpdateRequestSchema.parse(data);
    const { userId, updates, userRole } = validatedData;

    // Check if user exists
    const user = await prisma.pt_users.findUnique({
      where: { ID: userId },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // If user is admin, apply updates immediately
    if (userRole === "admin") {
      const updatedUser = await prisma.pt_users.update({
        where: { ID: userId },
        data: updates,
      });

      revalidatePath(`/users/${userId}`);
      revalidatePath("/admin/pending-updates");
      revalidatePath("/profile/bank-details");

      return {
        success: true,
        message: "Bank details updated successfully",
        data: updatedUser,
      };
    }
    // For non-admin users, create pending update requests
    else {
      // Create pending update entries for each field being updated
      const pendingUpdates = [];

      for (const [field, value] of Object.entries(updates)) {
        // Skip if field is not in sensitive fields list
        if (!SENSITIVE_FIELDS.includes(field) || value === undefined) {
          continue;
        }

        // Get current value for comparison
        const currentValue =
          user[field as keyof typeof user]?.toString() || null;
        const newValue = value?.toString() || "";

        // Only create pending update if the value has actually changed
        if (currentValue !== newValue) {
          // Create pending update
          const pendingUpdate = await prisma.pt_pending_updates.create({
            data: {
              user_id: userId,
              field_name: field,
              current_value: currentValue,
              requested_value: newValue,
              status: "pending",
              requested_at: new Date(),
            },
          });

          pendingUpdates.push(pendingUpdate);
        }
      }

      revalidatePath(`/users/${userId}`);
      revalidatePath("/admin/pending-updates");
      revalidatePath("/profile/bank-details");

      return {
        success: true,
        message:
          pendingUpdates.length > 0
            ? "Update request submitted for approval"
            : "No changes detected that require approval",
        data: pendingUpdates,
      };
    }
  } catch (error) {
    console.error("Error updating bank details:", error);
    return {
      success: false,
      message: "Failed to update bank details",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all pending update requests
 */
export async function getPendingUpdates(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;

    // Get pending updates with user information
    const pendingUpdates = await prisma.pt_pending_updates.findMany({
      where: {
        status: "pending",
      },
      include: {
        pt_users_pt_pending_updates_user_idTopt_users: {
          select: {
            ID: true,
            user_nicename: true,
            user_email: true,
            user_role: true,
          },
        },
      },
      orderBy: {
        requested_at: "asc", // Oldest first
      },
      skip,
      take: limit,
    });

    // Count total pending updates for pagination
    const totalCount = await prisma.pt_pending_updates.count({
      where: {
        status: "pending",
      },
    });

    return {
      success: true,
      data: pendingUpdates,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        pageSize: limit,
      },
    };
  } catch (error) {
    console.error("Error fetching pending updates:", error);
    return {
      success: false,
      message: "Failed to fetch pending updates",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get pending updates for a specific user
 */
export async function getUserPendingUpdates(userId: number) {
  try {
    const pendingUpdates = await prisma.pt_pending_updates.findMany({
      where: {
        user_id: userId,
        status: "pending",
      },
      orderBy: {
        requested_at: "desc",
      },
    });

    return {
      success: true,
      data: pendingUpdates,
    };
  } catch (error) {
    console.error("Error fetching user pending updates:", error);
    return {
      success: false,
      message: "Failed to fetch pending updates",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process (approve or reject) a pending update
 */
export async function processPendingUpdate(data: {
  updateId: number;
  action: "approve" | "reject";
  adminId: number;
  rejectionReason?: string;
}) {
  try {
    const { updateId, action, adminId, rejectionReason } = data;

    // Get the pending update with more detailed information
    const pendingUpdate = await prisma.pt_pending_updates.findUnique({
      where: { id: updateId },
      include: {
          pt_users_pt_pending_updates_user_idTopt_users: true, // Include user data using the correct relation name
      },
    });

    if (!pendingUpdate) {
      return {
        success: false,
        message: "Pending update not found",
      };
    }

    if (pendingUpdate.status !== "pending") {
      return {
        success: false,
        message: `This update has already been ${pendingUpdate.status}`,
      };
    }

    // Process based on action
    if (action === "approve") {
      // Update the user's field with the requested value
      // Use a dynamic field update to ensure the correct field is updated
      await prisma.pt_users.update({
        where: { ID: pendingUpdate.user_id },
        data: {
          [pendingUpdate.field_name]:
            pendingUpdate.field_name === "cf_share"
              ? Number.parseFloat(pendingUpdate.requested_value)
              : pendingUpdate.requested_value,
        },
      });

      // Update the pending update status
      await prisma.pt_pending_updates.update({
        where: { id: updateId },
        data: {
          status: "approved",
          processed_at: new Date(),
          processed_by_id: adminId,
        },
      });

      revalidatePath(`/users/${pendingUpdate.user_id}`);
      revalidatePath("/admin/pending-updates");
      revalidatePath("/profile/bank-details");

      return {
        success: true,
        message: "Update approved successfully",
      };
    } else {
      // Reject the update
      await prisma.pt_pending_updates.update({
        where: { id: updateId },
        data: {
          status: "rejected",
          processed_at: new Date(),
          processed_by_id: adminId,
          rejection_reason: rejectionReason || "No reason provided",
        },
      });

      revalidatePath(`/users/${pendingUpdate.user_id}`);
      revalidatePath("/admin/pending-updates");
      revalidatePath("/profile/bank-details");

      return {
        success: true,
        message: "Update rejected successfully",
      };
    }
  } catch (error) {
    console.error("Error processing pending update:", error);
    return {
      success: false,
      message: "Failed to process pending update",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get update history for a user
 */
export async function getUserUpdateHistory(userId: number) {
  try {
    const updateHistory = await prisma.pt_pending_updates.findMany({
      where: {
        user_id: userId,
      },
      include: {
        pt_users_pt_pending_updates_processed_by_idTopt_users: {
          select: {
            ID: true,
            user_nicename: true,
            user_email: true,
          },
        },
      },
      orderBy: {
        requested_at: "desc",
      },
    });

    return {
      success: true,
      data: updateHistory,
    };
  } catch (error) {
    console.error("Error fetching user update history:", error);
    return {
      success: false,
      message: "Failed to fetch update history",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
