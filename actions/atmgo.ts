"use server";

import { prisma } from "@/lib/prisma-singleton";

// Enum types based on Prisma schema
type HasBusinessPermit = 'YES' | 'NO';
type HasExtraCapital = 'YES' | 'NO';
type AgreeWithTransactionTarget = 'YES' | 'NO';
type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected' | 'DONE';

interface ATMGOApplication {
  id?: number;
  uid: number | null;
  complete_name: string;
  business_name: string;
  complete_address: string;
  email: string;
  cellphone: string;
  existing_business: string;
  business_industry: string;
  business_operational_years: string;
  branch_count: number;
  fare_to_nearest_bank: number;
  has_extra_capital: HasExtraCapital;
  agree_with_transaction_target: AgreeWithTransactionTarget;
  has_business_permit: HasBusinessPermit;
  business_permit_details: string | null;
  dti_details: string | null;
  sec_details: string | null;
  cda_details: string | null;
  bank_name: string;
  bank_account_details: string;
  atm_serial_number: string | null; // Added ATM serial number field
  status: ApplicationStatus;
  submitted_at: Date;
  notes?: string | null;
  processed_by?: number | null;
  processed_at?: Date | null;
  updated_at?: Date | null;
}

interface ApplicationsFilter {
  status?: ApplicationStatus;
  page?: number;
  limit?: number;
  userId?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApplicationResponse {
  success: boolean;
  data?: ATMGOApplication | ATMGOApplication[];
  pagination?: PaginationInfo;
  message?: string;
  error?: string;
  details?: any;
  application?: ATMGOApplication;
}

interface ApplicationStatsResponse {
  success: boolean;
  data?: {
    totalApplications: number;
    pendingApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    todayApplications: number;
    lastWeekApplications: number;
    approvalRate: string | number;
    DONEApplications: number;
  };
  message?: string;
  error?: string;
}

/**
 * Create a new ATM GO application
 * @param {FormData} formData - The form data from the application
 * @returns {Promise<ApplicationResponse>} - Result of the operation
 */
export async function createATMGOApplication(formData: FormData): Promise<ApplicationResponse> {
  console.log("Starting createATMGOApplication function");
  
  // Validate input
  if (!formData) {
    console.log("FormData is null or undefined");
    return {
      success: false,
      error: "FormData is null or undefined",
    };
  }

  try {
    // Convert formData to an object
    const applicationData = Object.fromEntries(formData.entries());
    console.log("Received application data:", JSON.stringify(applicationData, null, 2));

    // Check if user ID exists
    const userId = applicationData.uid;
    if (userId) {
      // Check if user already has a pending application
      const existingApplication = await prisma.pt_atm_go_form.findFirst({
        where: {
          uid: Number(userId),
          status: "Pending"
        }
      });

      if (existingApplication) {
        return {
          success: false,
          error: "You already have a pending ATM GO application. Please wait for it to be processed.",
          details: {
            applicationId: existingApplication.id,
            submittedAt: existingApplication.submitted_at
          }
        };
      }
    }

    // Helper to safely convert to a number
    const toNumber = (value: any, fallback: number | null = 0): number | null => {
      const num = Number(value);
      return isNaN(num) ? fallback : num;
    };

    // Rest of your existing code...
    const fareAmount = Math.round(toNumber(applicationData.fareToNearestBank, 0) as number * 100);

    // Type-safe casting for enum values
    const hasExtraCapital = (applicationData.hasExtraCapital || "NO") as HasExtraCapital;
    const agreeWithTransactionTarget = (applicationData.agreeWithTransactionTarget || "NO") as AgreeWithTransactionTarget;
    const hasBusinessPermit = (applicationData.hasBusinessPermit || "NO") as HasBusinessPermit;

    // Construct the data object for database insertion
    const dbData = {
      uid: applicationData.uid ? toNumber(applicationData.uid, null) : null,
      complete_name: String(applicationData.completeName || ""),
      business_name: String(applicationData.businessName || ""),
      complete_address: String(applicationData.completeAddress || ""),
      email: String(applicationData.email || ""),
      cellphone: String(applicationData.cellphone || ""),
      
      // Business Questions
      existing_business: String(applicationData.existingBusiness || ""),
      business_industry: String(applicationData.businessIndustry || ""),
      business_operational_years: String(applicationData.businessOperationalYears || ""),
      branch_count: toNumber(applicationData.branchCount, 0) as number,
      fare_to_nearest_bank: fareAmount,
      has_extra_capital: hasExtraCapital,
      agree_with_transaction_target: agreeWithTransactionTarget,
      
      // Business Permits
      has_business_permit: hasBusinessPermit,
      business_permit_details: hasBusinessPermit === "YES" ? 
        String(applicationData.businessPermitDetails || "") || null : null,
      dti_details: hasBusinessPermit === "YES" ? 
        String(applicationData.dtiDetails || "") || null : null,
      sec_details: hasBusinessPermit === "YES" ? 
        String(applicationData.secDetails || "") || null : null,
      cda_details: hasBusinessPermit === "YES" ? 
        String(applicationData.cdaDetails || "") || null : null,
      
      // Banking Information
      bank_name: String(applicationData.bankName || ""),
      bank_account_details: String(applicationData.bankAccountDetails || ""),
      
      // ATM Serial Number (initially null)
      atm_serial_number: null,
      
      // Default values set by database schema (will use Prisma defaults)
      status: "Pending" as ApplicationStatus,
      submitted_at: new Date()
    };

    console.log("Prepared data for database:", JSON.stringify(dbData, null, 2));

    // Insert the application into the database
    const newApplication = await prisma.pt_atm_go_form.create({
      data: dbData
    });

    console.log("New ATM GO application created successfully:", JSON.stringify(newApplication, null, 2));

    return {
      success: true,
      application: newApplication,
    };
  } catch (error: unknown) {
    // Error handling code remains the same
    console.error("Error creating ATM GO application:", error);

    let errorMessage = "Unknown error occurred";
    let errorDetails: Record<string, any> = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack,
      };
    } else if (error && typeof error === "object") {
      errorMessage = "An object was thrown as an error";
      errorDetails = error as Record<string, any>;
    }

    console.log(
      "Error details:",
      JSON.stringify({ message: errorMessage, details: errorDetails }, null, 2)
    );

    return {
      success: false,
      error: errorMessage,
      details: errorDetails,
    };
  }
}

/**
 * Get all ATM GO applications
 * @param {ApplicationsFilter} options - Filter and pagination options
 * @returns {Promise<ApplicationResponse>} - Result of the operation
 */
export async function getAllATMGOApplications(options: ApplicationsFilter = {}): Promise<ApplicationResponse> {
  try {
    const { status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    
    // Build where condition
    const whereCondition: {
      status?: ApplicationStatus;
    } = {};
    
    if (status) {
      whereCondition.status = status;
    }

    // Get count and data in parallel
    const [total, applications] = await Promise.all([
      prisma.pt_atm_go_form.count({ where: whereCondition }),
      prisma.pt_atm_go_form.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          submitted_at: 'desc',
        },
      })
    ]);

    // Format the applications to include currency display format
    const formattedApplications = applications.map(app => ({
      ...app,
      // Add formatted fare for display
      fareToNearestBankFormatted: (app.fare_to_nearest_bank / 100).toFixed(2)
    }));

    return {
      success: true,
      data: formattedApplications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  } catch (error: unknown) {
    console.error("Error fetching ATM GO applications:", error);
    return {
      success: false,
      message: "Failed to fetch ATM GO applications.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get an ATM GO application by ID
 * @param {number} id - The application ID
 * @returns {Promise<ApplicationResponse>} - Result of the operation
 */
export async function getATMGOApplicationById(id: number | string): Promise<ApplicationResponse> {
  try {
    if (!id || isNaN(Number(id))) {
      return {
        success: false,
        message: "Invalid application ID.",
      };
    }

    const application = await prisma.pt_atm_go_form.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!application) {
      return {
        success: false,
        message: "Application not found.",
      };
    }

    // Format the fare for display
    const formattedApplication = {
      ...application,
      fareToNearestBankFormatted: (application.fare_to_nearest_bank / 100).toFixed(2)
    };

    return {
      success: true,
      data: formattedApplication,
    };
  } catch (error: unknown) {
    console.error("Error fetching ATM GO application:", error);
    return {
      success: false,
      message: "Failed to fetch ATM GO application.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get ATM GO applications by user ID
 * @param {number} userId - The user ID
 * @returns {Promise<ApplicationResponse>} - Result of the operation
 */
export async function getATMGOApplicationsByUserId(userId: number | string): Promise<ApplicationResponse> {
  try {
    if (!userId || isNaN(Number(userId))) {
      return {
        success: false,
        message: "Invalid user ID.",
      };
    }

    const applications = await prisma.pt_atm_go_form.findMany({
      where: {
        uid: Number(userId),
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });

    // Format applications for display
    const formattedApplications = applications.map(app => ({
      ...app,
      fareToNearestBankFormatted: (app.fare_to_nearest_bank / 100).toFixed(2)
    }));

    return {
      success: true,
      data: formattedApplications,
    };
  } catch (error: unknown) {
    console.error("Error fetching user's ATM GO applications:", error);
    return {
      success: false,
      message: "Failed to fetch user's ATM GO applications.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update an ATM GO application status
 * @param {number} id - The application ID
 * @param {ApplicationStatus} status - The new status (Pending, Approved, Rejected, DONE)
 * @param {string} notes - Notes about the decision
 * @param {string} atmSerialNumber - The ATM serial number (optional)
 * @param {number} adminId - The ID of the admin user processing the application
 * @returns {Promise<ApplicationResponse>} - Result of the operation
 */
export async function updateATMGOApplicationStatus(
  id: number, 
  status: ApplicationStatus, 
  notes: string,
  atmSerialNumber?: string,
  adminId?: number | string
): Promise<ApplicationResponse> {
  try {
    if (!id || isNaN(Number(id))) {
      return {
        success: false,
        message: "Invalid application ID.",
      };
    }

    // Update to include 'DONE' as a valid status
    if (!['Pending', 'Approved', 'Rejected', 'DONE'].includes(status)) {
      return {
        success: false,
        message: "Invalid status value. Must be Pending, Approved, Rejected, or DONE.",
      };
    }

    // Prepare update data
    const updateData: any = {
      status,
      notes,
      processed_by: adminId ? Number(adminId) : null,
      processed_at: new Date(),
    };

    // Add ATM serial number to update data if provided
    if (atmSerialNumber !== undefined) {
      updateData.atm_serial_number = atmSerialNumber;
    }

    const updatedApplication = await prisma.pt_atm_go_form.update({
      where: {
        id: Number(id),
      },
      data: updateData,
    });

    // Format the fare for display
    const formattedApplication = {
      ...updatedApplication,
      fareToNearestBankFormatted: (updatedApplication.fare_to_nearest_bank / 100).toFixed(2)
    };

    return {
      success: true,
      data: formattedApplication,
    };
  } catch (error: unknown) {
    console.error("Error updating ATM GO application status:", error);
    return {
      success: false,
      message: "Failed to update ATM GO application status.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get ATM GO application statistics
 * @returns {Promise<ApplicationStatsResponse>} - Result of the operation with statistics
 */
export async function getATMGOApplicationStats(): Promise<ApplicationStatsResponse> {
  try {
    // Execute all queries in parallel for efficiency
    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      doneApplications,
      todayApplications,
      lastWeekApplications
    ] = await Promise.all([
      prisma.pt_atm_go_form.count(),
      prisma.pt_atm_go_form.count({ where: { status: 'Pending' } }),
      prisma.pt_atm_go_form.count({ where: { status: 'Approved' } }),
      prisma.pt_atm_go_form.count({ where: { status: 'Rejected' } }),
      prisma.pt_atm_go_form.count({ where: { status: 'DONE' } }),
      
      // Applications submitted today
      prisma.pt_atm_go_form.count({
        where: {
          submitted_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      
      // Applications submitted in the last 7 days
      prisma.pt_atm_go_form.count({
        where: {
          submitted_at: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalApplications,
        pendingApplications,
        approvedApplications, 
        rejectedApplications,
        DONEApplications: doneApplications,
        todayApplications,
        lastWeekApplications,
        approvalRate: totalApplications > 0 ? 
          (approvedApplications / totalApplications * 100).toFixed(2) : 0,
      },
    };
  } catch (error: unknown) {
    console.error("Error fetching ATM GO application stats:", error);
    return {
      success: false,
      message: "Failed to fetch ATM GO application statistics.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getATMGOApplicationStatus(userId: string) {
  try {
    if (!userId || isNaN(Number(userId))) {
      return {
        success: false,
        error: "Invalid user ID",
        data: null
      };
    }

    // Get the latest application for this user
    const applications = await prisma.pt_atm_go_form.findMany({
      where: {
        uid: Number(userId)
      },
      orderBy: {
        submitted_at: 'desc'
      },
      take: 1,
      select: {
        id: true,
        status: true,
        submitted_at: true,
        updated_at: true,
        notes: true,
        processed_at: true,
        atm_serial_number: true // Include ATM serial number in selection
      }
    });
    
    // If user has no applications, return empty status info
    if (!applications || applications.length === 0) {
      return {
        success: true,
        data: {
          status: null,
          hasApplication: false,
          isApproved: false,
          isPending: false,
          isRejected: false
        }
      };
    }
    
    // Get the latest application
    const latestApplication = applications[0];
    const status = latestApplication.status;
    
    // Return detailed status information
    return {
      success: true,
      data: {
        status: status,
        hasApplication: true,
        isApproved: status === "Approved",
        isPending: status === "Pending",
        isRejected: status === "Rejected",
        applicationId: latestApplication.id,
        submittedAt: latestApplication.submitted_at,
        updatedAt: latestApplication.updated_at,
        processedAt: latestApplication.processed_at,
        notes: latestApplication.notes,
        atmSerialNumber: latestApplication.atm_serial_number // Include in the response
      }
    };
  } catch (error) {
    console.error("Error fetching ATM GO application status:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching application status",
      data: null
    };
  }
}

/**
 * Gets all documents associated with a specific user
 * 
 * @param {number} userId - The ID of the user
 * @returns {Promise<UserDocumentsResponse>} Response with success status and documents
 */
interface UserDocumentsResponse {
  success: boolean;
  message: string;
  data?: Array<{
    id: number;
    application_id: number;
    document_type: string;
    document_url: string;
    status: string;
    file_type: string;
    original_filename: string;
    file_size: number;
    created_at: Date;
    updated_at: Date;
  }>;
  error?: string;
}

export async function getDocumentsByUserId(userId: number): Promise<UserDocumentsResponse> {
  try {
    // Validate required fields
    if (!userId) {
      return { success: false, message: "Missing required user ID." };
    }

    // Query the database for documents submitted by this user
    const documents = await prisma.pt_atmgo_documents.findMany({
      where: {
        user_id: userId
      },
      select: {
        id: true,
        application_id: true,
        document_type: true,
        document_url: true,
        status: true,
        file_type: true,
        original_filename: true,
        file_size: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 100 // Reasonable limit to prevent very large result sets
    });

    return {
      success: true,
      message: "User documents fetched successfully",
      data: documents.map(doc => ({
        ...doc,
        file_type: doc.file_type || "",
        original_filename: doc.original_filename || "",
        file_size: doc.file_size || 0,
      }))
    };
  } catch (error) {
    console.error("Error fetching user documents:", error);
    return {
      success: false,
      message: "Failed to fetch user documents",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Gets all documents associated with a specific application
 * 
 * @param {number} applicationId - The ID of the application
 * @returns {Promise<ApplicationDocumentsResponse>} Response with success status and documents
 */
interface ApplicationDocumentsResponse {
    success: boolean;
    message: string;
    data?: Array<{
      id: number;
      application_id: number;
      document_type: string;
      document_url: string;
      status: string;
      file_type: string;
      original_filename: string;
      file_size: number;
      created_at: Date;
      updated_at: Date;
    }>;
    error?: string;
  }
  
  export async function getDocumentsByApplicationId(applicationId: number): Promise<ApplicationDocumentsResponse> {
    try {
      // Validate required fields
      if (!applicationId) {
        return { success: false, message: "Missing required application ID." };
      }
  
      // Query the database for documents associated with this application
      const documents = await prisma.pt_atmgo_documents.findMany({
        where: {
          application_id: applicationId
        },
        select: {
          id: true,
          application_id: true,
          document_type: true,
          document_url: true,
          status: true,
          file_type: true,
          original_filename: true,
          file_size: true,
          created_at: true,
          updated_at: true
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 100 // Reasonable limit to prevent very large result sets
      });
  
      return {
        success: true,
        message: "Application documents fetched successfully",
        data: documents.map(doc => ({
          ...doc,
          file_type: doc.file_type || "",
          original_filename: doc.original_filename || "",
          file_size: doc.file_size || 0,
        }))
      };
    } catch (error) {
      console.error("Error fetching application documents:", error);
      return {
        success: false,
        message: "Failed to fetch application documents",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }