"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma-singleton";
import { revalidatePath } from "next/cache";

// Define the Voucher type matching your Prisma model
type Voucher = {
  gsat_voucher_id: number;
  serial_number: string | null;
  reference_number: string | null;
  amount: number;
  discount: number;
  product_code: string;
  status: string | null;
  expiry_date: Date | null;
  used_date: Date | null;
  created_at: Date;
  updated_at: Date;
  owned_by: string | null;
  owner_role: string | null;
};

// Use Prisma's generated type
type VoucherUpdateInput = Prisma.pt_gsat_voucherUpdateInput;
type VoucherWhereUniqueInput = Prisma.pt_gsat_voucherWhereUniqueInput;

export async function getAllGsatVouchers() {
  try {
    const gsat_vouchers = await prisma.pt_gsat_voucher.findMany({
      orderBy: {
        created_at: "asc", // or 'desc' for descending order
      },
    });

    const formattedVouchers = await Promise.all(
      gsat_vouchers.map(async (voucher) => {
        let ownerName = null;
        let ownerRole = null;
        if (voucher.owned_by) {
          const owner = await prisma.pt_users.findUnique({
            where: { ID: voucher.owned_by },
            select: { user_nicename: true, user_role: true },
          });
          ownerName = owner?.user_nicename || null;
          ownerRole = owner?.user_role || null;
        }

        return {
          ...voucher,
          owned_by: ownerName,
          owner_role: ownerRole,
        };
      })
    );

    return { vouchers: formattedVouchers };
  } catch (error) {
    console.error("Error fetching GSAT vouchers:", error);
    throw new Error("Failed to fetch GSAT vouchers");
  }
}

export async function createGsatVouchers(vouchers: any[]) {
  if (!Array.isArray(vouchers) || vouchers.length === 0) {
    return { success: false, error: "No valid vouchers provided" };
  }

  const validVouchers = vouchers
    .filter(
      (voucher) =>
        voucher.serial_number &&
        voucher.reference_number &&
        voucher.product_code
    )
    .map((voucher) => ({
      serial_number: String(voucher.serial_number),
      reference_number: String(voucher.reference_number),
      amount: null,
      discount: null,
      product_code: String(voucher.product_code),
      status: "null",
      expiry_date: null,
      used_date: null,
      owned_by: null,
    }));

  if (validVouchers.length === 0) {
    return { success: false, error: "No valid vouchers after filtering" };
  }

  try {
    const result = await prisma.pt_gsat_voucher.createMany({
      data: validVouchers,
      skipDuplicates: true,
    });

    const duplicateCount = validVouchers.length - result.count;

    if (duplicateCount > 0) {
      const duplicates = await prisma.pt_gsat_voucher.findMany({
        where: {
          OR: validVouchers.map((v) => ({
            OR: [
              { serial_number: v.serial_number },
              { reference_number: v.reference_number },
            ],
          })),
        },
        select: {
          serial_number: true,
          reference_number: true,
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

export async function updateGsatVoucher(
  id: number,
  data: Partial<VoucherUpdateInput>
) {
  try {
    // Validate ID
    if (!id || typeof id !== "number") {
      return { success: false, message: "Invalid voucher ID" };
    }

    // Validate update data
    if (!data || Object.keys(data).length === 0) {
      return { success: false, message: "No update data provided" };
    }

    const where: VoucherWhereUniqueInput = { gsat_voucher_id: id };

    // Make sure voucher exists
    const voucher = await prisma.pt_gsat_voucher.findUnique({ where });
    if (!voucher) {
      return { success: false, message: "Voucher not found" };
    }

    // Extract actual values from the update object
    let newRef: string | null = null;
    if (data.reference_number !== undefined) {
      // Trim the reference number
      newRef =
        typeof data.reference_number === "string"
          ? data.reference_number.trim()
          : data.reference_number?.set?.trim() || null;

      // Check for duplicates
      if (newRef) {
        const duplicateRef = await prisma.pt_gsat_voucher.findFirst({
          where: {
            reference_number: newRef,
            gsat_voucher_id: { not: id },
          },
        });
        if (duplicateRef) {
          return { success: false, message: "Reference number already exists" };
        }
      }

      // Update data with the trimmed value
      if (typeof data.reference_number === "string") {
        data.reference_number = newRef;
      } else if (data.reference_number?.set) {
        data.reference_number.set = newRef;
      }
    }

    let newSerial: string | null = null;
    if (data.serial_number !== undefined) {
      // Trim the serial number
      newSerial =
        typeof data.serial_number === "string"
          ? data.serial_number.trim()
          : data.serial_number?.set?.trim() || null;

      // Check for duplicates
      if (newSerial) {
        const duplicateSerial = await prisma.pt_gsat_voucher.findFirst({
          where: {
            serial_number: newSerial,
            gsat_voucher_id: { not: id },
          },
        });
        if (duplicateSerial) {
          return { success: false, message: "Serial number already exists" };
        }
      }

      // Update data with the trimmed value
      if (typeof data.serial_number === "string") {
        data.serial_number = newSerial;
      } else if (data.serial_number?.set) {
        data.serial_number.set = newSerial;
      }
    }

    // Perform the update with trimmed data
    await prisma.pt_gsat_voucher.update({
      where,
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    revalidatePath("/admin/vouchers/gsat");
    return { success: true, message: "Voucher updated successfully" };
  } catch (error: any) {
    console.error("Error updating voucher:", error);
    return {
      success: false,
      message: error.message || "Failed to update voucher",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function deleteGsatVoucher(id: number) {
  try {
    await prisma.pt_gsat_voucher.delete({
      where: { gsat_voucher_id: id },
    });
    revalidatePath("/admin/vouchers/gsat");
    return { success: true, message: "Voucher deleted successfully" };
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("Failed to delete product");
  }
}

export async function deleteBulkGsatVouchers(ids: number[]) {
  try {
    await prisma.$transaction([
      prisma.pt_gsat_voucher.deleteMany({
        where: { gsat_voucher_id: { in: ids } },
      }),
    ]);
    revalidatePath("/admin/vouchers/gsat"); // Revalidate the page cache
    return { success: true, message: "Vouchers deleted successfully" };
  } catch (error) {
    console.error("Error deleting vouchers:", error);
    throw new Error("Failed to delete vouchers");
  }
}

// Product types
interface Product {
  product_code: string;
  base_price: number | null;
  pt_product_role_prices: any[];
}

type ProductRolePrice = {
  product_code: string;
  role: string;
  discounted_price: number | null;
};

interface ProductsResponse {
  success: boolean;
  products?: Product[];
  message?: string;
}

// Get all products with their role prices
export async function getAllGSATProducts(): Promise<ProductsResponse> {
  try {
    const products = await prisma.pt_products.findMany({
      where: { product_type: "gsat" },
      orderBy: {
        base_price: "asc",
      }, // or 'desc' for descending order
      include: {
        pt_product_role_prices: true,
      },
    });

    return {
      success: true,
      products,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      message: "Failed to fetch products",
    };
  }
}

// Create a new product
export async function createGSATProduct(data: {
  product_code: string;
  base_price: number | null;
}) {
  try {
    // Validate product code
    if (!data.product_code) {
      return { success: false, message: "Product code is required" };
    }

    // Check if product already exists
    const existingProduct = await prisma.pt_products.findUnique({
      where: { product_code: data.product_code, product_type: "gsat" },
    });

    if (existingProduct) {
      return { success: false, message: "Product code already exists" };
    }

    // Create the product
    await prisma.pt_products.create({
      data: {
        product_code: data.product_code,
        base_price: data.base_price,
        product_type: "gsat",
      },
    });

    revalidatePath("/dashboard/wifi-voucher");
    return { success: true, message: "Product created successfully" };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

// Update an existing product
export async function updateGSATProduct(
  productCode: string,
  data: { base_price?: number | null }
) {
  try {
    // Check if product exists
    const existingProduct = await prisma.pt_products.findUnique({
      where: { product_code: productCode, product_type: "gsat" },
    });

    if (!existingProduct) {
      return { success: false, message: "Product not found" };
    }

    // Update the product
    await prisma.pt_products.update({
      where: { product_code: productCode, product_type: "gsat" },
      data,
    });

    revalidatePath("/dashboard/wifi-voucher");
    return { success: true, message: "Product updated successfully" };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

// Delete a product
export async function deleteGSATProduct(productCode: string) {
  try {
    // Check if product exists
    const existingProduct = await prisma.pt_products.findUnique({
      where: { product_code: productCode, product_type: "gsat" },
    });

    if (!existingProduct) {
      return { success: false, message: "Product not found" };
    }

    // Delete all role prices for this product first
    await prisma.pt_product_role_prices.deleteMany({
      where: { product_code: productCode, product_type: "gsat" },
    });

    // Delete the product
    await prisma.pt_products.delete({
      where: { product_code: productCode, product_type: "gsat" },
    });

    revalidatePath("/dashboard/wifi-voucher");
    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}

// Create a new product role price
export async function createGSATProductRolePrice(data: {
  product_code: string;
  role: string;
  discounted_price: number | null;
}) {
  try {
    // Validate required fields
    if (!data.product_code || !data.role) {
      return { success: false, message: "Product code and role are required" };
    }

    // Check if product exists
    const existingProduct = await prisma.pt_products.findUnique({
      where: { product_code: data.product_code, product_type: "gsat" },
    });

    if (!existingProduct) {
      return { success: false, message: "Product not found" };
    }

    // Check if role price already exists
    const existingRolePrice = await prisma.pt_product_role_prices.findUnique({
      where: {
        product_code_role: {
          product_code: data.product_code,
          role: data.role,
        },
        product_type: "gsat",
      },
    });

    if (existingRolePrice) {
      return {
        success: false,
        message: "Role price already exists for this product",
      };
    }

    // Create the role price
    await prisma.pt_product_role_prices.create({
      data: {
        product_code: data.product_code,
        role: data.role,
        discounted_price: data.discounted_price,
        product_type: "gsat",
      },
    });

    revalidatePath("/dashboard/wifi-voucher");
    return { success: true, message: "Role price created successfully" };
  } catch (error) {
    console.error("Error creating role price:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create role price",
    };
  }
}

// Update an existing product role price
export async function updateGSATProductRolePrice(
  productCode: string,
  role: string,
  data: { discounted_price?: number | null }
) {
  try {
    // Check if role price exists
    const existingRolePrice = await prisma.pt_product_role_prices.findUnique({
      where: {
        product_type: "gsat",
        product_code_role: {
          product_code: productCode,
          role: role,
        },
      },
    });

    if (!existingRolePrice) {
      return { success: false, message: "Role price not found" };
    }

    // Update the role price
    await prisma.pt_product_role_prices.update({
      where: {
        product_type: "gsat",
        product_code_role: {
          product_code: productCode,
          role: role,
        },
      },
      data,
    });

    revalidatePath("/dashboard/wifi-voucher");
    return { success: true, message: "Role price updated successfully" };
  } catch (error) {
    console.error("Error updating role price:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update role price",
    };
  }
}

// Delete a product role price
export async function deleteGSATProductRolePrice(
  productCode: string,
  role: string
) {
  try {
    // Check if role price exists
    const existingRolePrice = await prisma.pt_product_role_prices.findUnique({
      where: {
        product_type: "gsat",
        product_code_role: {
          product_code: productCode,
          role: role,
        },
      },
    });

    if (!existingRolePrice) {
      return { success: false, message: "Role price not found" };
    }

    // Delete the role price
    await prisma.pt_product_role_prices.delete({
      where: {
        product_type: "gsat",
        product_code_role: {
          product_code: productCode,
          role: role,
        },
      },
    });

    revalidatePath("/dashboard/wifi-voucher");
    return { success: true, message: "Role price deleted successfully" };
  } catch (error) {
    console.error("Error deleting role price:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete role price",
    };
  }
}

export type DuplicateCheckResult = {
  isDuplicate: boolean;
  field: string | null;
  value: string | null;
};

export async function checkDuplicate(
  serialNumber: string | null,
  referenceNumber: string | null
): Promise<DuplicateCheckResult> {
  if (!serialNumber && !referenceNumber) {
    return { isDuplicate: false, field: null, value: null };
  }

  try {
    // Check for duplicate serial number
    if (serialNumber) {
      const duplicateSerial = await prisma.pt_gsat_voucher.findFirst({
        where: { serial_number: serialNumber },
        select: { serial_number: true },
      });

      if (duplicateSerial) {
        return {
          isDuplicate: true,
          field: "serial_number",
          value: serialNumber,
        };
      }
    }

    // Check for duplicate reference number
    if (referenceNumber) {
      const duplicateRef = await prisma.pt_gsat_voucher.findFirst({
        where: { reference_number: referenceNumber },
        select: { reference_number: true },
      });

      if (duplicateRef) {
        return {
          isDuplicate: true,
          field: "reference_number",
          value: referenceNumber,
        };
      }
    }

    // No duplicates found
    return { isDuplicate: false, field: null, value: null };
  } catch (error) {
    console.error("Error checking for duplicates:", error);
    // Return false to allow the process to continue, but log the error
    return { isDuplicate: false, field: null, value: null };
  }
}

export async function bulkCheckDuplicates(
  vouchers: { serial_number: string; reference_number: string }[]
): Promise<{ duplicates: DuplicateCheckResult[]; validVouchers: any[] }> {
  if (!vouchers || vouchers.length === 0) {
    return { duplicates: [], validVouchers: [] };
  }

  const duplicates: DuplicateCheckResult[] = [];
  const validVouchers: any[] = [];
  const processedSerials = new Set<string>();
  const processedRefs = new Set<string>();

  // First check for duplicates within the uploaded batch
  for (const voucher of vouchers) {
    let internalDuplicate = false;

    // Check for duplicates within the current batch
    if (processedSerials.has(voucher.serial_number)) {
      duplicates.push({
        isDuplicate: true,
        field: "serial_number",
        value: voucher.serial_number,
      });
      internalDuplicate = true;
    } else {
      processedSerials.add(voucher.serial_number);
    }

    if (processedRefs.has(voucher.reference_number)) {
      duplicates.push({
        isDuplicate: true,
        field: "reference_number",
        value: voucher.reference_number,
      });
      internalDuplicate = true;
    } else {
      processedRefs.add(voucher.reference_number);
    }

    if (!internalDuplicate) {
      validVouchers.push(voucher);
    }
  }

  // Get all existing serial numbers and reference numbers in one query
  const existingSerials = new Set(
    (
      await prisma.pt_gsat_voucher.findMany({
        where: {
          serial_number: {
            in: [...processedSerials],
          },
        },
        select: {
          serial_number: true,
        },
      })
    ).map((v) => v.serial_number)
  );

  const existingRefs = new Set(
    (
      await prisma.pt_gsat_voucher.findMany({
        where: {
          reference_number: {
            in: [...processedRefs],
          },
        },
        select: {
          reference_number: true,
        },
      })
    ).map((v) => v.reference_number)
  );

  // Filter out vouchers with existing serial numbers or reference numbers
  const finalValidVouchers = validVouchers.filter((voucher) => {
    if (existingSerials.has(voucher.serial_number)) {
      duplicates.push({
        isDuplicate: true,
        field: "serial_number",
        value: voucher.serial_number,
      });
      return false;
    }
    if (existingRefs.has(voucher.reference_number)) {
      duplicates.push({
        isDuplicate: true,
        field: "reference_number",
        value: voucher.reference_number,
      });
      return false;
    }
    return true;
  });

  return { duplicates, validVouchers: finalValidVouchers };
}
