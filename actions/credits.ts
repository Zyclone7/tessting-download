"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma-singleton";
import { z } from "zod";

// Define TypeScript interfaces for topUpCredits
interface TopUpCreditsInput {
  userId: number;
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
}

interface TopUpCreditsResult {
  success: boolean;
  message: string;
  data?: {
    newCreditBalance: number;
    userId: number;
    transactionId?: number;
  };
  error?: string;
}

// Define TypeScript interfaces for getCreditTransactions
interface GetCreditTransactionsInput {
  userId: number;
  page?: number;
  limit?: number;
  transactionType?: string;
  startDate?: Date;
  endDate?: Date;
}

interface GetCreditTransactionsResult {
  success: boolean;
  message: string;
  data?: {
    transactions: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

// Define TypeScript interfaces for getCreditTransactionById
interface GetCreditTransactionByIdInput {
  transactionId: number;
  userId?: number; // Optional userId for security check
}

interface GetCreditTransactionByIdResult {
  success: boolean;
  message: string;
  data?: {
    transaction: any | null;
  };
  error?: string;
}

// Define schemas for validation
const TopUpCreditsSchema = z.object({
  userId: z.number({
    required_error: "User ID is required",
    invalid_type_error: "User ID must be a number",
  }),
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .min(1000, "Minimum top-up amount is ₱1,000")
    .max(50000, "Maximum top-up amount is ₱50,000"),
  paymentMethod: z.string({
    required_error: "Payment method is required",
  }),
  transactionReference: z.string().optional(),
});

const GetCreditTransactionsSchema = z.object({
  userId: z.number({
    required_error: "User ID is required",
    invalid_type_error: "User ID must be a number",
  }),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  transactionType: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const GetCreditTransactionByIdSchema = z.object({
  transactionId: z.number({
    required_error: "Transaction ID is required",
    invalid_type_error: "Transaction ID must be a number",
  }),
  userId: z.number().optional(),
});

/**
 * Function to add credits to a user's account and record the transaction
 */
export async function topUpCredits(
  data: TopUpCreditsInput
): Promise<TopUpCreditsResult> {
  try {
    // Validate input data
    const validatedData = TopUpCreditsSchema.parse(data);

    // Generate transaction reference if not provided
    const transactionRef =
      validatedData.transactionReference || generateTransactionReference();

    // First get the user to verify they exist and get current credits
    const user = await prisma.pt_users.findUnique({
      where: { ID: validatedData.userId },
      select: {
        ID: true,
        user_credits: true,
        user_email: true,
        user_nicename: true,
      },
    });

    if (!user) {
      throw new Error(`User with ID ${validatedData.userId} not found`);
    }

    // Calculate new credit balance
    const currentCredits = user.user_credits || 0;
    const newCredits = currentCredits + validatedData.amount;

    // Handling each operation separately to better identify where any issues occur

    // 1. Update user credits
    const updatedUser = await prisma.pt_users.update({
      where: { ID: validatedData.userId },
      data: { user_credits: newCredits },
      select: { ID: true, user_credits: true },
    });

    // 2. Create transaction record - with explicit field mapping
    let transactionId;
    try {
      const transaction = await prisma.pt_credits_transactions.create({
        data: {
          user_id: validatedData.userId,
          amount: validatedData.amount,
          transaction_type: "TOP_UP",
          payment_method: validatedData.paymentMethod,
          transaction_reference: transactionRef,
          previous_balance: currentCredits,
          new_balance: newCredits,
          status: "COMPLETED",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      transactionId = transaction.id;
    } catch (transactionError) {
      // If creating the transaction record fails, log it but don't fail the whole operation
      console.error(
        "Failed to create transaction record, but credits were updated:",
        transactionError
      );
    }

    // Log success for monitoring purposes
    console.log(`Credit top-up completed for user ${validatedData.userId}: 
      Amount: ₱${validatedData.amount.toLocaleString()}
      Payment Method: ${validatedData.paymentMethod}
      Transaction Reference: ${transactionRef}
      Previous Balance: ₱${currentCredits.toLocaleString()}
      New Balance: ₱${newCredits.toLocaleString()}
      Timestamp: ${new Date().toISOString()}
    `);

    // Revalidate relevant paths to update UI
    revalidatePath("/user-dashboard");
    revalidatePath(`/user-dashboard/profile`);

    return {
      success: true,
      message: `Successfully added ₱${validatedData.amount.toLocaleString()} to your account.`,
      data: {
        newCreditBalance: Number(updatedUser.user_credits ?? 0), // Convert Decimal to number
        userId: updatedUser.ID,
        transactionId: transactionId,
      },
    };
  } catch (error) {
    // Use a more reliable error logging approach
    console.error("Error in topUpCredits:");
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(String(error));
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid input data for top-up",
        error: error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      };
    }

    return {
      success: false,
      message: "Failed to process top-up",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Function to get all credit transactions for a user with pagination and filtering options
 */
export async function getCreditTransactions(
  data: GetCreditTransactionsInput
): Promise<GetCreditTransactionsResult> {
  try {
    // Validate input data
    const validatedData = GetCreditTransactionsSchema.parse(data);

    // Verify user exists
    const user = await prisma.pt_users.findUnique({
      where: { ID: validatedData.userId },
      select: { ID: true },
    });

    if (!user) {
      throw new Error(`User with ID ${validatedData.userId} not found`);
    }

    // Build where conditions for filtering
    const whereCondition: any = {
      user_id: validatedData.userId,
    };

    // Add optional filters if provided
    if (validatedData.transactionType) {
      whereCondition.transaction_type = validatedData.transactionType;
    }

    if (validatedData.startDate || validatedData.endDate) {
      whereCondition.created_at = {};

      if (validatedData.startDate) {
        whereCondition.created_at.gte = validatedData.startDate;
      }

      if (validatedData.endDate) {
        whereCondition.created_at.lte = validatedData.endDate;
      }
    }

    // Calculate pagination values
    const skip = (validatedData.page - 1) * validatedData.limit;

    // Get total count for pagination
    const total = await prisma.pt_credits_transactions.count({
      where: whereCondition,
    });

    // Get transactions with pagination
    const transactions = await prisma.pt_credits_transactions.findMany({
      where: whereCondition,
      orderBy: {
        created_at: "desc",
      },
      skip: skip,
      take: validatedData.limit,
    });

    // Convert Decimal fields to numbers
    const convertedTransactions = transactions.map((tx) => ({
      ...tx,
      amount: Number(tx.amount), // Convert Decimal to number
      previous_balance: Number(tx.previous_balance), // Convert Decimal to number
      new_balance: Number(tx.new_balance), // Convert Decimal to number
    }));

    return {
      success: true,
      message: "Transactions retrieved successfully",
      data: {
        transactions: convertedTransactions,
        total,
        page: validatedData.page,
        limit: validatedData.limit,
        totalPages: Math.ceil(total / validatedData.limit),
      },
    };
  } catch (error) {
    // Log error
    console.error("Error in getCreditTransactions:");
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(String(error));
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid input data for retrieving transactions",
        error: error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      };
    }

    return {
      success: false,
      message: "Failed to retrieve transactions",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Function to get a specific credit transaction by its ID
 * Optionally verifies that the transaction belongs to the specified user
 */
export async function getCreditTransactionById(
  data: GetCreditTransactionByIdInput
): Promise<GetCreditTransactionByIdResult> {
  try {
    // Validate input data
    const validatedData = GetCreditTransactionByIdSchema.parse(data);

    // Get the transaction
    const transaction = await prisma.pt_credits_transactions.findUnique({
      where: { id: validatedData.transactionId },
    });

    if (!transaction) {
      return {
        success: false,
        message: `Transaction with ID ${validatedData.transactionId} not found`,
        error: "Transaction not found",
      };
    }

    // If userId is provided, check if the transaction belongs to this user
    if (
      validatedData.userId !== undefined &&
      transaction.user_id !== validatedData.userId
    ) {
      return {
        success: false,
        message: "Access denied",
        error: "This transaction does not belong to the specified user",
      };
    }

    // Convert Decimal fields to numbers
    const convertedTransaction = {
      ...transaction,
      amount: Number(transaction.amount), // Convert Decimal to number
      previous_balance: Number(transaction.previous_balance), // Convert Decimal to number
      new_balance: Number(transaction.new_balance), // Convert Decimal to number
    };

    return {
      success: true,
      message: "Transaction retrieved successfully",
      data: {
        transaction: convertedTransaction,
      },
    };
  } catch (error) {
    // Log error
    console.error("Error in getCreditTransactionById:");
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(String(error));
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid input data for retrieving transaction",
        error: error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      };
    }

    return {
      success: false,
      message: "Failed to retrieve transaction",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generates a unique transaction reference
 * @returns {string} A unique transaction reference
 */
function generateTransactionReference(): string {
  const prefix = "TOPUP";
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}
