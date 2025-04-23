"use server";

import { prisma } from "@/lib/prisma-singleton";

interface ProductPricingResponse {
  success: boolean;
  basePrice?: number;
  discountedPrice?: number;
  discountPercentage?: number;
  userRole?: string;
  message?: string;
}

export async function getGSATProductPricing(
  userId: string,
  productCode: string
): Promise<ProductPricingResponse> {
  try {
    if (!userId || !productCode) {
      return {
        success: false,
        message: "Missing required parameters",
      };
    }

    // Get user information including role
    const user = await prisma.pt_users.findUnique({
      where: { ID: Number.parseInt(userId, 10) },
      select: { user_role: true },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const userRole = user.user_role || "Basic Merchant"; // Default role if none is set

    // Get product base price and role-based discounted price
    const productInfo = await prisma.pt_products.findUnique({
      where: { product_code: productCode },
      include: {
        pt_product_role_prices: {
          where: { role: userRole, product_type: "gsat" },
        },
      },
    });

    if (!productInfo) {
      return {
        success: false,
        message: "Product not found",
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
      discountedPrice =
        productInfo.pt_product_role_prices[0].discounted_price!;
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
    };
  }
}
