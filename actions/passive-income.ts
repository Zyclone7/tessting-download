"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma-singleton";

function serializeDecimal(obj: any): any {
  if (obj instanceof Prisma.Decimal) {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(serializeDecimal);
  } else if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeDecimal(value)])
    );
  }
  return obj;
}

export const getPassiveIncomeTransactions = async () => {
  try {
    // Get all passive income transactions with their ATM transaction details in a single query
    const passiveIncomeTransactions = await prisma.pt_passive_income_history.findMany({
      select: {
        ID: true,
        transaction_id: true,
        sender_user_id: true,
        recipient_user_id: true,
        income_amount: true,
        level: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    })

    // Get all transaction IDs
    const transactionIds = passiveIncomeTransactions.map((t) => t.transaction_id)

    // Fetch all ATM transaction details in a single query
    const atmTransactions = await prisma.pt_atm_transaction.findMany({
      where: {
        ID: {
          in: transactionIds,
        },
      },
      select: {
        ID: true,
        merchant_id: true,
        merchant_name: true,
        transaction_date: true,
        withdraw_count: true,
        balance_inquiry_count: true,
        fund_transfer_count: true,
        total_transaction_count: true,
        withdraw_amount: true,
        balance_inquiry_amount: true,
        fund_transfer_amount: true,
        total_amount: true,
        transaction_fee_rcbc: true,
        transaction_fee_merchant: true,
        bill_payment_count: true,
        bill_payment_amount: true,
        cash_in_count: true,
        cash_in_amount: true,
        created_at: true,
        status: true,
        verified_date: true,
        approved_date: true,
        rejected_date: true,
      },
    })

    // Create a map of transaction IDs to ATM transaction details
    const atmTransactionMap = new Map(atmTransactions.map((transaction) => [transaction.ID, transaction]))

    // Get all user IDs
    const userIds = new Set(passiveIncomeTransactions.flatMap((t) => [t.sender_user_id, t.recipient_user_id]))

    // Fetch all user details in a single query
    const users = await prisma.pt_users.findMany({
      where: {
        ID: {
          in: Array.from(userIds),
        },
      },
      select: {
        ID: true,
        user_nicename: true,
        user_email: true,
        user_role: true,
        user_level: true,
        user_credits: true,
        user_referral_code: true,
      },
    })

    // Create a map of user IDs to user details
    const userMap = new Map(users.map((user) => [user.ID, user]))

    // Combine all data
    const transactionsWithDetails = passiveIncomeTransactions.map((transaction) => {
      // Format the date as an ISO string if it exists
      const formattedCreatedAt = transaction.created_at ? new Date(transaction.created_at).toISOString() : null

      return {
        ...transaction,
        created_at: formattedCreatedAt,
        sender: userMap.get(transaction.sender_user_id) || null,
        recipient: userMap.get(transaction.recipient_user_id) || null,
        atmTransaction: atmTransactionMap.get(transaction.transaction_id) || null,
      }
    })

    const serializedTransactions = serializeDecimal(transactionsWithDetails)
    return { success: true, data: serializedTransactions }
  } catch (error: any) {
    console.error("Error fetching passive income transactions:", error)
    return {
      success: false,
      status: 500,
      error: error.message || "An error occurred while fetching the passive income transaction details.",
    }
  }
}

export const getPassiveIncomeTransactionsByRecipientId = async (recipientId: number) => {
  try {
    // Get all passive income transactions for this recipient with their ATM transaction details in a single query
    const passiveIncomeTransactions = await prisma.pt_passive_income_history.findMany({
      select: {
        ID: true,
        transaction_id: true,
        sender_user_id: true,
        recipient_user_id: true,
        income_amount: true,
        level: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
      where: { recipient_user_id: recipientId },
    })

    // Get all transaction IDs
    const transactionIds = passiveIncomeTransactions.map((t) => t.transaction_id)

    // Fetch all ATM transaction details in a single query
    const atmTransactions = await prisma.pt_atm_transaction.findMany({
      where: {
        ID: {
          in: transactionIds,
        },
      },
      select: {
        ID: true,
        merchant_id: true,
        merchant_name: true,
        transaction_date: true,
        withdraw_count: true,
        balance_inquiry_count: true,
        fund_transfer_count: true,
        total_transaction_count: true,
        withdraw_amount: true,
        balance_inquiry_amount: true,
        fund_transfer_amount: true,
        total_amount: true,
        transaction_fee_rcbc: true,
        transaction_fee_merchant: true,
        bill_payment_count: true,
        bill_payment_amount: true,
        cash_in_count: true,
        cash_in_amount: true,
        created_at: true,
        status: true,
        verified_date: true,
        approved_date: true,
        rejected_date: true,
      },
    })

    // Create a map of transaction IDs to ATM transaction details
    const atmTransactionMap = new Map(atmTransactions.map((transaction) => [transaction.ID, transaction]))

    // Get all user IDs
    const userIds = new Set(passiveIncomeTransactions.flatMap((t) => [t.sender_user_id, t.recipient_user_id]))

    // Fetch all user details in a single query
    const users = await prisma.pt_users.findMany({
      where: {
        ID: {
          in: Array.from(userIds),
        },
      },
      select: {
        ID: true,
        user_nicename: true,
        user_email: true,
        user_role: true,
        user_level: true,
        user_credits: true,
        user_referral_code: true,
      },
    })

    // Create a map of user IDs to user details
    const userMap = new Map(users.map((user) => [user.ID, user]))

    // Combine all data
    const transactionsWithDetails = passiveIncomeTransactions.map((transaction) => {
      // Format the date as an ISO string if it exists
      const formattedCreatedAt = transaction.created_at ? new Date(transaction.created_at).toISOString() : null

      return {
        ...transaction,
        created_at: formattedCreatedAt,
        sender: userMap.get(transaction.sender_user_id) || null,
        recipient: userMap.get(transaction.recipient_user_id) || null,
        atmTransaction: atmTransactionMap.get(transaction.transaction_id) || null,
      }
    })

    const serializedTransactions = serializeDecimal(transactionsWithDetails)
    return { success: true, data: serializedTransactions }
  } catch (error: any) {
    console.error("Error fetching passive income transactions:", error)
    return {
      success: false,
      status: 500,
      error: error.message || "An error occurred while fetching the passive income transaction details.",
    }
  }
}

export async function getPassiveIncomeTransactionsByUserId(userId: number) {
  try {
    const passiveIncomeTransactions = await prisma.pt_passive_income_history.findMany({
      where: {
        OR: [
          { sender_user_id: userId },
          { recipient_user_id: userId },
        ],
      },
      select: {
        ID: true,
        transaction_id: true,
        sender_user_id: true,
        recipient_user_id: true,
        income_amount: true,
        level: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const userIds = new Set(passiveIncomeTransactions.flatMap(t => [t.sender_user_id, t.recipient_user_id]));
    const users = await prisma.pt_users.findMany({
      where: {
        ID: {
          in: Array.from(userIds),
        },
      },
      select: {
        ID: true,
        user_nicename: true,
        user_email: true,
        user_role: true,
        user_level: true,
        user_credits: true,
        user_referral_code: true,
      },
    });

    const userMap = new Map(users.map(user => [user.ID, user]));

    const transactionsWithUserDetails = passiveIncomeTransactions.map(transaction => ({
      ...transaction,
      sender: userMap.get(transaction.sender_user_id) || null,
      recipient: userMap.get(transaction.recipient_user_id) || null,
    }));

    const serializedTransactions = serializeDecimal(transactionsWithUserDetails);
    return { success: true, data: serializedTransactions };
  } catch (error) {
    console.error("Error fetching passive income transactions for user:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the passive income transaction details for the user.",
    };
  }
}

export async function getPassiveIncomeTransactionsByDateRange(startDate: Date, endDate: Date) {
  try {
    const passiveIncomeTransactions = await prisma.pt_passive_income_history.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        ID: true,
        transaction_id: true,
        sender_user_id: true,
        recipient_user_id: true,
        income_amount: true,
        level: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const userIds = new Set(passiveIncomeTransactions.flatMap(t => [t.sender_user_id, t.recipient_user_id]));
    const users = await prisma.pt_users.findMany({
      where: {
        ID: {
          in: Array.from(userIds),
        },
      },
      select: {
        ID: true,
        user_nicename: true,
        user_email: true,
        user_role: true,
        user_level: true,
        user_credits: true,
        user_referral_code: true,
      },
    });

    const userMap = new Map(users.map(user => [user.ID, user]));

    const transactionsWithUserDetails = passiveIncomeTransactions.map(transaction => ({
      ...transaction,
      sender: userMap.get(transaction.sender_user_id) || null,
      recipient: userMap.get(transaction.recipient_user_id) || null,
    }));

    const serializedTransactions = serializeDecimal(transactionsWithUserDetails);
    return { success: true, data: serializedTransactions };
  } catch (error) {
    console.error("Error fetching passive income transactions by date range:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the passive income transaction details for the specified date range.",
    };
  }
}

export async function getTotalPassiveIncomeByUserId(userId: number) {
  try {
    const totalIncome = await prisma.pt_passive_income_history.aggregate({
      where: {
        recipient_user_id: userId,
      },
      _sum: {
        income_amount: true,
      },
    });
    const serializedTotal = serializeDecimal(totalIncome._sum.income_amount || 0);
    return { success: true, data: serializedTotal };
  } catch (error) {
    console.error("Error calculating total passive income for user:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while calculating the total passive income for the user.",
    };
  }
}

function serializeDecimalMyPassiveIncomeTransactions(transactions: any[]) {
  return transactions.map(transaction => ({
    ...transaction,
    income_amount: transaction.income_amount ? transaction.income_amount.toString() : '0.00',
  }));
}

export async function getMyPassiveIncomeTransactions(recipientUserId: number) {
  try {
    // Fetch passive income transactions for the specific recipient_user_id
    const passiveIncomeTransactions = await prisma.pt_passive_income_history.findMany({
      where: {
        recipient_user_id: recipientUserId, // Filtering by recipient_user_id
      },
      select: {
        ID: true,
        transaction_id: true,
        sender_user_id: true,
        recipient_user_id: true,
        income_amount: true,
        level: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Collect unique user IDs (sender and recipient) from the transactions
    const userIds = new Set(passiveIncomeTransactions.flatMap(t => [t.sender_user_id, t.recipient_user_id]));

    // Fetch user details for both sender and recipient
    const users = await prisma.pt_users.findMany({
      where: {
        ID: {
          in: Array.from(userIds),
        },
      },
      select: {
        ID: true,
        user_nicename: true,
        user_email: true,
        user_role: true,
        user_level: true,
        user_credits: true,
        user_referral_code: true,
      },
    });

    // Map user details by user ID for easy lookup
    const userMap = new Map(users.map(user => [user.ID, user]));

    // Merge transactions with sender and recipient user details
    const transactionsWithUserDetails = passiveIncomeTransactions.map(transaction => ({
      ...transaction,
      sender: userMap.get(transaction.sender_user_id) || null,
      recipient: userMap.get(transaction.recipient_user_id) || null,
    }));

    // Optionally serialize decimal fields if needed
    const serializedTransactions = serializeDecimalMyPassiveIncomeTransactions(transactionsWithUserDetails);
    
    return { success: true, data: serializedTransactions };
  } catch (error) {
    console.error("Error fetching passive income transactions:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the passive income transaction details.",
    };
  }
}

// Helper function to serialize Decimal fields if needed