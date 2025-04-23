"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma-singleton"; // Import your singleton instance

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

export async function getTransactionsByMerchantId(merchant_id: string) {
  try {
    if (!merchant_id) {
      return {
        success: false,
        status: 400,
        error: "Merchant ID is required.",
      };
    }

    let whereClause: any = {};

    if (merchant_id !== "all") {
      whereClause.merchant_id = merchant_id;
    }

    const transactions = await prisma.pt_atm_transaction.findMany({
      where: whereClause,
      orderBy: { transaction_date: "desc" },
    });

    if (transactions.length === 0) {
      return {
        success: false,
        status: 404,
        error: "No transactions found for the given merchant ID.",
      };
    }

    const serializedTransactions = serializeDecimal(transactions);

    const totals = serializedTransactions.reduce(
      (acc: any, transaction: any) => {
        const parseAmount = (value: string | number) =>
          parseFloat(typeof value === "string" ? value : "0") || 0;

        acc.total_withdraw_count += transaction.withdraw_count || 0;
        acc.total_balance_inquiry_count +=
          transaction.balance_inquiry_count || 0;
        acc.total_fund_transfer_count += transaction.fund_transfer_count || 0;
        acc.total_transaction_count += transaction.total_transaction_count || 0;
        acc.total_bill_payment_count += transaction.bill_payment_count || 0;
        acc.total_cash_in_count += transaction.cash_in_count || 0;

        acc.total_withdraw_amount = (
          parseAmount(acc.total_withdraw_amount) +
          parseAmount(transaction.withdraw_amount)
        ).toString();
        acc.total_balance_inquiry_amount = (
          parseAmount(acc.total_balance_inquiry_amount) +
          parseAmount(transaction.balance_inquiry_amount)
        ).toString();
        acc.total_fund_transfer_amount = (
          parseAmount(acc.total_fund_transfer_amount) +
          parseAmount(transaction.fund_transfer_amount)
        ).toString();
        acc.total_amount = (
          parseAmount(acc.total_amount) + parseAmount(transaction.total_amount)
        ).toString();
        acc.total_transaction_fee_rcbc = (
          parseAmount(acc.total_transaction_fee_rcbc) +
          parseAmount(transaction.transaction_fee_rcbc)
        ).toString();
        acc.total_transaction_fee_merchant = (
          parseAmount(acc.total_transaction_fee_merchant) +
          parseAmount(transaction.transaction_fee_merchant)
        ).toString();
        acc.total_bill_payment_amount = (
          parseAmount(acc.total_bill_payment_amount) +
          parseAmount(transaction.bill_payment_amount)
        ).toString();
        acc.total_cash_in_amount = (
          parseAmount(acc.total_cash_in_amount) +
          parseAmount(transaction.cash_in_amount)
        ).toString();

        return acc;
      },
      {
        total_withdraw_count: 0,
        total_balance_inquiry_count: 0,
        total_fund_transfer_count: 0,
        total_transaction_count: 0,
        total_withdraw_amount: "0",
        total_balance_inquiry_amount: "0",
        total_fund_transfer_amount: "0",
        total_amount: "0",
        total_transaction_fee_rcbc: "0",
        total_transaction_fee_merchant: "0",
        total_bill_payment_count: 0,
        total_bill_payment_amount: "0",
        total_cash_in_count: 0,
        total_cash_in_amount: "0",
      }
    );

    return {
      success: true,
      status: 200,
      data: {
        transactions: serializedTransactions,
        totals,
      },
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the transaction details.",
    };
  }
}

export async function getTransactionsByMerchantIdCount(merchant_id: string) {
  try {
    if (!merchant_id) {
      return {
        success: false,
        status: 400,
        error: "Merchant ID is required.",
      };
    }

    // Get the count of transactions
    const transactionCount = await prisma.pt_atm_transaction.count({
      where: { merchant_id: merchant_id },
    });

    if (transactionCount === 0) {
      return {
        success: false,
        status: 404,
        error: "No transactions found for the given merchant ID.",
      };
    }

    return {
      success: true,
      status: 200,
      data: {
        transaction_count: transactionCount,
      },
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the transaction count.",
    };
  }
}

export async function getMyMerchantTransactions(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        status: 400,
        error: "User ID is required.",
      };
    }

    const numericUserId = Number(userId);

    const result: any = await prisma.$queryRaw`
      WITH RECURSIVE downline AS (
        SELECT ID, merchant_id, user_nicename, user_upline_id, 0 as depth
        FROM pt_users
        WHERE ID = ${numericUserId}
        
        UNION ALL
        
        SELECT u.ID, u.merchant_id, u.user_nicename, u.user_upline_id, d.depth + 1
        FROM pt_users u
        INNER JOIN downline d ON u.user_upline_id = d.ID
        WHERE d.depth < 10
      )
      SELECT 
        t.*,
        d.user_nicename,
        d.depth as generation
      FROM pt_atm_transaction t
      INNER JOIN downline d ON t.merchant_id = d.merchant_id
      WHERE d.ID != ${numericUserId} AND d.merchant_id IS NOT NULL
      ORDER BY t.transaction_date DESC
    `;

    if (result.length === 0) {
      return {
        success: false,
        status: 404,
        error: "No transactions found for your downline merchants.",
      };
    }

    const serializedTransactions = result.map((transaction: any) => ({
      ...transaction,
      withdraw_amount: transaction.withdraw_amount.toString(),
      balance_inquiry_amount: transaction.balance_inquiry_amount.toString(),
      fund_transfer_amount: transaction.fund_transfer_amount.toString(),
      total_amount: transaction.total_amount.toString(),
      transaction_fee_rcbc: transaction.transaction_fee_rcbc.toString(),
      transaction_fee_merchant: transaction.transaction_fee_merchant.toString(),
      bill_payment_amount: transaction.bill_payment_amount.toString(),
      cash_in_amount: transaction.cash_in_amount.toString(),
    }));

    const totals = calculateTotals(serializedTransactions);

    return {
      success: true,
      status: 200,
      data: {
        transactions: serializedTransactions,
        totals,
      },
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the transaction details.",
    };
  }
}

export async function getMyMerchantTransactionsApproved(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        status: 400,
        error: "User ID is required.",
      };
    }

    const numericUserId = Number(userId);

    const result: any = await prisma.$queryRaw`
      WITH RECURSIVE downline AS (
        SELECT ID, merchant_id, user_nicename, user_upline_id, 0 as depth
        FROM pt_users
        WHERE ID = ${numericUserId}
        
        UNION ALL
        
        SELECT u.ID, u.merchant_id, u.user_nicename, u.user_upline_id, d.depth + 1
        FROM pt_users u
        INNER JOIN downline d ON u.user_upline_id = d.ID
        WHERE d.depth < 10
      )
      SELECT 
        t.*,
        d.user_nicename,
        d.depth as generation
      FROM pt_atm_transaction t
      INNER JOIN downline d ON t.merchant_id = d.merchant_id
      WHERE d.ID != ${numericUserId} 
        AND d.merchant_id IS NOT NULL 
        AND t.status = 'approved' -- Filter only approved transactions
      ORDER BY t.transaction_date DESC
    `;

    if (result.length === 0) {
      return {
        success: false,
        status: 404,
        error: "No approved transactions found for your downline merchants.",
      };
    }

    const serializedTransactions = result.map((transaction: any) => ({
      ...transaction,
      withdraw_amount: transaction.withdraw_amount.toString(),
      balance_inquiry_amount: transaction.balance_inquiry_amount.toString(),
      fund_transfer_amount: transaction.fund_transfer_amount.toString(),
      total_amount: transaction.total_amount.toString(),
      transaction_fee_rcbc: transaction.transaction_fee_rcbc.toString(),
      transaction_fee_merchant: transaction.transaction_fee_merchant.toString(),
      bill_payment_amount: transaction.bill_payment_amount.toString(),
      cash_in_amount: transaction.cash_in_amount.toString(),
    }));

    const totals = calculateTotals(serializedTransactions);

    return {
      success: true,
      status: 200,
      data: {
        transactions: serializedTransactions,
        totals,
      },
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the transaction details.",
    };
  }
}

async function getDownlineUserIds(
  userId: number,
  depth: number
): Promise<number[]> {
  if (depth === 0) return [];

  const directDownlines = await prisma.pt_users.findMany({
    where: { user_upline_id: userId },
    select: { ID: true },
  });

  const directDownlineIds = directDownlines.map((user) => user.ID);

  const nestedDownlineIds = await Promise.all(
    directDownlineIds.map((id) => getDownlineUserIds(id, depth - 1))
  );

  return [...directDownlineIds, ...nestedDownlineIds.flat()];
}

function calculateTotals(transactions: any[]) {
  return transactions.reduce(
    (acc, transaction) => {
      const parseAmount = (value: string) => Number.parseFloat(value) || 0;

      acc.total_withdraw_count += transaction.withdraw_count || 0;
      acc.total_balance_inquiry_count += transaction.balance_inquiry_count || 0;
      acc.total_fund_transfer_count += transaction.fund_transfer_count || 0;
      acc.total_transaction_count += transaction.total_transaction_count || 0;
      acc.total_bill_payment_count += transaction.bill_payment_count || 0;
      acc.total_cash_in_count += transaction.cash_in_count || 0;

      acc.total_withdraw_amount += parseAmount(transaction.withdraw_amount);
      acc.total_balance_inquiry_amount += parseAmount(
        transaction.balance_inquiry_amount
      );
      acc.total_fund_transfer_amount += parseAmount(
        transaction.fund_transfer_amount
      );
      acc.total_amount += parseAmount(transaction.total_amount);
      acc.total_transaction_fee_rcbc += parseAmount(
        transaction.transaction_fee_rcbc
      );
      acc.total_transaction_fee_merchant += parseAmount(
        transaction.transaction_fee_merchant
      );
      acc.total_bill_payment_amount += parseAmount(
        transaction.bill_payment_amount
      );
      acc.total_cash_in_amount += parseAmount(transaction.cash_in_amount);

      return acc;
    },
    {
      total_withdraw_count: 0,
      total_balance_inquiry_count: 0,
      total_fund_transfer_count: 0,
      total_transaction_count: 0,
      total_withdraw_amount: 0,
      total_balance_inquiry_amount: 0,
      total_fund_transfer_amount: 0,
      total_amount: 0,
      total_transaction_fee_rcbc: 0,
      total_transaction_fee_merchant: 0,
      total_bill_payment_count: 0,
      total_bill_payment_amount: 0,
      total_cash_in_count: 0,
      total_cash_in_amount: 0,
    }
  );
}

function calculateGeneration(
  users: any[],
  userId: number | undefined,
  rootUserId: number,
  generation = 0
): number {
  if (!userId || userId === rootUserId) return generation;
  const user = users.find((u) => u.ID === userId);
  if (!user) return generation;
  return calculateGeneration(
    users,
    user.user_upline_id,
    rootUserId,
    generation + 1
  );
}

// export async function getTransactionCounts(userId: string) {
//   try {
//     if (!userId) {
//       return {
//         success: false,
//         status: 400,
//         error: "User ID is required.",
//       };
//     }

//     // Get the user's merchant_id
//     const user = await prisma.pt_users.findUnique({
//       where: { ID: Number(userId) },
//       select: { merchant_id: true },
//     });

//     if (!user || !user.merchant_id) {
//       return {
//         success: false,
//         status: 404,
//         error: "User or merchant ID not found.",
//       };
//     }

//     // Count user's own transactions
//     const userTransactionCount = await prisma.pt_atm_transaction.count({
//       where: { merchant_id: user.merchant_id },
//     });

//     // Get all users under the current user, up to 10 levels deep, excluding the current user
//     const downlineUsers = await prisma.pt_users.findMany({
//       where: {
//         OR: [
//           { user_upline_id: Number(userId) },
//           {
//             user_upline_id: {
//               in: await getDownlineUserIds(Number(userId), 10),
//             },
//           },
//         ],
//       },
//       select: { merchant_id: true },
//     });

//     // Filter out users without a merchant_id
//     const merchantIds = downlineUsers
//       .filter((user) => user.merchant_id)
//       .map((user) => user.merchant_id);

//     // Count merchant transactions
//     const merchantTransactionCount = await prisma.pt_atm_transaction.count({
//       where: { merchant_id: { in: merchantIds as string[] } },
//     });

//     return {
//       success: true,
//       status: 200,
//       data: {
//         userTransactionCount,
//         merchantTransactionCount,
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching transaction counts:", error);
//     return {
//       success: false,
//       status: 500,
//       error: "An error occurred while fetching the transaction counts.",
//     };
//   }
// }

export async function getTransactionCounts(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        status: 400,
        error: "User ID is required.",
      };
    }

    const numericUserId = Number(userId);

    // Fetch user, downline users, and transaction counts in a single query
    const result: any = await prisma.$queryRaw`
      WITH RECURSIVE downline AS (
        SELECT ID, merchant_id, user_upline_id, 0 as depth
        FROM pt_users
        WHERE ID = ${numericUserId}
        
        UNION ALL
        
        SELECT u.ID, u.merchant_id, u.user_upline_id, d.depth + 1
        FROM pt_users u
        INNER JOIN downline d ON u.user_upline_id = d.ID
        WHERE d.depth < 10
      )
      SELECT 
        (SELECT COUNT(*) FROM pt_atm_transaction 
         WHERE merchant_id = (SELECT merchant_id FROM pt_users WHERE ID = ${numericUserId})) as userTransactionCount,
        (SELECT COUNT(*) FROM pt_atm_transaction 
         WHERE merchant_id IN (
           SELECT merchant_id 
           FROM downline 
           WHERE ID != ${numericUserId} AND merchant_id IS NOT NULL
         )) as merchantTransactionCount
    `;

    const { userTransactionCount, merchantTransactionCount } = result[0] as {
      userTransactionCount: bigint;
      merchantTransactionCount: bigint;
    };

    return {
      success: true,
      status: 200,
      data: {
        userTransactionCount: Number(userTransactionCount),
        merchantTransactionCount: Number(merchantTransactionCount),
      },
    };
  } catch (error) {
    console.error("Error fetching transaction counts:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the transaction counts.",
    };
  }
}

export async function getTransactionById(id: string) {
  try {
    if (!id) {
      return {
        success: false,
        status: 400,
        error: "Transaction ID is required.",
      };
    }

    const numericTransactionId = Number(id);

    const transaction = await prisma.pt_atm_transaction.findUnique({
      where: { ID: numericTransactionId },
    });

    const serializedTransaction = serializeDecimal(transaction);

    return {
      success: true,
      status: 200,
      data: serializedTransaction,
    };
  } catch (error) {}
}

export async function getTransactionCountsApproved(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        status: 400,
        error: "User ID is required.",
      };
    }

    const numericUserId = Number(userId);

    // Fetch user, downline users, and transaction counts in a single query
    const result: any = await prisma.$queryRaw`
      WITH RECURSIVE downline AS (
        SELECT ID, merchant_id, user_upline_id, 0 as depth
        FROM pt_users
        WHERE ID = ${numericUserId}
        
        UNION ALL
        
        SELECT u.ID, u.merchant_id, u.user_upline_id, d.depth + 1
        FROM pt_users u
        INNER JOIN downline d ON u.user_upline_id = d.ID
        WHERE d.depth < 10
      )
      SELECT 
        (SELECT COUNT(*) FROM pt_atm_transaction 
         WHERE merchant_id = (SELECT merchant_id FROM pt_users WHERE ID = ${numericUserId})) as userTransactionCount,
        (SELECT COUNT(*) FROM pt_atm_transaction 
         WHERE merchant_id IN (
           SELECT merchant_id 
           FROM downline 
           WHERE ID != ${numericUserId} AND merchant_id IS NOT NULL AND status = 'approved'
         )) as merchantTransactionCount
    `;

    const { userTransactionCount, merchantTransactionCount } = result[0] as {
      userTransactionCount: bigint;
      merchantTransactionCount: bigint;
    };

    return {
      success: true,
      status: 200,
      data: {
        userTransactionCount: Number(userTransactionCount),
        merchantTransactionCount: Number(merchantTransactionCount),
      },
    };
  } catch (error) {
    console.error("Error fetching transaction counts:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the transaction counts.",
    };
  }
}

export async function getAllAtmTransactions() {
  try {
    const atm_transactions = await prisma.pt_atm_transaction.findMany({
      orderBy: {
        transaction_date: "desc",
      },
    });
    const serializedTransactions = serializeDecimal(atm_transactions);
    return { success: true, data: serializedTransactions };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the transaction details.",
    };
  }
}

export async function createAtmTransactions(transactions: any[]) {
  try {
    const uniqueKeys = transactions.map((transaction) => ({
      transaction_date: transaction.transaction_date,
      merchant_id: transaction.merchant_id,
    }));

    const existingTransactions = await prisma.pt_atm_transaction.findMany({
      where: {
        OR: uniqueKeys.map((key) => ({
          transaction_date: key.transaction_date,
          merchant_id: key.merchant_id,
        })),
      },
      select: { transaction_date: true, merchant_id: true },
    });

    const existingKeys = new Set(
      existingTransactions.map(
        (transaction) =>
          `${transaction.transaction_date}-${transaction.merchant_id}`
      )
    );

    const newTransactions = transactions.filter(
      (transaction) =>
        !existingKeys.has(
          `${transaction.transaction_date}-${transaction.merchant_id}`
        )
    );

    if (newTransactions.length === 0) {
      return {
        success: false,
        error:
          "All transactions are duplicates. No new transactions to create.",
        duplicateCount: transactions.length,
      };
    }

    const result = await prisma.pt_atm_transaction.createMany({
      data: newTransactions,
    });

    return {
      success: true,
      count: result.count,
      skippedCount: transactions.length - newTransactions.length,
      message:
        result.count > 0
          ? `Successfully created ${result.count} transactions. Skipped ${
              transactions.length - newTransactions.length
            } duplicates.`
          : "No new transactions were created.",
    };
  } catch (error) {
    console.error("Error creating transactions:", error);
    return {
      success: false,
      error: "Failed to create transactions. Please try again.",
    };
  }
}

export async function updateTransactionStatusById(
  id: number,
  status: string
): Promise<boolean> {
  if (!id || typeof id !== "number") {
    throw new Error("Invalid ID parameter.");
  }

  if (!status || typeof status !== "string") {
    throw new Error("Invalid status parameter.");
  }

  try {
    // Prepare the data object based on status
    const updateData: any = { status };

    if (status === "approved") {
      updateData.approved_date = new Date();
    } else if (status === "verified") {
      updateData.verified_date = new Date();
    } else if (status === "rejected") {
      updateData.rejected_date = new Date();
    }

    // Update the transaction with the appropriate data
    await prisma.pt_atm_transaction.update({
      where: { ID: id },
      data: updateData,
    });

    // Generate passive income for approved transactions
    if (status === "approved") {
      // Process passive income synchronously
      await generatePassiveIncome(id);
    }

    return true;
  } catch (error) {
    console.error("Error updating transaction status:", error);
    return false;
  }
}

async function queuePassiveIncomeGeneration(transactionId: number) {
  // Use setTimeout to move this to the next event loop iteration
  // This releases the current connection back to the pool
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      generatePassiveIncome(transactionId)
        .then(() => resolve())
        .catch((error) => {
          console.error(
            `Error generating passive income for transaction ${transactionId}:`,
            error
          );
          resolve(); // Resolve anyway to prevent unhandled promise rejections
        });
    }, 100);
  });
}

// Optimized updateTransactionStatusByBatch
async function generatePassiveIncome(transactionId: number) {
  try {
    // Get transaction data
    const transaction = await prisma.pt_atm_transaction.findUnique({
      where: { ID: transactionId },
      select: {
        merchant_id: true,
        total_transaction_count: true,
        balance_inquiry_count: true,
      },
    });

    if (!transaction) {
      console.warn(`Transaction not found for ID: ${transactionId}`);
      return true;
    }

    // Get merchant data
    const merchant = await prisma.pt_users.findFirst({
      where: { merchant_id: transaction.merchant_id },
      select: { ID: true },
    });

    if (!merchant) {
      console.warn(
        `Merchant not found for merchant_id: ${transaction.merchant_id}`
      );
      return true;
    }

    // Get the complete upline chain first (similar to your referral incentive code)
    const uplineChain = await getCompleteUplineChain(merchant.ID);

    // If no uplines found, just return success
    if (uplineChain.length === 0) {
      // Fill with admin if needed
      const adminUser: any = await prisma.pt_users.findFirst({
        where: { ID: 1 },
        select: { ID: true, user_role: true },
      });

      if (adminUser) {
        uplineChain.push(adminUser);
        uplineChain.push(adminUser);
        uplineChain.push(adminUser);
      } else {
        return true;
      }
    }

    // Ensure we have at most 3 uplines
    const uplineDistributors = uplineChain.slice(0, 3);

    // If there are less than 3 upline distributors, fill with the admin
    if (uplineDistributors.length < 3) {
      const adminUser: any = await prisma.pt_users.findFirst({
        where: { ID: 1 },
        select: { ID: true, user_role: true },
      });

      if (adminUser) {
        while (uplineDistributors.length < 3) {
          uplineDistributors.push(adminUser);
        }
      }
    }

    // Calculate the correct transaction count
    const countedTransactions =
      (transaction.total_transaction_count ?? 0) -
      (transaction.balance_inquiry_count ?? 0);

    const incomeRates = [3, 1, 1]; // 3 for the nearest, 1 for the next two

    // Prepare batch data for income history and user credit updates
    const incomeHistoryData = [];
    const userCreditUpdates = [];

    // Aggregate updates for the same user
    const userCreditsMap = new Map();

    for (let i = 0; i < Math.min(uplineDistributors.length, 3); i++) {
      const distributor = uplineDistributors[i];
      const incomeAmount = countedTransactions * incomeRates[i];

      incomeHistoryData.push({
        transaction_id: transactionId,
        sender_user_id: merchant.ID,
        recipient_user_id: distributor.ID,
        income_amount: incomeAmount,
        level: i + 1,
      });

      // Aggregate credits for the same user (in case admin appears multiple times)
      const currentAmount = userCreditsMap.get(distributor.ID) || 0;
      userCreditsMap.set(distributor.ID, currentAmount + incomeAmount);
    }

    // Convert map to array of update operations
    for (const [userId, amount] of userCreditsMap.entries()) {
      userCreditUpdates.push(
        prisma.pt_users.update({
          where: { ID: userId },
          data: { user_credits: { increment: amount } },
        })
      );
    }

    // Execute all operations in a single transaction
    if (incomeHistoryData.length > 0) {
      await prisma.$transaction([
        ...userCreditUpdates,
        prisma.pt_passive_income_history.createMany({
          data: incomeHistoryData,
          skipDuplicates: true,
        }),
      ]);
    }

    return true;
  } catch (error) {
    console.error("Error generating passive income:", error);
    // Don't fail the approval process due to passive income generation errors
    return true;
  }
}

async function getCompleteUplineChain(userId: number) {
  const uplineChain = [];
  let currentId: any = userId;
  const processedIds = new Set(); // Prevent infinite loops

  try {
    // Get all uplines first
    while (currentId) {
      if (processedIds.has(currentId)) {
        break; // Prevent infinite loops
      }
      processedIds.add(currentId);

      const user = await prisma.pt_users.findUnique({
        where: { ID: currentId },
        select: {
          ID: true,
          user_upline_id: true,
          user_role: true,
        },
      });

      if (!user || !user.user_upline_id) break;

      // Get the upline
      const upline = await prisma.pt_users.findUnique({
        where: { ID: user.user_upline_id },
        select: {
          ID: true,
          user_upline_id: true,
          user_role: true,
        },
      });

      if (!upline) break;

      // Only add distributors to the chain
      if (
        upline.user_role === "Elite_Distributor_Package" ||
        upline.user_role === "Elite_Plus_Distributor_Package" ||
        upline.user_role === "admin"
      ) {
        uplineChain.push(upline);
      }

      currentId = upline.user_upline_id;

      // Limit to 3 uplines
      if (uplineChain.length >= 3) break;
    }

    return uplineChain;
  } catch (error) {
    console.error("Error getting upline chain:", error);
    return [];
  }
}

async function getUplineDistributorsWithRetry(userId: number, retries = 3) {
  let attempt = 0;
  let lastError = null;

  while (attempt < retries) {
    try {
      return await getUplineDistributors(userId);
    } catch (error) {
      lastError = error;
      attempt++;
      console.warn(
        `Retry ${attempt}/${retries} for getUplineDistributors failed:`,
        error
      );

      // Wait a bit before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, 500 * Math.pow(2, attempt))
      );
    }
  }

  console.error(
    `All ${retries} attempts to get upline distributors failed:`,
    lastError
  );
  // Return an empty array as fallback
  return [];
}

// Optimized getUplineDistributors function with better error handling
async function getUplineDistributors(userId: number) {
  try {
    // First try to get all upline distributors in a single efficient query
    // This reduces the number of database connections needed
    const uplineDistributors = [];

    try {
      // Get all uplines in a single query with a timeout
      const uplineQuery = `
        WITH RECURSIVE upline AS (
          SELECT ID, user_upline_id, user_role
          FROM pt_users
          WHERE ID = ?
          
          UNION ALL
          
          SELECT u.ID, u.user_upline_id, u.user_role
          FROM pt_users u
          JOIN upline ON upline.user_upline_id = u.ID
          WHERE upline.user_upline_id IS NOT NULL
        )
        SELECT ID, user_role
        FROM upline
        WHERE ID != ? AND (
          user_role = 'Elite_Distributor_Package' OR 
          user_role = 'Elite_Plus_Distributor_Package' OR 
          user_role = 'admin'
        )
        ORDER BY (
          CASE WHEN user_role = 'admin' THEN 2 ELSE 1 END
        )
        LIMIT 3;
      `;

      const result = await prisma.$queryRawUnsafe(uplineQuery, userId, userId);

      // Process results
      for (const upline of result as any[]) {
        uplineDistributors.push({
          ID: Number(upline.ID),
          user_role: upline.user_role,
        });
      }
    } catch (error) {
      console.warn(
        "Optimized upline query failed, using fallback approach:",
        error
      );
      // Fallback to a simpler approach if the recursive query fails
    }

    // If we didn't get enough distributors with the optimized query, use a simpler approach
    if (uplineDistributors.length < 3) {
      // Get the user's immediate upline
      const user = await prisma.pt_users.findUnique({
        where: { ID: userId },
        select: { user_upline_id: true },
      });

      if (user?.user_upline_id) {
        // Get the upline chain one by one (less efficient but more reliable)
        let currentId: any = user.user_upline_id;
        const processedIds = new Set();

        while (
          uplineDistributors.length < 3 &&
          currentId &&
          !processedIds.has(currentId)
        ) {
          processedIds.add(currentId);

          const uplineUser = await prisma.pt_users.findUnique({
            where: { ID: currentId },
            select: { ID: true, user_upline_id: true, user_role: true },
          });

          if (!uplineUser) break;

          if (
            uplineUser.user_role === "Elite_Distributor_Package" ||
            uplineUser.user_role === "Elite_Plus_Distributor_Package" ||
            uplineUser.user_role === "admin"
          ) {
            // Check if this distributor is already in our list
            if (!uplineDistributors.some((d) => d.ID === uplineUser.ID)) {
              uplineDistributors.push({
                ID: uplineUser.ID,
                user_role: uplineUser.user_role,
              });
            }
          }

          currentId = uplineUser.user_upline_id;
        }
      }
    }

    // If there are less than 3 upline distributors, fill with the admin
    if (uplineDistributors.length < 3) {
      const adminUser = await prisma.pt_users.findFirst({
        where: { ID: 1 },
        select: { ID: true, user_role: true },
      });

      if (adminUser) {
        while (uplineDistributors.length < 3) {
          uplineDistributors.push(adminUser);
        }
      }
    }

    return uplineDistributors;
  } catch (error) {
    console.error("Error fetching upline distributors:", error);
    throw error; // Let the retry mechanism handle it
  }
}

// Optimized updateTransactionStatusByBatch with better error handling
export async function updateTransactionStatusByBatch(
  ids: number[],
  status: string,
  batchSize = 2 // Changed default from 3 to 2
) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return {
      success: false,
      error: "Invalid IDs parameter.",
      processedIds: [],
      remainingIds: [],
      isComplete: true,
    };
  }

  if (!status || typeof status !== "string") {
    return {
      success: false,
      error: "Invalid status parameter.",
      processedIds: [],
      remainingIds: ids,
      isComplete: false,
    };
  }

  try {
    // Process only the first batchSize transactions
    const batchIds = ids.slice(0, batchSize);

    // Prepare the data object based on status
    const updateData: any = { status };

    if (status === "approved") {
      updateData.approved_date = new Date();
    } else if (status === "verified") {
      updateData.verified_date = new Date();
    } else if (status === "rejected") {
      updateData.rejected_date = new Date();
    }

    // Update all transactions in the batch first
    await prisma.pt_atm_transaction.updateMany({
      where: { ID: { in: batchIds } },
      data: updateData,
    });

    // For approved transactions, process passive income generation
    if (status === "approved") {
      // Process each transaction's passive income one by one
      for (const id of batchIds) {
        try {
          await generatePassiveIncome(id);
        } catch (error) {
          console.error(
            `Error generating passive income for transaction ${id}:`,
            error
          );
          // Continue with the next transaction even if this one fails
        }
      }
    }

    // Calculate remaining IDs
    const remainingIds = ids.slice(batchSize);

    return {
      success: true,
      message: `Successfully updated ${batchIds.length} transactions.`,
      processedIds: batchIds,
      remainingIds: remainingIds,
      isComplete: remainingIds.length === 0,
    };
  } catch (error) {
    console.error("Error updating transaction statuses:", error);
    return {
      success: false,
      error: "Failed to update transaction statuses.",
      processedIds: [],
      remainingIds: ids,
      isComplete: false,
    };
  }
}

export async function getTransactionsByStatus(status: string) {
  try {
    const transactions = await prisma.pt_atm_transaction.findMany({
      where: { status },
    });
    const serializedTransactions = serializeDecimal(transactions);
    return { success: true, data: serializedTransactions };
  } catch (error) {
    console.error("Error fetching transactions by status:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the transaction details.",
    };
  }
}

export async function getMerchantsByUplineId(uplineId: string) {
  try {
    if (!uplineId) {
      return {
        success: false,
        status: 400,
        error: "Upline ID is required.",
      };
    }

    const numericUplineId = Number(uplineId);

    // Get all merchants under this upline (direct and indirect) using recursive CTE
    const downlineMerchantsResult: any = await prisma.$queryRaw`
      WITH RECURSIVE downline AS (
        -- Base case: Start with the upline user
        SELECT ID, merchant_id, user_nicename, user_upline_id, 0 as depth
        FROM pt_users
        WHERE ID = ${numericUplineId}
        
        UNION ALL
        
        -- Recursive case: Find all users whose upline is in our result set
        SELECT u.ID, u.merchant_id, u.user_nicename, u.user_upline_id, d.depth + 1
        FROM pt_users u
        INNER JOIN downline d ON u.user_upline_id = d.ID
        WHERE d.depth < 10  -- Limit to 10 levels deep to prevent infinite recursion
      )
      SELECT 
        ID,
        merchant_id,
        user_nicename,
        user_upline_id,
        depth as generation
      FROM downline
      WHERE merchant_id IS NOT NULL
      ORDER BY depth, ID
    `;

    if (downlineMerchantsResult.length === 0) {
      return {
        success: false,
        status: 404,
        error: "No merchants found under this upline ID.",
      };
    }

    // For each merchant, check if they have transactions
    const merchantsWithTransactionStatus = await Promise.all(
      downlineMerchantsResult.map(async (merchant: any) => {
        // Convert any BigInt values to regular numbers
        const processedMerchant = Object.fromEntries(
          Object.entries(merchant).map(([key, value]) => [
            key,
            typeof value === "bigint" ? Number(value) : value,
          ])
        );

        if (!processedMerchant.merchant_id) {
          return {
            ...processedMerchant,
            has_transactions: false,
            transaction_count: 0,
          };
        }

        const transactionCount = await prisma.pt_atm_transaction.count({
          where: { merchant_id: processedMerchant.merchant_id },
        });

        return {
          ...processedMerchant,
          has_transactions: transactionCount > 0,
          transaction_count: Number(transactionCount), // Convert BigInt to Number
        };
      })
    );

    // Get transactions for merchants who have them
    const merchantsWithTransactions = [];
    for (const merchant of merchantsWithTransactionStatus) {
      if (merchant.has_transactions) {
        const transactions = await prisma.pt_atm_transaction.findMany({
          where: { merchant_id: merchant.merchant_id },
          orderBy: { transaction_date: "desc" },
        });

        merchantsWithTransactions.push({
          ...merchant,
          transactions: serializeDecimal(transactions),
        });
      } else {
        merchantsWithTransactions.push(merchant);
      }
    }

    // Organize by generation (depth)
    const organizedByGeneration = merchantsWithTransactions.reduce(
      (acc: any, merchant: any) => {
        const generation = merchant.generation;
        if (!acc[generation]) {
          acc[generation] = [];
        }
        acc[generation].push(merchant);
        return acc;
      },
      {}
    );

    // Make sure all numeric values are properly converted from BigInt
    const safeData = {
      merchants: merchantsWithTransactions.map((merchant: any) => {
        if (merchant.transactions) {
          return {
            ...merchant,
            transactions: merchant.transactions.map((tx: any) => {
              return Object.fromEntries(
                Object.entries(tx).map(([key, value]) => [
                  key,
                  typeof value === "bigint" ? Number(value) : value,
                ])
              );
            }),
          };
        }
        return merchant;
      }),
      merchants_by_generation: Object.fromEntries(
        Object.entries(organizedByGeneration).map(([gen, merchants]) => [
          gen,
          (merchants as any[]).map((m: any) => {
            return Object.fromEntries(
              Object.entries(m).map(([key, value]) => [
                key,
                typeof value === "bigint" ? Number(value) : value,
              ])
            );
          }),
        ])
      ),
      total_merchants: merchantsWithTransactions.length,
      merchants_with_transactions: merchantsWithTransactions.filter(
        (m: any) => m.has_transactions
      ).length,
      merchants_without_transactions: merchantsWithTransactions.filter(
        (m: any) => !m.has_transactions
      ).length,
    };

    return {
      success: true,
      status: 200,
      data: safeData,
    };
  } catch (error) {
    console.error("Error fetching merchants:", error);
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the merchant details.",
    };
  }
}
