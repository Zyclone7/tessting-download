"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma-singleton";
import { revalidatePath } from "next/cache";

// Define the Voucher type matching your Prisma model
type Voucher = {
  tv_voucher_id: number;
  voucher_code: string;
  card_number: string;
  product_name: string;
  account: string | null;
  amount: number;
  discount: number | null;
  status: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  owned_by: string | null;
};

// Use Prisma's generated type
type VoucherUpdateInput = Prisma.pt_tv_voucherUpdateInput;
type VoucherWhereUniqueInput = Prisma.pt_tv_voucherWhereUniqueInput;

export async function getAllTvVouchers() {
  try {
    const tv_vouchers = await prisma.pt_tv_voucher.findMany({
      orderBy: {
        created_at: "asc",
      },
    });

    const formattedVouchers = await Promise.all(
      tv_vouchers.map(async (voucher) => {
        let ownerName = null;
        if (voucher.owned_by) {
          const owner = await prisma.pt_users.findUnique({
            where: { ID: voucher.owned_by },
            select: { user_nicename: true },
          });
          ownerName = owner?.user_nicename || null;
        }

        // Fetch product details via manual join
        const product = await prisma.pt_products.findUnique({
          where: { product_code: voucher.product_name },
          select: {
            product_code: true,
            base_price: true,
            product_type: true,
            pt_product_role_prices: true,
          },
        });

        return {
          ...voucher,
          amount: voucher.amount ?? 0,
          owned_by: ownerName,
          product: product || null, // embed product details
        };
      })
    );

    return { vouchers: formattedVouchers };
  } catch (error) {
    console.error("Error fetching TV vouchers:", error);
    throw new Error("Failed to fetch TV vouchers");
  }
}

// Modified createTvVouchers function with optimized bulk insert
export async function createTvVouchers(vouchers: any[]) {
  if (!Array.isArray(vouchers) || vouchers.length === 0) {
    return { success: false, error: "No valid vouchers provided" };
  }

  const validVouchers = vouchers
    .filter((voucher) => voucher.card_number)
    .map((voucher) => ({
      voucher_code: String(voucher.voucher_code),
      amount: voucher.amount === null ? null : Number(voucher.amount),
      account: null, // Set to null by default
      product_name: String(voucher.product_name),
      status: String(voucher.status || "active"),
      card_number: String(voucher.card_number),
      created_at: new Date().toISOString(),
      discount: Number(voucher.discount || 0),
      updated_at: null,
      owned_by: null,
    }));

  if (validVouchers.length === 0) {
    return { success: false, error: "No valid vouchers after filtering" };
  }

  try {
    // Create TV vouchers in bulk
    const result = await prisma.pt_tv_voucher.createMany({
      data: validVouchers,
      skipDuplicates: true,
    });

    const duplicateCount = validVouchers.length - result.count;

    if (duplicateCount > 0) {
      const duplicates = await prisma.pt_tv_voucher.findMany({
        where: {
          OR: validVouchers.map((v) => ({
            OR: [{ voucher_code: v.voucher_code }],
          })),
        },
        select: {
          voucher_code: true,
        },
      });

      return {
        success: true,
        count: result.count,
        duplicateCount,
        duplicates,
        warning: `${duplicateCount} voucher(s) were skipped due to duplicate serial numbers or reference numbers.`,
      };
    }

    revalidatePath("/admin/vouchers/tv");
    return { success: true, count: result.count };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error:
            "Duplicate entries found. Please ensure all serial numbers and reference numbers are unique.",
        };
      }
    }
    console.error("Error creating vouchers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateTvVoucher(id: number, data: Partial<Voucher>) {
  try {
    if (!id || typeof id !== "number") {
      return { success: false, message: "Invalid voucher ID" };
    }

    if (!data || Object.keys(data).length === 0) {
      return { success: false, message: "No update data provided" };
    }

    let newCode: string | undefined;
    if (data.voucher_code !== undefined) {
      newCode =
        typeof data.voucher_code === "string"
          ? data.voucher_code.trim()
          : undefined;

      if (newCode) {
        const duplicateCode = await prisma.pt_tv_voucher.findFirst({
          where: {
            voucher_code: newCode,
            tv_voucher_id: { not: id },
          },
        });
        if (duplicateCode) {
          return { success: false, message: "Code number already exists" };
        }
      }
    }

    let newCardNum: string | undefined;
    if (data.card_number !== undefined) {
      newCardNum =
        typeof data.card_number === "string"
          ? data.card_number.trim()
          : undefined;

      if (newCardNum) {
        const duplicateCardNum = await prisma.pt_tv_voucher.findFirst({
          where: {
            card_number: newCardNum,
            tv_voucher_id: { not: id },
          },
        });
        if (duplicateCardNum) {
          return { success: false, message: "Card number already exists" };
        }
      }
    }

    // Prepare update data properly
    const updateData: Prisma.pt_tv_voucherUpdateInput = {
      updated_at: new Date(),
      ...(newCode !== undefined ? { voucher_code: { set: newCode } } : {}),
      ...(newCardNum !== undefined ? { card_number: { set: newCardNum } } : {}),
      ...(data.amount !== undefined ? { amount: { set: data.amount } } : {}),
      ...(data.discount !== undefined
        ? { discount: { set: data.discount } }
        : {}),
      ...(data.account !== undefined ? { account: { set: data.account } } : {}),
      ...(data.status !== undefined ? { status: { set: data.status } } : {}),
      ...(data.owned_by !== undefined
        ? { owned_by: { set: Number(data.owned_by) } }
        : {}),
      ...(data.created_at !== undefined
        ? { created_at: { set: data.created_at } }
        : {}),
    };

    // Update the TV voucher
    await prisma.pt_tv_voucher.update({
      where: { tv_voucher_id: id },
      data: updateData,
    });

    // If voucher code is updated, also update the product entry
    if (newCode) {
      // Check if product exists
      const existingProduct = await prisma.pt_products.findUnique({
        where: { product_code: newCode },
      });

      if (existingProduct) {
        // Update existing product to ensure product_type is "tv"
        await prisma.pt_products.update({
          where: { product_code: newCode },
          data: {
            product_type: "tv",
            ...(data.amount !== undefined ? { base_price: data.amount } : {}),
          },
        });
      } else {
        // Create new product with product_type "tv"
        await prisma.pt_products.create({
          data: {
            product_code: newCode,
            base_price: data.amount === null ? 0 : data.amount,
            product_type: "tv",
          },
        });
      }
    }

    revalidatePath("/admin/vouchers/tv");
    return { success: true, message: "Voucher updated successfully" };
  } catch (error) {
    console.error("Error updating voucher:", error);
    return { success: false, message: "Failed to update voucher" };
  }
}

export async function deleteTvVoucher(id: number) {
  try {
    // Get the voucher first to get its voucher_code
    const voucher = await prisma.pt_tv_voucher.findUnique({
      where: { tv_voucher_id: id },
      select: { voucher_code: true },
    });

    if (voucher) {
      // Delete the voucher
      await prisma.pt_tv_voucher.delete({
        where: { tv_voucher_id: id },
      });

      // Check if there are other vouchers with the same code
      const otherVouchers = await prisma.pt_tv_voucher.findFirst({
        where: { voucher_code: voucher.voucher_code },
      });

      // If no other vouchers exist with this code, delete the product entry too
      if (!otherVouchers) {
        await prisma.pt_products.deleteMany({
          where: { product_code: voucher.voucher_code },
        });
      }
    }

    revalidatePath("/admin/vouchers/tv");
    return { success: true, message: "Voucher deleted successfully" };
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("Failed to delete product");
  }
}
