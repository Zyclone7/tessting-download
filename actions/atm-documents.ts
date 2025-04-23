"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma-singleton";

/**
 * Interface for document upload data
 */
interface DocumentUploadData {
  applicationId: number;
  documentType: string;
  documentUrl: string;
  userId: number;
  originalFilename?: string;
  fileSize?: number;
  fileType?: string;
}

/**
 * Interface for document return data
 */
interface DocumentResponse {
  success: boolean;
  message: string;
  documentUrl?: string;
  error?: string;
}

/**
 * Interface for bulk document upload data
 */
interface BulkDocumentUploadData {
  applicationId: number;
  userId: number;
  documents: {
    documentType: string;
    documentUrl: string;
    originalFilename?: string;
    fileSize?: number;
    fileType?: string;
  }[];
}

/**
 * Interface for individual document result in bulk upload
 */
interface DocumentResult {
  documentType: string;
  documentUrl?: string;
  success: boolean;
  message?: string;
}

/**
 * Interface for bulk document upload response
 */
interface BulkDocumentResponse {
  success: boolean;
  message: string;
  results?: DocumentResult[];
  error?: string;
}

interface UserDocumentsResponse {
  success: boolean;
  message: string;
  data?: any[];
  error?: string;
}

/**
 * Define the allowed status values for documents based on the Prisma schema
 */
type DocumentStatus = 'pending' | 'verified' | 'rejected';

/**
 * Uploads a document URL to the database
 * This function only handles storing the Vercel Blob URL in the database
 * 
 * @param {DocumentUploadData} data - The document data
 * @returns {Promise<DocumentResponse>} Response with success status and message
 */
export async function uploadDocument(data: DocumentUploadData): Promise<DocumentResponse> {
  try {
    const { applicationId, documentType, documentUrl, userId, originalFilename, fileSize, fileType } = data;

    // Validate required fields
    if (!applicationId || !documentType || !documentUrl || !userId) {
      return { success: false, message: "Missing required fields." };
    }

    // Check if a document of this type already exists for this application
    const existingDocument = await prisma.pt_atmgo_documents.findFirst({
      where: {
        application_id: applicationId,
        document_type: documentType,
      },
    });

    if (existingDocument) {
      // Update existing document with new URL
      await prisma.pt_atmgo_documents.update({
        where: {
          id: existingDocument.id,
        },
        data: {
          document_url: documentUrl, // Using document_url as per the schema
          original_filename: originalFilename || existingDocument.original_filename,
          file_size: fileSize || existingDocument.file_size,
          file_type: fileType || existingDocument.file_type,
          // updated_at will be automatically set by MySQL's ON UPDATE
        },
      });
    } else {
      // Create new document record
      await prisma.pt_atmgo_documents.create({
        data: {
          application_id: applicationId,
          document_type: documentType,
          document_url: documentUrl,
          original_filename: originalFilename,
          file_size: fileSize,
          file_type: fileType,
          status: "pending" as DocumentStatus,
          user_id: userId,
          // created_at and updated_at will be automatically set by MySQL
        },
      });
    }

    // Refresh the UI
    revalidatePath(`/application/requirements`);

    return {
      success: true,
      message: `Document URL stored successfully!`,
      documentUrl: documentUrl
    };
  } catch (error) {
    console.error("Document URL Storage Error:", error);
    return {
      success: false,
      message: "Failed to store document URL",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Bulk uploads multiple document URLs to the database
 * This function only handles storing multiple Vercel Blob URLs in the database
 * 
 * @param {BulkDocumentUploadData} data - The document data
 * @returns {Promise<BulkDocumentResponse>} Response with success status and results
 */
export async function bulkUploadDocuments(data: BulkDocumentUploadData): Promise<BulkDocumentResponse> {
  try {
    const { applicationId, userId, documents } = data;

    // Validate required fields
    if (!applicationId || !userId || !documents || !documents.length) {
      return { success: false, message: "Missing required fields." };
    }

    // Process each document
    const results = await Promise.all(
      documents.map(async (doc) => {
        if (!doc.documentType || !doc.documentUrl) {
          return {
            documentType: doc.documentType || "Unknown",
            success: false,
            message: "Invalid document data",
          };
        }

        // Check if a document of this type already exists
        const existingDocument = await prisma.pt_atmgo_documents.findFirst({
          where: {
            application_id: applicationId,
            document_type: doc.documentType,
          },
        });

        if (existingDocument) {
          // Update existing document
          await prisma.pt_atmgo_documents.update({
            where: {
              id: existingDocument.id,
            },
            data: {
              document_url: doc.documentUrl,
              original_filename: doc.originalFilename || existingDocument.original_filename,
              file_size: doc.fileSize || existingDocument.file_size,
              file_type: doc.fileType || existingDocument.file_type,
              // updated_at will be automatically set by MySQL's ON UPDATE
            },
          });
        } else {
          // Create new document record
          await prisma.pt_atmgo_documents.create({
            data: {
              application_id: applicationId,
              document_type: doc.documentType,
              document_url: doc.documentUrl,
              original_filename: doc.originalFilename,
              file_size: doc.fileSize,
              file_type: doc.fileType,
              status: "pending" as DocumentStatus,
              user_id: userId,
              // created_at and updated_at will be automatically set by MySQL
            },
          });
        }

        return {
          documentType: doc.documentType,
          documentUrl: doc.documentUrl,
          success: true,
        };
      })
    );

    // Refresh the UI
    revalidatePath(`/application/requirements`);

    return {
      success: true,
      message: "All document URLs stored successfully!",
      results,
    };
  } catch (error) {
    console.error("Bulk Document URL Storage Error:", error);
    return {
      success: false,
      message: "Failed to store document URLs",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getATMGODocumentsByApplicationId(applicationId: number, userId: number) {
  try {
    // Validate input parameters
    if (!applicationId || !userId) {
      return {
        success: false,
        message: "Missing required fields."
      };
    }

    // Use a more efficient query that only selects required fields
    // and limits the number of results to prevent performance issues
    const documents = await prisma.pt_atmgo_documents.findMany({
      where: {
        application_id: applicationId,
        user_id: userId
      },
      select: {
        id: true,
        document_type: true,
        document_url: true,
        status: true,
        file_type: true,
        original_filename: true
      },
      orderBy: {
        created_at: 'desc'
      },
      distinct: ['document_type'], // Get only the latest document for each type
      take: 100 // Reasonable limit to prevent very large result sets
    });

    return {
      success: true,
      message: "Documents fetched successfully",
      data: documents
    };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return {
      success: false,
      message: "Failed to fetch documents",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
  
/**
 * Gets all documents submitted by a user for specific document types
 * 
 * @param {number} userId - The ID of the user
 * @param {string[]} documentTypes - Array of document types to filter by
 * @returns {Promise<UserDocumentsResponse>} Response with success status and filtered documents
 */
export async function getUserDocumentsByType(userId: number, documentTypes: string[]): Promise<UserDocumentsResponse> {
  try {
    // Validate required fields
    if (!userId || !documentTypes || documentTypes.length === 0) {
      return { success: false, message: "Missing required fields." };
    }

    // Query the database for documents submitted by this user with specified types
    const documents = await prisma.pt_atmgo_documents.findMany({
      where: {
        user_id: userId,
        document_type: {
          in: documentTypes
        }
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
      take: 100
    });

    return {
      success: true,
      message: "User documents by type fetched successfully",
      data: documents
    };
  } catch (error) {
    console.error("Error fetching user documents by type:", error);
    return {
      success: false,
      message: "Failed to fetch user documents by type",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
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
      data: documents
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
 * Interface for document status update data
 */
interface DocumentStatusUpdateData {
  documentId: number;
  status: DocumentStatus;
  reviewed_by?: number;  // Changed from reviewerId to reviewed_by
  rejectionReason?: string;
}

/**
 * Interface for document status update response
 */
interface DocumentStatusResponse {
  success: boolean;
  message: string;
  document?: any;
  error?: string;
}

/**
 * Interface for bulk document status update data
 */
interface BulkDocumentStatusUpdateData {
  documentIds: number[];
  status: DocumentStatus;
  reviewed_by?: number;  // Changed from reviewerId to reviewed_by
  rejectionReason?: string;
}

/**
 * Interface for bulk document status update response
 */
interface BulkDocumentStatusResponse {
  success: boolean;
  message: string;
  results?: { documentId: number; success: boolean; message?: string }[];
  error?: string;
}

/**
 * Updates the status of a document to approved or rejected
 * 
 * @param {DocumentStatusUpdateData} data - The document status update data
 * @returns {Promise<DocumentStatusResponse>} Response with success status and message
 */
export async function updateDocumentStatus(data: DocumentStatusUpdateData): Promise<DocumentStatusResponse> {
  try {
    const { documentId, status, reviewed_by, rejectionReason } = data;

    // Validate required fields
    if (!documentId || !status) {
      return { success: false, message: "Missing required fields." };
    }

    // Validate status value
    if (status !== 'verified' && status !== 'rejected' && status !== 'pending') {
      return { success: false, message: "Invalid status value. Must be 'verified', 'rejected', or 'pending'." };
    }

    // Check if document exists
    const existingDocument = await prisma.pt_atmgo_documents.findUnique({
      where: {
        id: documentId
      }
    });

    if (!existingDocument) {
      return { success: false, message: `Document with ID ${documentId} not found.` };
    }

    // Prepare update data
    const updateData: any = {
      status: status as DocumentStatus,
      updated_at: new Date()
    };

    // Add reviewer ID if provided
    if (reviewed_by) {
      updateData.reviewed_by = reviewed_by;
    }

    // Add rejection reason if status is rejected and reason is provided
    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    // Update document status
    const updatedDocument = await prisma.pt_atmgo_documents.update({
      where: {
        id: documentId
      },
      data: updateData
    });

    // Refresh the UI
    revalidatePath(`/application/requirements`);

    return {
      success: true,
      message: `Document status updated to ${status} successfully.`,
      document: updatedDocument
    };
  } catch (error) {
    console.error("Document Status Update Error:", error);
    return {
      success: false,
      message: "Failed to update document status",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Updates the status of multiple documents to approved or rejected
 * 
 * @param {BulkDocumentStatusUpdateData} data - The bulk document status update data
 * @returns {Promise<BulkDocumentStatusResponse>} Response with success status and results
 */
export async function bulkUpdateDocumentStatus(data: BulkDocumentStatusUpdateData): Promise<BulkDocumentStatusResponse> {
  try {
    const { documentIds, status, reviewed_by, rejectionReason } = data;

    // Validate required fields
    if (!documentIds || !documentIds.length || !status) {
      return { success: false, message: "Missing required fields." };
    }

    // Validate status value
    if (status !== 'verified' && status !== 'rejected' && status !== 'pending') {
      return { success: false, message: "Invalid status value. Must be 'verified', 'rejected', or 'pending'." };
    }

    // Process each document
    const results = await Promise.all(
      documentIds.map(async (documentId) => {
        try {
          // Check if document exists
          const existingDocument = await prisma.pt_atmgo_documents.findUnique({
            where: {
              id: documentId
            }
          });

          if (!existingDocument) {
            return {
              documentId,
              success: false,
              message: `Document with ID ${documentId} not found.`
            };
          }

          // Prepare update data
          const updateData: any = {
            status: status as DocumentStatus,
            updated_at: new Date()
          };

          // Add reviewer ID if provided
          if (reviewed_by) {
            updateData.reviewed_by = reviewed_by;
          }

          // Add rejection reason if status is rejected and reason is provided
          if (status === 'rejected' && rejectionReason) {
            updateData.rejection_reason = rejectionReason;
          }

          // Update document status
          await prisma.pt_atmgo_documents.update({
            where: {
              id: documentId
            },
            data: updateData
          });

          return {
            documentId,
            success: true,
            message: `Status updated to ${status} successfully.`
          };
        } catch (error) {
          console.error(`Error updating document ${documentId}:`, error);
          return {
            documentId,
            success: false,
            message: error instanceof Error ? error.message : "Unknown error"
          };
        }
      })
    );

    // Refresh the UI
    revalidatePath(`/application/requirements`);

    // Check if all updates were successful
    const allSuccessful = results.every(result => result.success);

    return {
      success: allSuccessful,
      message: allSuccessful 
        ? `All ${results.length} documents updated to ${status} successfully.`
        : `Some documents failed to update. Check results for details.`,
      results
    };
  } catch (error) {
    console.error("Bulk Document Status Update Error:", error);
    return {
      success: false,
      message: "Failed to update document statuses",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}