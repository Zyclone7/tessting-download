"use server";

import { prisma } from "@/lib/prisma-singleton";

/**
 * Deducts credits from a user's account based on the discounted subtotal price
 * 
 * @param userId - User ID (string or number)
 * @param baseAmount - Original base amount before discounts
 * @param discountPercentage - Discount percentage as a decimal (e.g., 0.02 for 2%)
 * @param serviceFee - Additional service fee to be added to the total
 * @param paymentMethod - Payment method (only deducts if "credits")
 * @returns Object containing success status, message, and relevant data
 */
export async function deductUserCredits(
  userId: string | number,
  baseAmount: number,
  discountPercentage: number = 0,
  serviceFee: number = 0,
  paymentMethod: string = "credits"
) {
  try {
    // Only proceed if payment method is credits
    if (paymentMethod !== "credits") {
      return {
        success: true,
        message: "No credits deducted - payment method is not credits.",
      };
    }

    // Convert userId to number if it's a string
    const userIdNum = typeof userId === "string" ? parseInt(userId, 10) : userId;

    // Calculate discounted amount
    const discountAmount = baseAmount * discountPercentage;
    const discountedSubtotal = baseAmount - discountAmount;
    
    // Add service fee to get total amount to deduct
    const totalToDeduct = discountedSubtotal + serviceFee;

    // Get user's current credit balance
    const user = await prisma.pt_users.findUnique({
      where: { ID: userIdNum },
      select: { user_credits: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const currentCredits = parseFloat(user.user_credits?.toString() || "0");

    // Check if user has enough credits
    if (currentCredits < totalToDeduct) {
      return {
        success: false,
        message: "Insufficient credits for this purchase.",
        requiredCredits: totalToDeduct,
        availableCredits: currentCredits,
      };
    }

    // Deduct credits from user's account
    await prisma.pt_users.update({
      where: { ID: userIdNum },
      data: {
        user_credits: { decrement: totalToDeduct },
      },
    });

    console.log(`Credits deducted: ${totalToDeduct} from user ${userId}`);

    return {
      success: true,
      message: "Credits deducted successfully.",
      deductedAmount: totalToDeduct,
      remainingCredits: currentCredits - totalToDeduct,
    };
  } catch (error: any) {
    console.error("Error deducting user credits:", error);
    return {
      success: false,
      message: error.message || "An error occurred while deducting credits.",
      error: error.message,
    };
  }
}

/**
 * Gets telco transactions for a specific user with pagination and filtering
 * 
 * @param userId - User ID (string or number)
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of items per page (default: 10)
 * @param status - Optional filter by transaction status
 * @param startDate - Optional filter for start date
 * @param endDate - Optional filter for end date
 * @param provider - Optional filter by provider name
 * @returns Object containing success status, transaction data, pagination metadata
 */
export async function getTelcoByUserId(
  userId: string | number,
  page: number = 1,
  limit: number = 10,
  status?: string,
  startDate?: Date | string,
  endDate?: Date | string,
  provider?: string
) {
  try {
    // Input validation
    if (!userId) {
      return {
        success: false,
        message: "User ID is required",
        data: []
      };
    }

    // Convert userId to number if it's a string
    const userIdNum = typeof userId === "string" ? parseInt(userId, 10) : userId;

    // Validate the user ID
    if (isNaN(userIdNum)) {
      return {
        success: false,
        message: "Invalid user ID format.",
        data: []
      };
    }

    // Build the where clause dynamically for filtering
    const whereClause: any = {
      user_id: userIdNum
    };

    // Add optional filters if provided
    if (status) {
      whereClause.status = status;
    }

    if (provider) {
      whereClause.provider_name = provider;
    }

    // Handle date range filtering
    if (startDate || endDate) {
      whereClause.created_at = {};
      
      if (startDate) {
        try {
          whereClause.created_at.gte = new Date(startDate);
        } catch (e) {
          console.warn("Invalid startDate format, ignoring this filter", e);
        }
      }
      
      if (endDate) {
        try {
          whereClause.created_at.lte = new Date(endDate);
        } catch (e) {
          console.warn("Invalid endDate format, ignoring this filter", e);
        }
      }
    }

    // Validate pagination parameters
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(100, Math.max(1, limit || 10)); // Cap at 100 items per page
    const skip = (validatedPage - 1) * validatedLimit;
    
    // Get total count for pagination metadata
    const totalCount = await prisma.pt_telco_transaction.count({
      where: whereClause
    });

    // Get paginated transaction data
    const transactions = await prisma.pt_telco_transaction.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc' // Most recent first
      },
      skip: skip,
      take: validatedLimit,
    });

    // Process the data to convert Decimal objects to numbers
    const processedTransactions = transactions.map(transaction => {
      // Create a new object with serializable properties
      const processed: any = {};
      
      // Process each property to ensure it's serializable
      Object.keys(transaction).forEach(key => {
        const value = (transaction as any)[key];
        
        // Handle null or undefined values
        if (value === null || value === undefined) {
          processed[key] = null;
          return;
        }
        
        // Handle Date objects
        if (value instanceof Date) {
          processed[key] = value;
          return;
        }
        
        // Handle potentially Decimal fields
        const numericFields = [
          'amount', 'service_fee', 'provider_discount', 
          'subtotal', 'total', 'response_balance'
        ];
        
        if (numericFields.includes(key) && typeof value === 'object') {
          // Convert Decimal to number
          try {
            processed[key] = Number(value.toString());
          } catch (e) {
            processed[key] = null;
            console.warn(`Error converting ${key} to number:`, e);
          }
        } else {
          // Keep other values as is
          processed[key] = value;
        }
      });
      
      return processed;
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validatedLimit);

    // Return success with data and metadata
    return {
      success: true,
      data: processedTransactions,
      metadata: {
        page: validatedPage,
        limit: validatedLimit,
        total: totalCount,
        totalPages: totalPages || 1, // Ensure at least 1 page
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1
      }
    };
  } catch (error: any) {
    console.error("Error fetching telco transactions:", error);
    
    // Return a structured error response
    return {
      success: false,
      message: error.message || "Failed to fetch telco transactions",
      error: error.toString(),
      data: []
    };
  }
}
