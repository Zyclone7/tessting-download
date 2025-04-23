"use server"

import { prisma } from "@/lib/prisma-singleton"

export async function getReferralIncomeHistory() {
  try {
    const referralIncomeHistory = await prisma.pt_referral_income_history.findMany({
      select: {
        id: true,
        invitation_code_id: true,
        sender_user_id: true,
        recipient_user_id: true,
        income_amount: true,
        level: true,
        created_at: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    const userIds = new Set(
      referralIncomeHistory.flatMap(
        (t) => [t.sender_user_id, t.recipient_user_id].filter((id) => id !== null) as number[],
      ),
    )
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

    const invitationCodeIds = new Set(referralIncomeHistory.map((t) => t.invitation_code_id).filter(Boolean))
    const invitationCodes = await prisma.pt_invitation_codes.findMany({
      where: {
        id: {
          in: Array.from(invitationCodeIds) as number[],
        },
      },
    })

    const userMap = new Map(users.map((user) => [user.ID, user]))
    const invitationCodeMap = new Map(invitationCodes.map((code) => [code.id, code]))

    const transactionsWithDetails = referralIncomeHistory.map((transaction) => ({
      ...transaction,
      income_amount: transaction.income_amount?.toString(), // Convert Decimal to string
      sender: transaction.sender_user_id ? userMap.get(transaction.sender_user_id) || null : null,
      recipient: transaction.recipient_user_id ? userMap.get(transaction.recipient_user_id) || null : null,
      invitation_code: transaction.invitation_code_id
        ? invitationCodeMap.get(transaction.invitation_code_id) || null
        : null,
    }))

    return { success: true, data: transactionsWithDetails }
  } catch (error) {
    console.error("Error fetching referral income history:", error)
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the referral income history details.",
    }
  }
}

export async function getReferralIncomeHistoryByUserId(userId: number) {
  try {
    const referralIncomeHistory = await prisma.pt_referral_income_history.findMany({
      select: {
        id: true,
        invitation_code_id: true,
        sender_user_id: true,
        recipient_user_id: true,
        income_amount: true,
        level: true,
        created_at: true,
      },
      orderBy: {
        id: "desc",
      },
      where: {
        recipient_user_id: userId,
      }
    });

    const userIds = new Set(
      referralIncomeHistory.flatMap(
        (t) => [t.sender_user_id, t.recipient_user_id].filter((id) => id !== null) as number[],
      ),
    )
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

    const invitationCodeIds = new Set(referralIncomeHistory.map((t) => t.invitation_code_id).filter(Boolean))
    const invitationCodes = await prisma.pt_invitation_codes.findMany({
      where: {
        id: {
          in: Array.from(invitationCodeIds) as number[],
        },
      },
    })

    const userMap = new Map(users.map((user) => [user.ID, user]))
    const invitationCodeMap = new Map(invitationCodes.map((code) => [code.id, code]))

    const transactionsWithDetails = referralIncomeHistory.map((transaction) => ({
      ...transaction,
      income_amount: transaction.income_amount?.toString(), // Convert Decimal to string
      sender: transaction.sender_user_id ? userMap.get(transaction.sender_user_id) || null : null,
      recipient: transaction.recipient_user_id ? userMap.get(transaction.recipient_user_id) || null : null,
      invitation_code: transaction.invitation_code_id
        ? invitationCodeMap.get(transaction.invitation_code_id) || null
        : null,
    }))

    return { success: true, data: transactionsWithDetails }
  } catch (error) {
    console.error("Error fetching referral income history:", error)
    return {
      success: false,
      status: 500,
      error: "An error occurred while fetching the referral income history details.",
    }
  }
}
