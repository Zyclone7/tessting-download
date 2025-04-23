"use server";
import { prisma } from "@/lib/prisma-singleton";
import { revalidatePath } from "next/cache";

// Define types based on your Prisma schema
type Product = {
  product_code: string;
  base_price: number | null;
  product_type: string | null;
  pt_product_role_prices: ProductRolePrice[];
};

type ProductRolePrice = {
  product_code: string;
  role: string;
  discounted_price: number | null;
  product_type: string | null;
};

interface ProductPricingResponse {
  success: boolean;
  message?: string;
  basePrice: number;
  discountedPrice: number;
  discountPercentage: number;
  userRole?: string;
}

interface ProductsResponse {
  success: boolean;
  products?: Product[];
  message?: string;
}

// Get TV product pricing for a specific user and product
export async function getTVProductPricing(
  userId: string | null | undefined,
  productCode: string | null | undefined
): Promise<ProductPricingResponse> {
  try {
    // Check if userId or productCode is null, undefined, or empty
    if (!userId || !productCode) {
      return {
        success: false,
        message: "Missing required parameters",
        basePrice: 0,
        discountedPrice: 0,
        discountPercentage: 0,
      };
    }

    // Parse userId to number, with validation
    const userIdNum = Number.parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return {
        success: false,
        message: "Invalid user ID format",
        basePrice: 0,
        discountedPrice: 0,
        discountPercentage: 0,
      };
    }

    // Get user information including role
    const user = await prisma.pt_users.findUnique({
      where: { ID: userIdNum },
      select: { user_role: true },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
        basePrice: 0,
        discountedPrice: 0,
        discountPercentage: 0,
      };
    }

    const userRole = user.user_role || "Basic_Merchant_Package"; // Default role if none is set

    // Get product base price and role-based discounted price
    const productInfo = await prisma.pt_products.findUnique({
      where: { product_code: productCode },
      include: {
        pt_product_role_prices: {
          where: { role: userRole, product_type: "tv" },
        },
      },
    });

    if (!productInfo) {
      return {
        success: false,
        message: "Product not found",
        basePrice: 0,
        discountedPrice: 0,
        discountPercentage: 0,
      };
    }

    const basePrice = productInfo.base_price || 0;

    // Determine the discounted price
    let discountedPrice: number;

    if (
      productInfo.pt_product_role_prices.length > 0 &&
      productInfo.pt_product_role_prices[0].discounted_price !== null
    ) {
      // Use role-based discounted price
      discountedPrice = productInfo.pt_product_role_prices[0].discounted_price!;
    } else {
      // Use base price if no role-specific price is found
      discountedPrice = basePrice;
    }

    // Calculate discount percentage
    const discountPercentage =
      basePrice > 0 ? ((basePrice - discountedPrice) / basePrice) * 100 : 0;

    return {
      success: true,
      basePrice,
      discountedPrice,
      discountPercentage,
      userRole,
    };
  } catch (error) {
    console.error("Error fetching product pricing:", error);
    return {
      success: false,
      message: "Server error",
      basePrice: 0,
      discountedPrice: 0,
      discountPercentage: 0,
    };
  }
}

// Get all TV products with their role prices
export async function getAllTVProducts(): Promise<ProductsResponse> {
  try {
    const products = await prisma.pt_products.findMany({
      where: { product_type: "tv" },
      orderBy: { base_price: "asc" },
      include: {
        pt_product_role_prices: {
          where: { product_type: "tv" },
        },
        pt_product_inclusion: true,
      },
    });

    return {
      success: true,
      products,
    };
  } catch (error) {
    console.error("Error fetching TV products:", error);
    return {
      success: false,
      message: "Failed to fetch TV products",
    };
  }
}

// Create a new TV product
export async function createTVProduct(data: {
  product_code: string;
  base_price: number | null;
}): Promise<{ success: boolean; message: string }> {
  try {
    // Validate product code
    if (!data.product_code) {
      return { success: false, message: "Product code is required" };
    }

    // Check if product already exists
    const existingProduct = await prisma.pt_products.findUnique({
      where: { product_code: data.product_code },
    });

    if (existingProduct) {
      return { success: false, message: "Product code already exists" };
    }

    // Create the product with product_type always set to "tv"
    await prisma.pt_products.create({
      data: {
        product_code: data.product_code,
        base_price: data.base_price,
        product_type: "tv", // Always set to "tv"
      },
    });

    revalidatePath("/admin/products/tv");
    return { success: true, message: "TV product created successfully" };
  } catch (error) {
    console.error("Error creating TV product:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create TV product",
    };
  }
}

// Update an existing TV product
export async function updateTVProduct(
  productCode: string,
  data: { base_price?: number | null }
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if product exists
    const existingProduct = await prisma.pt_products.findUnique({
      where: { product_code: productCode },
    });

    if (!existingProduct) {
      return { success: false, message: "Product not found" };
    }

    // Update the product, ensuring product_type remains "tv"
    await prisma.pt_products.update({
      where: { product_code: productCode },
      data: {
        ...data,
        product_type: "tv", // Always ensure product_type is "tv"
      },
    });

    revalidatePath("/admin/products/tv");
    return { success: true, message: "TV product updated successfully" };
  } catch (error) {
    console.error("Error updating TV product:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update TV product",
    };
  }
}

// Delete a TV product
export async function deleteTVProduct(
  productCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if product exists
    const existingProduct = await prisma.pt_products.findUnique({
      where: { product_code: productCode },
    });

    if (!existingProduct) {
      return { success: false, message: "Product not found" };
    }

    // Delete all role prices for this product first
    await prisma.pt_product_role_prices.deleteMany({
      where: { product_code: productCode, product_type: "tv" },
    });

    // Delete the product
    await prisma.pt_products.delete({
      where: { product_code: productCode },
    });

    revalidatePath("/admin/products/tv");
    return { success: true, message: "TV product deleted successfully" };
  } catch (error) {
    console.error("Error deleting TV product:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete TV product",
    };
  }
}

// Create a new TV product role price
export async function createTVProductRolePrice(data: {
  product_code: string;
  role: string;
  discounted_price: number | null;
}): Promise<{ success: boolean; message: string }> {
  try {
    // Validate required fields
    if (!data.product_code || !data.role) {
      return { success: false, message: "Product code and role are required" };
    }

    // Check if product exists
    const existingProduct = await prisma.pt_products.findUnique({
      where: { product_code: data.product_code },
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
      },
    });

    if (existingRolePrice) {
      // Update the existing role price instead of creating a new one
      await prisma.pt_product_role_prices.update({
        where: {
          product_code_role: {
            product_code: data.product_code,
            role: data.role,
          },
        },
        data: {
          discounted_price: data.discounted_price,
          product_type: "tv", // Always set to "tv"
        },
      });

      revalidatePath("/admin/products/tv");
      return { success: true, message: "TV role price updated successfully" };
    }

    // Create the role price with product_type always set to "tv"
    await prisma.pt_product_role_prices.create({
      data: {
        product_code: data.product_code,
        role: data.role,
        discounted_price: data.discounted_price,
        product_type: "tv", // Always set to "tv"
      },
    });

    revalidatePath("/admin/products/tv");
    return { success: true, message: "TV role price created successfully" };
  } catch (error) {
    console.error("Error creating TV role price:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create TV role price",
    };
  }
}

// Update an existing TV product role price
export async function updateTVProductRolePrice(
  productCode: string,
  role: string,
  data: { discounted_price?: number | null }
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if role price exists
    const existingRolePrice = await prisma.pt_product_role_prices.findUnique({
      where: {
        product_code_role: {
          product_code: productCode,
          role: role,
        },
      },
    });

    if (!existingRolePrice) {
      return { success: false, message: "Role price not found" };
    }

    // Update the role price, ensuring product_type remains "tv"
    await prisma.pt_product_role_prices.update({
      where: {
        product_code_role: {
          product_code: productCode,
          role: role,
        },
      },
      data: {
        ...data,
        product_type: "tv", // Always ensure product_type is "tv"
      },
    });

    revalidatePath("/admin/products/tv");
    return { success: true, message: "TV role price updated successfully" };
  } catch (error) {
    console.error("Error updating TV role price:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update TV role price",
    };
  }
}

// Delete a TV product role price
export async function deleteTVProductRolePrice(
  productCode: string,
  role: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if role price exists
    const existingRolePrice = await prisma.pt_product_role_prices.findUnique({
      where: {
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
        product_code_role: {
          product_code: productCode,
          role: role,
        },
      },
    });

    revalidatePath("/admin/products/tv");
    return { success: true, message: "TV role price deleted successfully" };
  } catch (error) {
    console.error("Error deleting TV role price:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete TV role price",
    };
  }
}

// Apply batch pricing to all TV products for a specific role
export async function applyBatchTVPricing(
  role: string,
  discountType: "percentage" | "fixed",
  discountValue: number
): Promise<{ success: boolean; message: string; updatedCount?: number }> {
  try {
    if (!role || discountValue < 0) {
      return { success: false, message: "Invalid parameters" };
    }

    // Get all TV products
    const products = await prisma.pt_products.findMany({
      where: { product_type: "tv" },
    });

    if (products.length === 0) {
      return { success: false, message: "No TV products found" };
    }

    let updatedCount = 0;

    // Update or create role prices for each product
    for (const product of products) {
      const basePrice = product.base_price || 0;
      let discountedPrice = basePrice;

      // Calculate the discounted price based on the discount type
      if (discountType === "percentage") {
        // Apply percentage discount
        const discountPercentage = discountValue / 100;
        discountedPrice = basePrice * (1 - discountPercentage);
      } else {
        // Apply fixed amount discount
        discountedPrice = Math.max(0, basePrice - discountValue);
      }

      // Round to 2 decimal places
      discountedPrice = Math.round(discountedPrice * 100) / 100;

      // Check if role price exists
      const existingRolePrice = await prisma.pt_product_role_prices.findUnique({
        where: {
          product_code_role: {
            product_code: product.product_code,
            role: role,
          },
        },
      });

      if (existingRolePrice) {
        // Update existing role price
        await prisma.pt_product_role_prices.update({
          where: {
            product_code_role: {
              product_code: product.product_code,
              role: role,
            },
          },
          data: {
            discounted_price: discountedPrice,
            product_type: "tv", // Always ensure product_type is "tv"
          },
        });
      } else {
        // Create new role price
        await prisma.pt_product_role_prices.create({
          data: {
            product_code: product.product_code,
            role: role,
            discounted_price: discountedPrice,
            product_type: "tv", // Always set to "tv"
          },
        });
      }

      updatedCount++;
    }

    revalidatePath("/admin/products/tv");
    return {
      success: true,
      message: `Successfully applied ${
        discountType === "percentage"
          ? discountValue + "%"
          : "₱" + discountValue
      } discount to ${updatedCount} TV products for the selected role`,
      updatedCount,
    };
  } catch (error) {
    console.error("Error applying batch TV pricing:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to apply batch TV pricing",
    };
  }
}

export async function getProductInclusions(
  product_code: string
): Promise<{ success: boolean; inclusions?: any[]; message?: string }> {
  try {
    const inclusions = await prisma.pt_product_inclusion.findMany({
      where: {
        product_code,
        product_type: "tv",
      },
      orderBy: { created_at: "desc" },
    });
    return { success: true, inclusions };
  } catch (error) {
    console.error("Error fetching product inclusions:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch product inclusions",
    };
  }
}

export async function createProductInclusion(data: {
  product_code: string;
  inclusion: string;
}): Promise<{ success: boolean; message?: string; inclusion?: any }> {
  try {
    const inclusion = await prisma.pt_product_inclusion.create({
      data: {
        product_code: data.product_code,
        inclusion: data.inclusion,
        product_type: "tv", // Always set to "tv"
      },
    });
    revalidatePath("/admin/products/tv");
    return { success: true, inclusion };
  } catch (error) {
    console.error("Error creating product inclusion:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create product inclusion",
    };
  }
}

export async function updateProductInclusion(
  id: number,
  data: { inclusion: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.pt_product_inclusion.update({
      where: { id },
      data: {
        inclusion: data.inclusion,
        updated_at: new Date(),
      },
    });
    revalidatePath("/admin/products/tv");
    return { success: true };
  } catch (error) {
    console.error("Error updating product inclusion:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update product inclusion",
    };
  }
}

export async function deleteProductInclusion(
  id: number
): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.pt_product_inclusion.delete({
      where: { id },
    });
    revalidatePath("/admin/products/tv");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product inclusion:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete product inclusion",
    };
  }
}
