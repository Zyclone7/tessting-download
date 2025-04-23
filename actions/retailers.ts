"use server";

import { sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma-singleton";
import bcrypt from "bcryptjs";
import { AnyARecord } from "dns";

export async function getRetailers(
  page = 1,
  limit = 10,
  search = "",
  sortBy = "user_registered",
  sortOrder = "desc",
  statusFilter = ""
) {
  try {
    const skip = (page - 1) * limit;

    const whereClause = {
      user_role: "retailer",
      // Filter by upline_id (the current merchant/distributor)
      user_upline_id: 1, // Replace with actual merchant ID from session
      ...(search
        ? {
            OR: [
              { user_login: { contains: search } },
              { user_email: { contains: search } },
              { display_name: { contains: search } },
              { business_name: { contains: search } },
            ],
          }
        : {}),
      ...(statusFilter ? { user_status: Number.parseInt(statusFilter) } : {}),
    };

    const retailers = await prisma.pt_users.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    const totalRetailers = await prisma.pt_users.count({
      where: whereClause,
    });

    return {
      retailers,
      totalPages: Math.ceil(totalRetailers / limit),
      totalRetailers,
    };
  } catch (error) {
    console.error("Failed to fetch retailers:", error);
    throw new Error("Failed to fetch retailers");
  }
}

export async function getRetailersById(
  page = 1,
  limit = 10,
  search = "",
  sortBy = "user_registered",
  sortOrder = "desc",
  statusFilter = "",
  userId: number
) {
  try {
    const skip = (page - 1) * limit;

    const whereClause = {
      user_role: "retailer",
      // Filter by upline_id (the current merchant/distributor)
      user_upline_id: userId, // Replace with actual merchant ID from session
      ...(search
        ? {
            OR: [
              { user_login: { contains: search } },
              { user_email: { contains: search } },
              { display_name: { contains: search } },
              { business_name: { contains: search } },
            ],
          }
        : {}),
      ...(statusFilter ? { user_status: Number.parseInt(statusFilter) } : {}),
    };

    const retailers = await prisma.pt_users.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    const totalRetailers = await prisma.pt_users.count({
      where: whereClause,
    });

    return {
      retailers,
      totalPages: Math.ceil(totalRetailers / limit),
      totalRetailers,
    };
  } catch (error) {
    console.error("Failed to fetch retailers:", error);
    throw new Error("Failed to fetch retailers");
  }
}

// Get merchant package information
export async function getMerchantPackage(merchantId: any) {
  try {
    // Get the merchant's user_role which should match the package name
    const merchant = await prisma.pt_users.findUnique({
      where: { ID: Number(merchantId) },
      select: { user_role: true },
    });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    // Get the package details based on the merchant's role
    const packageInfo: any = await prisma.pt_package_products.findFirst({
      where: { name: merchant.user_role },
    });

    if (!packageInfo) {
      // Fallback to a default package if not found
      return {
        packageInfo: {
          id: 0,
          name: "Default Package",
          retailer_count: 10, // Default limit
          price: 0,
          status: 1,
        },
      };
    }

    // Convert Decimal fields to plain numbers
    return {
      packageInfo: {
        ...packageInfo,
        price: packageInfo.price.toNumber(),
      },
    };
  } catch (error) {
    console.error("Failed to fetch merchant package:", error);
    throw new Error("Failed to fetch merchant package");
  }
}

// Get current retailer count for a merchant
export async function getRetailerCount(merchantId: any) {
  try {
    const count = await prisma.pt_users.count({
      where: {
        user_role: "retailer",
        user_upline_id: Number(merchantId),
      },
    });

    return { count };
  } catch (error) {
    console.error("Failed to fetch retailer count:", error);
    throw new Error("Failed to fetch retailer count");
  }
}

export async function createRetailer(formData: any) {
  try {
    // Check if the email already exists
    const existingUser = await prisma.pt_users.findUnique({
      where: { user_email: formData.email },
    });

    if (existingUser) {
      return {
        success: false,
        message: "This email is already in use by another user.",
      };
    }

    // Check if the merchant has reached their retailer limit
    const merchant = await prisma.pt_users.findUnique({
      where: { ID: Number(formData.uplineId) },
      select: { user_role: true },
    });

    if (!merchant) {
      return {
        success: false,
        message: "Merchant not found",
      };
    }

    // Get the package details
    const packageInfo: any = await prisma.pt_package_products.findFirst({
      where: { name: merchant.user_role },
    });

    // Get current retailer count
    const currentRetailerCount = await prisma.pt_users.count({
      where: {
        user_role: "retailer",
        user_upline_id: Number(formData.uplineId),
      },
    });

    // Check if limit is reached
    if (packageInfo && currentRetailerCount >= packageInfo.retailer_count) {
      return {
        success: false,
        message: `You can only create a maximum of ${packageInfo.retailer_count} retailers with your current package.`,
      };
    }

    const savedPassword = formData.password; // Save the password for email sending

    // Generate a secure password hash
    const hashedPassword = await bcrypt.hash(formData.password, 10);

    const newRetailer = await prisma.pt_users.create({
      data: {
        user_login: formData.email.split("@")[0] || "", // Generate username from email
        user_pass: hashedPassword,
        user_email: formData.email,
        user_contact_number: formData.contactNumber,
        display_name: `${formData.firstName} ${formData.lastName}`,
        user_nicename:
          `${formData.firstName} ${formData.lastName}`.toUpperCase(), // Convert to all caps
        business_name: formData.businessName,
        business_address: formData.businessAddress,
        user_role: "retailer", // Always set as retailer
        user_upline_id: Number(formData.uplineId),
        user_registered: new Date(),
        user_status: 1,
        user_credits: 0,
        user_level: null,
      },
    });

    await sendWelcomeEmail(formData.email, newRetailer, savedPassword);

    return { success: true, retailer: newRetailer };
  } catch (error: any) {
    console.error("Failed to create retailer:", error);
    return {
      success: false,
      message: error.message || "Failed to create retailer",
    };
  }
}

export async function updateRetailer(id: any, formData: any) {
  try {
    const updatedRetailer = await prisma.pt_users.update({
      where: { ID: Number(id) },
      data: {
        user_email: formData.email,
        user_contact_number: formData.contactNumber,
        display_name: `${formData.firstName} ${formData.lastName}`,
        user_nicename: formData.firstName + " " + formData.lastName,
        business_name: formData.businessName,
        business_address: formData.businessAddress,
        user_status: Number(formData.status),
      },
    });

    return { success: true, retailer: updatedRetailer };
  } catch (error) {
    console.error("Failed to update retailer:", error);
    throw new Error("Failed to update retailer");
  }
}

export async function deleteRetailer(id: any) {
  try {
    await prisma.pt_users.delete({
      where: { ID: Number(id) },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete retailer:", error);
    throw new Error("Failed to delete retailer");
  }
}

// Updated transferCredits function to decrease sender's credits
export async function transferCredits(
  id: any,
  amount: any,
  reason = "",
  senderId: any
) {
  try {
    const retailer = await prisma.pt_users.findUnique({
      where: { ID: Number(id) },
    });

    if (!retailer) {
      throw new Error("Retailer not found");
    }

    const sender = await prisma.pt_users.findUnique({
      where: { ID: Number(senderId) },
    });

    if (!sender) {
      throw new Error("Sender not found");
    }

    const senderCredits = sender.user_credits || 0;
    const transferAmount = Number.parseFloat(amount);

    if (senderCredits < transferAmount) {
      throw new Error("Insufficient credits to transfer");
    }

    const currentCredits = retailer.user_credits || 0;
    const newRetailerCredits = currentCredits + transferAmount;
    const newSenderCredits = senderCredits - transferAmount;

    // Update retailer's credits
    const updatedRetailer = await prisma.pt_users.update({
      where: { ID: Number(id) },
      data: {
        user_credits: newRetailerCredits,
      },
    });

    // Update sender's credits
    await prisma.pt_users.update({
      where: { ID: Number(senderId) },
      data: {
        user_credits: newSenderCredits,
      },
    });

    // Create a transaction record (if you have a transactions table)
    // This is just a placeholder - you would need to adjust based on your schema
    /*
    await prisma.pt_transactions.create({
      data: {
        user_id: parseInt(id),
        amount: parseFloat(amount),
        transaction_type: "CREDIT_TRANSFER",
        reason: reason,
        created_by: parseInt(senderId),
        created_at: new Date()
      }
    });
    */

    return { success: true, retailer: updatedRetailer };
  } catch (error: any) {
    console.error("Failed to transfer credits:", error);
    throw new Error(error.message || "Failed to transfer credits");
  }
}

// Keep the old function name for backward compatibility
export async function addCredits(
  id: any,
  amount: any,
  reason = "",
  senderId: any
) {
  return transferCredits(id, amount, reason, senderId);
}

// Get analytics data
export async function getRetailerAnalytics(
  period = "thisMonth",
  merchantId: any
) {
  try {
    // Get date range based on period
    const startDate = new Date();
    const endDate = new Date();

    switch (period) {
      case "thisWeek":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "thisMonth":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "lastMonth":
        startDate.setMonth(startDate.getMonth() - 2);
        endDate.setMonth(endDate.getMonth() - 1);
        break;
      case "thisYear":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get total retailers
    const totalRetailers = await prisma.pt_users.count({
      where: {
        user_role: "retailer",
        user_upline_id: Number(merchantId),
      },
    });

    // Get active retailers
    const activeRetailers = await prisma.pt_users.count({
      where: {
        user_role: "retailer",
        user_upline_id: Number(merchantId),
        user_status: 1,
      },
    });

    // Get inactive retailers
    const inactiveRetailers = await prisma.pt_users.count({
      where: {
        user_role: "retailer",
        user_upline_id: Number(merchantId),
        user_status: 0,
      },
    });

    // Get total credits
    const creditsResult = await prisma.pt_users.aggregate({
      where: {
        user_role: "retailer",
        user_upline_id: Number(merchantId),
      },
      _sum: {
        user_credits: true,
      },
    });

    const totalCredits = creditsResult._sum.user_credits || 0;

    // Get credit distribution
    const highCredits = await prisma.pt_users.count({
      where: {
        user_role: "retailer",
        user_upline_id: Number(merchantId),
        user_credits: {
          gt: 100,
        },
      },
    });

    const mediumCredits = await prisma.pt_users.count({
      where: {
        user_role: "retailer",
        user_upline_id: Number(merchantId),
        user_credits: {
          gte: 50,
          lte: 100,
        },
      },
    });

    const lowCredits = await prisma.pt_users.count({
      where: {
        user_role: "retailer",
        user_upline_id: Number(merchantId),
        user_credits: {
          lt: 50,
        },
      },
    });

    // Get recent retailers
    const recentRetailers = await prisma.pt_users.findMany({
      where: {
        user_role: "retailer",
        user_upline_id: Number(merchantId),
        user_registered: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        user_registered: "desc",
      },
      take: 5,
    });

    // Get monthly growth data
    // This would typically involve more complex queries to group by month
    // Simplified version for demonstration
    const monthlyGrowth = [
      { month: "Jan", retailers: 5 },
      { month: "Feb", retailers: 8 },
      { month: "Mar", retailers: 12 },
      { month: "Apr", retailers: 15 },
      { month: "May", retailers: 20 },
      { month: "Jun", retailers: 22 },
    ];

    return {
      totalRetailers,
      activeRetailers,
      inactiveRetailers,
      totalCredits,
      averageCredits: totalRetailers > 0 ? totalCredits / totalRetailers : 0,
      creditDistribution: {
        high: highCredits,
        medium: mediumCredits,
        low: lowCredits,
      },
      recentRetailers,
      monthlyGrowth,
    };
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    throw new Error("Failed to fetch analytics");
  }
}
