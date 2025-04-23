"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma-singleton";
import { z } from "zod";

// Zod schema for finding users
const FindUserSchema = z.object({
  identifier: z.string().min(3, "Search term must be at least 3 characters"),
});

/**
 * Search for users by ID, email, or phone number
 * @param data Search parameters including identifier
 * @returns Found user with minimal information for selection
 */
export async function findUserForTransfer(data: { identifier: string }) {
  try {
    // Validate input data
    const validated = FindUserSchema.parse(data);
    const { identifier } = validated;

    try {
      console.log("Search params:", { identifier });
    } catch (logError) {
      // Ignore logging errors
    }

    // Build flexible search query
    const where = {
      OR: [
        { merchant_id: identifier },
        { user_email: identifier },
        { user_contact_number: identifier },
      ],
      // Active users only (adjust value as needed for your app)
      user_status: 1,
    };

    try {
      console.log("Search query:", JSON.stringify(where));
    } catch (logError) {
      // Ignore logging errors
    }

    // Execute search query
    const user = await prisma.pt_users.findFirst({
      where,
      select: {
        ID: true,
        user_nicename: true,
        display_name: true,
        user_email: true,
        merchant_id: true,
        user_role: true,
      },
    });

    try {
      console.log("Search result:", user);
    } catch (logError) {
      // Ignore logging errors
    }

    if (!user) {
      return {
        success: false,
        error: "No user found with that ID, email, or phone number",
      };
    }

    return {
      success: true,
      data: {
        user,
      },
    };
  } catch (error) {
    // Safely log the error
    try {
      console.error("Error finding user for transfer:", error);
    } catch (logError) {
      console.error("Could not log the original error");
    }

    // Handle null or undefined error first
    if (!error) {
      return {
        success: false,
        error: "An unknown error occurred",
      };
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Updated Zod schema for credit transfer that includes the optional totalDeduction field
const CreditTransferSchema = z.object({
  senderId: z.number(),
  recipientIdentifier: z
    .string()
    .min(3, "Recipient identifier must be at least 3 characters"),
  amount: z.number().min(100).max(50000),
  serviceFee: z.number().min(0).max(1000),
  totalDeduction: z.number().optional(), // Optional parameter for explicit total deduction
  note: z.string().optional(),
});

/**
 * Transfer credits from one user to another
 * @param data Transfer details including sender, recipient, amount, service fee, and optional note
 * @returns Success status and transaction details
 */
export async function transferCredits(data: {
  senderId: number;
  recipientIdentifier: string;
  amount: number;
  serviceFee: number;
  totalDeduction?: number; // Optional parameter to provide explicit deduction amount
  note?: string;
}) {
  try {
    // Validate input data
    const validated = CreditTransferSchema.parse(data);
    const {
      senderId,
      recipientIdentifier,
      amount,
      serviceFee,
      totalDeduction,
      note,
    } = validated;

    try {
      console.log("Transfer params:", {
        senderId,
        recipientIdentifier,
        amount,
        serviceFee,
        totalDeduction,
      });
    } catch (logError) {
      // Ignore logging errors
    }

    // Get sender information
    const sender = await prisma.pt_users.findUnique({
      where: { ID: senderId },
      select: {
        ID: true,
        user_nicename: true,
        user_credits: true,
      },
    });

    if (!sender) {
      return {
        success: false,
        error: "Sender not found",
      };
    }

    // Use the provided totalDeduction if available, otherwise calculate it
    const actualDeduction =
      totalDeduction !== undefined ? totalDeduction : amount + serviceFee;

    // Check if sender has enough credits
    if ((sender.user_credits || 0) < actualDeduction) {
      return {
        success: false,
        error: `Insufficient credits. Required: ₱${actualDeduction.toLocaleString()}, Available: ₱${(
          sender.user_credits || 0
        ).toLocaleString()}`,
      };
    }

    // Build recipient search query
    const recipientWhere = {
      OR: [
        { merchant_id: recipientIdentifier },
        { user_email: recipientIdentifier },
        { user_contact_number: recipientIdentifier },
      ],
      user_status: 1, // Only active users
    };

    try {
      console.log("Recipient search query:", JSON.stringify(recipientWhere));
    } catch (logError) {
      // Ignore logging errors
    }

    const recipient = await prisma.pt_users.findFirst({
      where: recipientWhere,
      select: {
        ID: true,
        user_nicename: true,
        user_credits: true,
      },
    });

    try {
      console.log("Recipient search result:", recipient);
    } catch (logError) {
      // Ignore logging errors
    }

    if (!recipient) {
      return {
        success: false,
        error: "Recipient not found",
      };
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct credits from sender (use actualDeduction which includes service fee)
      const updatedSender = await tx.pt_users.update({
        where: { ID: sender.ID },
        data: { user_credits: { decrement: actualDeduction } },
        select: { ID: true, user_credits: true },
      });

      // 2. Add credits to recipient (only the base amount, not including service fee)
      const updatedRecipient = await tx.pt_users.update({
        where: { ID: recipient.ID },
        data: { user_credits: { increment: amount } },
        select: { ID: true, user_credits: true },
      });

      // 3. Record the transaction
      const transaction = await tx.pt_credits_transfer.create({
        data: {
          sender_id: sender.ID,
          recipient_id: recipient.ID,
          amount: amount,
          service_fee: serviceFee,
          // total_deduction: actualDeduction, // Removed as it does not exist in the schema
          note: note || "",
          transaction_date: new Date(),
          transaction_type: "transfer",
          status: "completed",
        },
      });

      return {
        sender: updatedSender,
        recipient: updatedRecipient,
        transaction,
      };
    });

    // Revalidate pages that might show credit information
    try {
      revalidatePath("/dashboard");
      revalidatePath("/credits");
      revalidatePath("/profile");
    } catch (revalidateError) {
      console.error("Error revalidating paths:", revalidateError);
      // Continue execution even if revalidation fails
    }

    return {
      success: true,
      data: {
        transaction: result.transaction,
        sender: {
          id: sender.ID,
          name: sender.user_nicename,
          newBalance: result.sender.user_credits,
        },
        recipient: {
          id: recipient.ID,
          name: recipient.user_nicename,
          newBalance: result.recipient.user_credits,
        },
        totalDeducted: actualDeduction,
      },
    };
  } catch (error) {
    // Safely log the error
    try {
      console.error("Error transferring credits:", error);
    } catch (logError) {
      console.error("Could not log the original error");
    }

    // Handle null or undefined error first
    if (!error) {
      return {
        success: false,
        error: "An unknown error occurred",
      };
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get credit transaction history for a user
 * @param userId User ID to get transaction history for
 * @param limit Optional limit of transactions to return
 * @returns List of credit transactions
 */
export async function getCreditTransactionHistory(userId: number, limit = 10) {
  try {
    // Get transactions where user is sender or recipient
    const transactions = await prisma.pt_credits_transfer.findMany({
      where: {
        OR: [{ sender_id: userId }, { recipient_id: userId }],
      },
      orderBy: {
        transaction_date: "desc",
      },
      take: limit,
    });

    // Get all unique user IDs from the transactions
    const userIds = new Set<number>();
    transactions.forEach((tx) => {
      userIds.add(Number(tx.sender_id));
      userIds.add(Number(tx.recipient_id));
    });

    // Get user information for all users involved in the transactions
    const users = await prisma.pt_users.findMany({
      where: {
        ID: {
          in: Array.from(userIds),
        },
      },
      select: {
        ID: true,
        user_nicename: true,
        display_name: true,
      },
    });

    // Map user information to transactions and convert Decimal objects to regular numbers
    const enrichedTransactions = transactions.map((tx) => {
      const sender = users.find((u) => Number(u.ID) === Number(tx.sender_id));
      const recipient = users.find(
        (u) => Number(u.ID) === Number(tx.recipient_id)
      );

      // Convert Decimal objects to regular JavaScript numbers
      return {
        id: tx.id,
        sender_id: Number(tx.sender_id),
        recipient_id: Number(tx.recipient_id),
        amount: Number(tx.amount), // Convert Decimal to number
        service_fee: Number(tx.service_fee), // Convert Decimal to number
        note: tx.note,
        transaction_date: tx.transaction_date,
        transaction_type: tx.transaction_type,
        status: tx.status,
        created_at: tx.created_at,
        // Add any other fields that need conversion

        // Add user information
        sender: sender
          ? {
              id: Number(sender.ID),
              name:
                sender.user_nicename ||
                sender.display_name ||
                `User #${sender.ID}`,
            }
          : null,
        recipient: recipient
          ? {
              id: Number(recipient.ID),
              name:
                recipient.user_nicename ||
                recipient.display_name ||
                `User #${recipient.ID}`,
            }
          : null,
        isIncoming: Number(tx.recipient_id) === userId,
      };
    });

    return {
      success: true,
      data: enrichedTransactions,
    };
  } catch (error) {
    // Safely log the error
    try {
      console.error("Error getting credit transaction history:", error);
    } catch (logError) {
      console.error("Could not log the original error");
    }

    // Handle null or undefined error first
    if (!error) {
      return {
        success: false,
        error: "An unknown error occurred",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const CheckBalanceSchema = z.object({
  senderId: z.number(),
  amount: z.number().min(100).max(50000),
  serviceFee: z.number().min(0).max(1000),
});

const ExecuteTransferSchema = z.object({
  senderId: z.number(),
  recipientId: z.number(),
  amount: z.number().min(100).max(50000),
  serviceFee: z.number().min(0).max(1000),
  note: z.string().optional(),
});

export async function checkSenderBalance(data: {
  senderId: number;
  amount: number;
  serviceFee: number;
}) {
  try {
    const validated = CheckBalanceSchema.parse(data);
    const { senderId, amount, serviceFee } = validated;

    const sender = await prisma.pt_users.findUnique({
      where: { ID: senderId },
      select: { user_credits: true },
    });

    if (!sender) {
      return {
        success: false,
        error: "Sender not found",
      };
    }

    const totalDeduction = amount + serviceFee;
    const availableCredits = Number(sender.user_credits || 0);

    if (availableCredits < totalDeduction) {
      return {
        success: false,
        error: `Insufficient credits. Required: ₱${totalDeduction.toLocaleString()}, Available: ₱${availableCredits.toLocaleString()}`,
      };
    }

    return {
      success: true,
      data: { availableCredits, totalDeduction },
    };
  } catch (error) {
    console.error("Error checking balance:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function executeTransfer(data: {
  senderId: number;
  recipientId: number;
  amount: number;
  serviceFee: number;
  note?: string;
}) {
  try {
    const validated = ExecuteTransferSchema.parse(data);
    const { senderId, recipientId, amount, serviceFee, note } = validated;

    if (senderId === recipientId) {
      return {
        success: false,
        error: "Cannot transfer credits to yourself",
      };
    }

    const totalDeduction = amount + serviceFee;
    const timestamp = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Verify sender balance
      const sender = await tx.pt_users.findUnique({
        where: { ID: senderId },
        select: { user_credits: true, user_nicename: true },
      });

      if (!sender || Number(sender.user_credits || 0) < totalDeduction) {
        throw new Error("Insufficient credits or sender not found");
      }

      // Verify recipient exists
      const recipient = await tx.pt_users.findUnique({
        where: { ID: recipientId },
        select: { user_nicename: true },
      });

      if (!recipient) {
        throw new Error("Recipient not found");
      }

      // Update sender balance
      const updatedSender = await tx.pt_users.update({
        where: { ID: senderId },
        data: { user_credits: { decrement: totalDeduction } },
        select: { user_credits: true },
      });

      // Update recipient balance
      const updatedRecipient = await tx.pt_users.update({
        where: { ID: recipientId },
        data: { user_credits: { increment: amount } },
        select: { user_credits: true },
      });

      // Record transaction
      const transaction = await tx.pt_credits_transfer.create({
        data: {
          sender_id: senderId,
          recipient_id: recipientId,
          amount,
          service_fee: serviceFee,
          note: note || "",
          transaction_date: timestamp,
          transaction_type: "transfer",
          status: "completed",
        },
      });

      return {
        transaction,
        newSenderBalance: updatedSender.user_credits,
        newRecipientBalance: updatedRecipient.user_credits,
        senderName: sender.user_nicename,
        recipientName: recipient.user_nicename,
      };
    });

    // Revalidate cache
    revalidatePath("/dashboard");
    revalidatePath("/credits");
    revalidatePath("/profile");

    return {
      success: true,
      data: {
        transactionId: result.transaction.id,
        amount,
        totalDeducted: totalDeduction,
        newSenderBalance: Number(result.newSenderBalance),
        senderName: result.senderName,
        recipientName: result.recipientName,
      },
    };
  } catch (error) {
    console.error("Error executing transfer:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
