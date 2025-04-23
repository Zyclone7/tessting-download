"use server"

import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma-singleton";
import { cache } from "react"

interface Incentive {
  id?: number
  generation: number
  basic_incentive: number
  premium_incentive: number
  elite_incentive: number
  elite_plus_incentive: number
}

export async function getIncentives(productId: number) {
  try {
    const incentives = await prisma.pt_incentive_programs.findMany({
      where: { product_id: productId },
      orderBy: { generation: "asc" },
    })
    return incentives.map((incentive) => ({
      ...incentive,
      basic_incentive: Number(incentive.basic_incentive),
      premium_incentive: Number(incentive.premium_incentive),
      elite_incentive: Number(incentive.elite_incentive),
      elite_plus_incentive: Number(incentive.elite_plus_incentive),
    }))
  } catch (error) {
    console.error("Error fetching incentives:", error)
    throw new Error("Failed to fetch incentives")
  }
}

export async function updateIncentives(productId: number, incentives: Incentive[]) {
  try {
    await prisma.$transaction(async (tx) => {
      // Delete existing incentives for the product
      await tx.pt_incentive_programs.deleteMany({
        where: { product_id: productId },
      })

      // Create new incentives with corrected generation numbers
      await tx.pt_incentive_programs.createMany({
        data: incentives.map((incentive, index) => ({
          product_id: productId,
          generation: index + 1, // Assign generation numbers starting from 1
          basic_incentive: new Prisma.Decimal(incentive.basic_incentive),
          premium_incentive: new Prisma.Decimal(incentive.premium_incentive),
          elite_incentive: new Prisma.Decimal(incentive.elite_incentive),
          elite_plus_incentive: new Prisma.Decimal(incentive.elite_plus_incentive),
        })),
      })
    })

    revalidatePath("/products")
    return { success: true }
  } catch (error) {
    console.error("Error updating incentives:", error)
    throw new Error("Failed to update incentives")
  }
}

export async function deleteIncentive(productId: number, incentiveId: number) {
  try {
    await prisma.pt_incentive_programs.delete({
      where: { id: incentiveId, product_id: productId },
    })
    revalidatePath("/products")
    return { success: true }
  } catch (error) {
    console.error("Error deleting incentive:", error)
    throw new Error("Failed to delete incentive")
  }
}


async function getIncentivePrograms(packageType: string) {
  const product = await prisma.pt_package_products.findFirst({
    where: { name: packageType },
    include: {
      pt_incentive_programs: true,
    },
  });

  if (!product || !product.pt_incentive_programs || product.pt_incentive_programs.length === 0) {
    return null;
  }

  return product.pt_incentive_programs.reduce(
    (acc, incentive) => {
      if (incentive && incentive.generation) {
        acc[incentive.generation] = {
          Basic: incentive.basic_incentive,
          Premium: incentive.premium_incentive,
          Elite: incentive.elite_incentive,
          ElitePlus: incentive.elite_plus_incentive,
        };
      }
      return acc;
    },
    {} as Record<number, Record<string, any>>,
  );
}

async function getInvitationCodeId(code: string) {
  const invitationCode = await prisma.pt_invitation_codes.findFirst({
    where: { code },
    select: { id: true },
  });
  return invitationCode?.id;
}

export async function applyReferralIncentives(
  uplineId: number,
  referredPackage: string,
  senderUserId: number,
  referralCode?: string,
  startGen = 1,
  endGen = 3,
) {
  const incentives = [];

  try {
    // First, get the complete upline chain
    const uplineChain = [];
    let currentId: any = uplineId;

    // Get all uplines first
    while (currentId) {
      const upline = await prisma.pt_users.findUnique({
        where: { ID: currentId },
        select: {
          ID: true,
          user_upline_id: true,
          user_role: true,
        },
      });

      if (!upline) break;
      uplineChain.push(upline);
      currentId = upline.user_upline_id;
    }

    // Process only the uplines within the specified generation range
    for (let i = startGen - 1; i < Math.min(endGen, uplineChain.length); i++) {
      const upline = uplineChain[i];
      const generation = i + 1;

      if (!upline.user_role) continue;

      const incentivePrograms = await getIncentivePrograms(upline.user_role);
      if (!incentivePrograms || !incentivePrograms[generation]) continue;

      let packageKey: "Basic" | "Premium" | "Elite" | "ElitePlus";
      switch (referredPackage) {
        case "Premium_Merchant_Package":
          packageKey = "Premium";
          break;
        case "Elite_Distributor_Package":
          packageKey = "Elite";
          break;
        case "Elite_Plus_Distributor_Package":
          packageKey = "ElitePlus";
          break;
        default:
          packageKey = "Basic";
      }

      const incentiveAmount = incentivePrograms[generation][packageKey];
      if (!incentiveAmount) continue;

      try {
        const incentive =
          typeof incentiveAmount.toNumber === "function" ? incentiveAmount.toNumber() : Number(incentiveAmount);

        if (incentive > 0) {
          // Check if incentive was already given
          const existingIncentive = await prisma.pt_referral_income_history.findFirst({
            where: {
              sender_user_id: senderUserId,
              recipient_user_id: upline.ID,
              level: generation,
            },
          });

          if (!existingIncentive) {
            incentives.push({
              invitation_code_id: referralCode ? await getInvitationCodeId(referralCode) : undefined,
              sender_user_id: senderUserId,
              recipient_user_id: upline.ID,
              income_amount: incentive,
              level: generation,
            });
          }
        }
      } catch (error) {
        console.error(`Error processing incentive for generation ${generation}:`, error);
        continue;
      }
    }

    if (incentives.length > 0) {
      await prisma.$transaction([
        ...incentives.map(({ recipient_user_id, income_amount }) =>
          prisma.pt_users.update({
            where: { ID: recipient_user_id },
            data: { user_credits: { increment: income_amount } },
          }),
        ),
        prisma.pt_referral_income_history.createMany({
          data: incentives,
        }),
      ]);
    }

    // Return nextGeneration only if there are more uplines to process
    const hasMoreUplines = endGen < uplineChain.length;

    return {
      success: true,
      message: `Referral incentives applied successfully for generations ${startGen} to ${endGen}`,
      nextGeneration: hasMoreUplines ? endGen + 1 : null,
    };
  } catch (error) {
    console.error("Error applying referral incentives:", error);
    throw new Error("Failed to apply referral incentives");
  }
}