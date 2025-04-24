import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Define response type interfaces for better type safety
interface BaseResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface PaginationMetadata {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

interface TelcoTransactionResponse extends BaseResponse {
  data?: any[];
  metadata?: PaginationMetadata;
}

/**
 * Retrieves telco transactions for a specific user by their ID with pagination
 * @param userId - The ID of the user to fetch transactions for
 * @param page - The page number to fetch (defaults to 1)
 * @param limit - The number of records per page (defaults to 10)
 * @returns Object containing success status, data (if successful), metadata for pagination, or error message
 */
export async function getTelcoTransactionsByUserId(
  userId: any,
  page: number = 1,
  limit: number = 10
): Promise<TelcoTransactionResponse> {
  try {
    if (!userId || isNaN(parseInt(userId, 10))) {
      return {
        success: false,
        message: "Invalid or missing user ID.",
      };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await prisma.pt_telco_transaction.count({
      where: {
        user_id: parseInt(userId, 10),
      },
    });
    
    // Get paginated data
    const userTransactions = await prisma.pt_telco_transaction.findMany({
      where: {
        user_id: parseInt(userId, 10),
      },
      orderBy: {
        created_at: 'desc', // Ordering by most recent first
      },
      skip: skip,
      take: limit,
    });

    return {
      success: true,
      data: userTransactions,
      metadata: {
        page: page,
        totalPages: Math.ceil(totalCount / limit),
        total: totalCount,
        limit: limit
      }
    };
  } catch (error) {
    console.error("Error fetching telco transactions by user ID:", error);
    return {
      success: false,
      message: "Failed to fetch transactions for the specified user.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Gets all telco transactions in the system with pagination
 * @param page - The page number to fetch (defaults to 1)
 * @param limit - The number of records per page (defaults to 10)
 * @returns Object containing success status, data (if successful), metadata for pagination, or error message
 */
export async function getAllTelcoTransactions(
  page: number = 1,
  limit: number = 10
): Promise<TelcoTransactionResponse> {
  try {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await prisma.pt_telco_transaction.count();
    
    // Get paginated data
    const transactions = await prisma.pt_telco_transaction.findMany({
      orderBy: {
        created_at: 'desc',
      },
      skip: skip,
      take: limit,
    });

    return {
      success: true,
      data: transactions,
      metadata: {
        page: page,
        totalPages: Math.ceil(totalCount / limit),
        total: totalCount,
        limit: limit
      }
    };
  } catch (error) {
    console.error("Error fetching all telco transactions:", error);
    return {
      success: false,
      message: "Failed to fetch telco transactions.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Creates a new telco transaction
 * @param transactionData - The transaction data to create
 * @returns Object containing success status, data (if successful), or error message
 */
export async function createTelcoTransaction(transactionData: any) {
  try {
    const newTransaction = await prisma.pt_telco_transaction.create({
      data: transactionData,
    });

    return {
      success: true,
      data: newTransaction,
    };
  } catch (error) {
    console.error("Error creating telco transaction:", error);
    return {
      success: false,
      message: "Failed to create telco transaction.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Updates an existing telco transaction
 * @param transactionId - The ID of the transaction to update
 * @param transactionData - The updated transaction data
 * @returns Object containing success status, data (if successful), or error message
 */
export async function updateTelcoTransaction(transactionId: number, transactionData: any) {
  try {
    const updatedTransaction = await prisma.pt_telco_transaction.update({
      where: {
        id: transactionId,
      },
      data: transactionData,
    });

    return {
      success: true,
      data: updatedTransaction,
    };
  } catch (error) {
    console.error("Error updating telco transaction:", error);
    return {
      success: false,
      message: "Failed to update telco transaction.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Deletes a telco transaction
 * @param transactionId - The ID of the transaction to delete
 * @returns Object containing success status or error message
 */
export async function deleteTelcoTransaction(transactionId: number) {
  try {
    await prisma.pt_telco_transaction.delete({
      where: {
        id: transactionId,
      },
    });

    return {
      success: true,
      message: "Transaction deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting telco transaction:", error);
    return {
      success: false,
      message: "Failed to delete telco transaction.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}