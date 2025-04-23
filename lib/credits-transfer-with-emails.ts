"use server";

import { sendCreditTransferNotifications } from "./credits-transfer-email-complete";
import { revalidatePath } from "next/cache";
import { getUserById } from "@/actions/user"; // Assuming this function exists
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TransferCreditsParams {
  senderId: number;
  recipientIdentifier: string;
  amount: number;
  serviceFee?: number;
  note?: string;
  sendEmailNotification?: boolean;
}

interface TransferCreditsResult {
  success: boolean;
  error?: string;
  data?: {
    transactionId: string;
    amount: number;
    recipientId: number;
    newSenderBalance: number;
    timestamp: Date;
    emailsSent?: boolean;
  };
}

/**
 * Transfer credits from one user to another with optional email notifications
 */
export async function transferCredits(
  params: TransferCreditsParams
): Promise<TransferCreditsResult> {
  const {
    senderId,
    recipientIdentifier,
    amount,
    serviceFee = 0,
    note,
    sendEmailNotification = true,
  } = params;

  if (!senderId || !recipientIdentifier || !amount) {
    return {
      success: false,
      error: "Missing required parameters",
    };
  }

  // Basic validation
  if (amount <= 0) {
    return {
      success: false,
      error: "Amount must be greater than zero",
    };
  }

  try {
    // Step 1: Get sender details
    const sender = await getUserById(senderId);
    if (!sender || !sender.data) {
      return {
        success: false,
        error: "Sender not found",
      };
    }

    // Step 2: Find recipient by identifier (could be email, merchant_id, etc.)
    const recipient = await findUserByIdentifier(recipientIdentifier);
    if (!recipient) {
      return {
        success: false,
        error: "Recipient not found",
      };
    }

    // Prevent self-transfers
    if (sender.data.ID === recipient.ID) {
      return {
        success: false,
        error: "Cannot transfer credits to yourself",
      };
    }

    // Step 3: Check if sender has enough balance
    const senderCredits = Number(sender.data.user_credits || 0);
    if (senderCredits < amount) {
      return {
        success: false,
        error: "Insufficient credits",
      };
    }

    // Step 4: Generate a unique transaction reference
    const transactionId = generateTransactionId();
    const timestamp = new Date();

    // Step 5: Begin database transaction
    try {
      // Use Prisma's transaction to ensure all operations succeed or fail together
      const result = await prisma.$transaction(async (tx) => {
        // 5.1: Deduct credits from sender
        const newSenderBalance = senderCredits - amount;
        await tx.pt_users.update({
          where: { ID: sender.data.ID },
          data: { user_credits: newSenderBalance },
        });

        // 5.2: Add credits to recipient
        const recipientCredits = Number(recipient.user_credits || 0);
        const newRecipientBalance = recipientCredits + amount;
        await tx.pt_users.update({
          where: { ID: recipient.ID },
          data: { user_credits: newRecipientBalance },
        });

        // 5.3: Record the transaction in the database
        await tx.pt_credits_transfer.create({
          data: {
            id: transactionId, // Ensure this is a number as per the schema
            sender_id: sender.data.ID,
            recipient_id: recipient.ID,
            amount: amount,
            service_fee: serviceFee || 0,
            note: note || null,
            transaction_date: timestamp,
            status: "COMPLETED",
          },
        });

        return { newSenderBalance };
      });

      // Step 6: Send email notifications if enabled
      let emailsSent = false;
      if (sendEmailNotification) {
        try {
          const notificationResult = await sendCreditTransferNotifications({
            senderId: sender.data.ID,
            senderEmail: sender.data.user_email || "",
            senderName:
              sender.data.user_nicename ||
              sender.data.display_name ||
              sender.data.user_email ||
              "",
            recipientId: recipient.ID,
            recipientEmail: recipient.user_email || "",
            recipientName:
              recipient.user_nicename ||
              recipient.display_name ||
              recipient.user_email ||
              "",
            amount,
            serviceFee,
            note,
            newSenderBalance: result.newSenderBalance,
            transactionReference: transactionId.toString(),
          });

          emailsSent = notificationResult.success;

          // Log email status but don't fail the transaction if emails fail
          if (!emailsSent) {
            console.error(
              "Credit transfer successful but email notifications failed:",
              notificationResult.error
            );
          }
        } catch (emailError) {
          console.error(
            "Error sending credit transfer email notifications:",
            emailError
          );
          // Don't fail the transaction if emails fail
        }
      }

      // Step 7: Revalidate any relevant pages to reflect balance changes
      revalidatePath("/user-dashboard");

      // Step 8: Return success response
      return {
        success: true,
        data: {
          transactionId: transactionId.toString(),
          amount,
          recipientId: recipient.ID,
          newSenderBalance: result.newSenderBalance,
          timestamp,
          emailsSent,
        },
      };
    } catch (txError) {
      console.error("Transaction error:", txError);
      return {
        success: false,
        error:
          txError instanceof Error ? txError.message : "Transaction failed",
      };
    }
  } catch (error) {
    console.error("Error during credit transfer:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Helper function to find a user by various identifiers
 */
async function findUserByIdentifier(identifier: string) {
  try {
    // First try to find by merchant_id
    let user = await prisma.pt_users.findFirst({
      where: { merchant_id: identifier },
    });

    // If not found, try email
    if (!user) {
      user = await prisma.pt_users.findFirst({
        where: { user_email: identifier },
      });
    }

    // If still not found, return null
    if (!user) {
      console.warn("User not found by merchant_id or email");
    }

    return user;
  } catch (error) {
    console.error("Error finding user by identifier:", error);
    return null;
  }
}

/**
 * Generate a unique transaction ID
 */
function generateTransactionId(): number {
  return Date.now(); // Use a numeric timestamp as the transaction ID
}
