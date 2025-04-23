"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma-singleton";
import { revalidatePath } from "next/cache";

// Define the Voucher type matching your Prisma model
type Voucher = {
  wifi_voucher_id: number
  code: string | null
  amount: number
  surfing: number | null
  duration: string | null
  validity_text: string | null
  validity_days: number
  status: string | null
  note: string | null
  voucher_created_at: string | null
  created_at: Date | null
  updated_at: Date | null
  owned_by: string | null
}

// Use Prisma's generated type
type VoucherUpdateInput = Prisma.pt_wifi_voucherUpdateInput
type VoucherWhereUniqueInput = Prisma.pt_wifi_voucherWhereUniqueInput

export async function getAllWifiVouchers() {
  try {
    const wifi_vouchers = await prisma.pt_wifi_voucher.findMany({
      orderBy: {
        created_at: "asc", // or 'desc' for descending order
      },
    });

    const formattedVouchers = await Promise.all(
      wifi_vouchers.map(async (voucher) => {
        let ownerName = null;
        if (voucher.owned_by) {
          const owner = await prisma.pt_users.findUnique({
            where: { ID: voucher.owned_by },
            select: { user_nicename: true },
          });
          ownerName = owner?.user_nicename || null;
        }

        
        return {
          ...voucher,
          owned_by: ownerName,
        };
      })
    );

    return { vouchers: formattedVouchers };
  } catch (error) {
    console.error("Error fetching WIFI vouchers:", error);
    throw new Error("Failed to fetch WIFI vouchers");
  }
}

export async function createWifiVouchers(vouchers: any[]) {
  if (!Array.isArray(vouchers) || vouchers.length === 0) {
    return { success: false, error: "No valid vouchers provided" };
  }

  const validVouchers = vouchers
    .filter(
      (voucher) =>
        typeof voucher.amount === "number" &&
        voucher.code
    )
    .map((voucher) => ({
      code: String(voucher.code),
      amount: Number(voucher.amount),
      surfing: Number(voucher.surfing),
      validity_days: Number(voucher.validityDays), // Match frontend casing
      duration: String(voucher.duration),
      status: "null",
      note: String(voucher.note),
      voucher_created_at: new Date(voucher.createdAt).toISOString(), // Proper date handling
      created_at: new Date().toISOString(),
      validity_text: String(voucher.validityText), // Match frontend casing
      updated_at: null,
      owned_by: null,
    }));

  if (validVouchers.length === 0) {
    return { success: false, error: "No valid vouchers after filtering" };
  }

  try {
    const result = await prisma.pt_wifi_voucher.createMany({
      data: validVouchers,
      skipDuplicates: true,
    });

    const duplicateCount = validVouchers.length - result.count;

    if (duplicateCount > 0) {
      const duplicates = await prisma.pt_wifi_voucher.findMany({
        where: {
          OR: validVouchers.map((v) => ({
            OR: [
              { code: v.code },
            ],
          })),
        },
        select: {
          code: true,
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

export async function updateWifiVoucher(id: number, data: Partial<Voucher>) {
  try {
    // Validate ID
    if (!id || typeof id !== "number") {
      return { success: false, message: "Invalid voucher ID" }
    }

    // Validate update data
    if (!data || Object.keys(data).length === 0) {
      return { success: false, message: "No update data provided" }
    }

    const where: VoucherWhereUniqueInput = { wifi_voucher_id: id }

    // Make sure voucher exists
    const voucher = await prisma.pt_wifi_voucher.findUnique({ where })
    if (!voucher) {
      return { success: false, message: "Voucher not found" }
    }

    // Convert the incoming data to Prisma-compatible update object
    const updateData: VoucherUpdateInput = {}

    // Handle string fields (can be null)
    if (data.code !== undefined) {
      updateData.code = data.code === null ? { set: undefined } : data.code
    }

    if (data.duration !== undefined) {
      updateData.duration = data.duration === null ? { set: undefined } : data.duration
    }

    if (data.validity_text !== undefined) {
      updateData.validity_text = data.validity_text === null ? { set: undefined } : data.validity_text
    }

    if (data.status !== undefined) {
      updateData.status = data.status === null ? { set: null } : data.status
    }

    if (data.note !== undefined) {
      updateData.note = data.note === null ? { set: null } : data.note
    }

    if (data.voucher_created_at !== undefined) {
      updateData.voucher_created_at = data.voucher_created_at === null ? { set: undefined } : new Date(data.voucher_created_at).toISOString()
    }

    // Handle number fields
    if (data.amount !== undefined) {
      updateData.amount = Number(data.amount)
    }

    if (data.surfing !== undefined) {
      updateData.surfing = data.surfing === null ? { set: undefined } : Number(data.surfing)
    }

    if (data.validity_days !== undefined) {
      updateData.validity_days = Number(data.validity_days)
    }

    // Handle owned_by which needs special parsing
    if (data.owned_by !== undefined) {
      // Convert to number or null for the database
      updateData.owned_by =
        data.owned_by === null || data.owned_by === "" ? { set: null } : Number.parseInt(String(data.owned_by))
    }

    // Check for duplicate code
    if (updateData.code !== undefined && updateData.code !== null && typeof updateData.code === "string") {
      const duplicateCode = await prisma.pt_wifi_voucher.findFirst({
        where: {
          code: updateData.code,
          wifi_voucher_id: { not: id },
        },
      })

      if (duplicateCode) {
        return { success: false, message: "Code number already exists" }
      }
    }

    // Perform the update with properly formatted data
    await prisma.pt_wifi_voucher.update({
      where,
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    })

    revalidatePath("/admin/vouchers/wifi")
    return { success: true, message: "Voucher updated successfully" }
  } catch (error: any) {
    console.error("Error updating voucher:", error)
    return {
      success: false,
      message: error.message || "Failed to update voucher",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}


export async function deleteWifiVoucher(id: number) {
  try {
      await prisma.pt_wifi_voucher.delete({
        where: { wifi_voucher_id: id },
      });
      revalidatePath("/admin/vouchers/wifi");
    return { success: true, message: "Voucher deleted successfully" };
    } catch (error) {
      console.error("Error deleting product:", error);
      throw new Error("Failed to delete product");
    }
}