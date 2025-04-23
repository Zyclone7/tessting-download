"use server";

import { prisma } from "@/lib/prisma-singleton";

// Define response type interfaces
interface VoucherStockResponse {
  success: boolean;
  count: number;
  isLowStock: boolean;
  error?: string;
}

interface AllVoucherStocksResponse {
  success: boolean;
  data?: {
    gsat: GsatVoucherStock[];
    wifi: WifiVoucherStock[];
    tv: TvVoucherStock[];
  };
  error?: string;
}

interface GsatVoucherStock {
  product_code: string;
  count: number;
  isLowStock: boolean;
}

interface WifiVoucherStock {
  duration: string;
  count: number;
  isLowStock: boolean;
}

interface TvVoucherStock {
  package: string;
  count: number;
  isLowStock: boolean;
}

// Function to get GSAT voucher stock count
export async function getGsatVoucherStock(
  productCode: string
): Promise<VoucherStockResponse> {
  try {
    const count = await prisma.pt_gsat_voucher.count({
      where: {
        product_code: productCode,
        owned_by: null,
        status: { not: "used" },
      },
    });

    return {
      success: true,
      count,
      isLowStock: count < 5,
    };
  } catch (error) {
    console.error("Error counting GSAT vouchers:", error);
    return {
      success: false,
      count: 0,
      isLowStock: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to get WiFi voucher stock count
export async function getWifiVoucherStock(
  duration: string
): Promise<VoucherStockResponse> {
  try {
    const count = await prisma.pt_wifi_voucher.count({
      where: {
        duration,
        owned_by: null,
        status: "null",
      },
    });

    return {
      success: true,
      count,
      isLowStock: count < 5,
    };
  } catch (error) {
    console.error("Error counting WiFi vouchers:", error);
    return {
      success: false,
      count: 0,
      isLowStock: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to get TV voucher stock count
export async function getTvVoucherStock(
  packageName: string
): Promise<VoucherStockResponse> {
  try {
    const count = await prisma.pt_tv_voucher.count({
      where: {
        product_name: packageName,
        owned_by: null,
        status: { not: "used" },
      },
    });

    return {
      success: true,
      count,
      isLowStock: count < 5,
    };
  } catch (error) {
    console.error("Error counting TV vouchers:", error);
    return {
      success: false,
      count: 0,
      isLowStock: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to get all voucher stocks for dashboard display
export async function getAllVoucherStocks(): Promise<AllVoucherStocksResponse> {
  try {
    // GSAT voucher counts by product code
    const gsatProductCodes = ["G99", "G200", "G300", "G500"];
    const gsatCounts: GsatVoucherStock[] = await Promise.all(
      gsatProductCodes.map(async (code) => {
        const count = await prisma.pt_gsat_voucher.count({
          where: {
            product_code: code,
            owned_by: null,
            status: { not: "used" },
          },
        });

        return {
          product_code: code,
          count,
          isLowStock: count < 5,
        };
      })
    );

    // WiFi voucher counts by duration
    const wifiDurations = ["2 Hour", "5 Hour", "24 Hour", "5 Days", "1 month"];
    const wifiCounts: WifiVoucherStock[] = await Promise.all(
      wifiDurations.map(async (duration) => {
        const count = await prisma.pt_wifi_voucher.count({
          where: {
            duration,
            owned_by: null,
            status: "null",
          },
        });

        return {
          duration,
          count,
          isLowStock: count < 5,
        };
      })
    );

    // TV voucher counts by package
    const tvPackages = ["MOBILE PLAN", "BASIC PACKAGE", "STANDARD PACKAGE"];
    const tvCounts: TvVoucherStock[] = await Promise.all(
      tvPackages.map(async (packageName) => {
        const count = await prisma.pt_tv_voucher.count({
          where: {
            product_name: packageName,
            owned_by: null,
            status: { not: "used" },
          },
        });

        return {
          package: packageName,
          count,
          isLowStock: count < 5,
        };
      })
    );

    return {
      success: true,
      data: {
        gsat: gsatCounts,
        wifi: wifiCounts,
        tv: tvCounts,
      },
    };
  } catch (error) {
    console.error("Error fetching all voucher stocks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
