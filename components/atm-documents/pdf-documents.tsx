import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { ApplicationDocument } from "@/utils/types";

// Define TypeScript interfaces
interface ATMGOApplication {
  id: number;
  complete_name: string;
  business_name: string;
  email: string;
  cellphone: string;
  has_business_permit: "YES" | "NO";
  has_extra_capital: "YES" | "NO";
  agree_with_transaction_target: "YES" | "NO";
  submitted_at: string;
  status: "Pending" | "Approved" | "Rejected" | "DONE";
  complete_address?: string;
  business_industry?: string;
  existing_business?: string;
  business_operational_years?: string;
  branch_count?: string;
  fareToNearestBankFormatted?: number;
  business_permit_image?: string;
  business_permit_details?: string;
  dti_details?: string;
  sec_details?: string;
  cda_details?: string;
  admin_notes?: string;
  processed_by?: number;
  processed_at?: string;
  atm_serial_number?: string;
  uid?: string | number;
  application_id?: string | number;

  
}

interface ATMGODocument {
    id: number;
    reference_no?: string;
    application_id: string;
    business_name: string;
    merchant_name: string;
    email: string;
    phone: string;
    status: "Pending" | "Approved" | "Rejected" | "DONE";
    submitted_at: string;
    processed_at: string | null;
    atm_serial_number: string | null;
    business_address: string | null;
    business_type: string | null;
    has_business_permit: boolean;
    has_extra_capital: boolean;
    admin_notes: string | null;
    pdf_url: string | null;
    document_type?: string;
  }

interface ATMGOApplicationPDFProps {
    application: ATMGOApplication;
    logoUrl?: string;
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    applicationDetails: any;
    document?: ApplicationDocument | ATMGODocument;  // Accept either type
    uploadedDocuments?: Array<any>;
  }

// Define the styles with improved professional appearance
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    color: "#1f2937",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottom: "1pt solid #e5e7eb",
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerText: {
    fontSize: 10,
    marginBottom: 3,
    color: "#4b5563",
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
  },
  logo: {
    width: 120,
    height: 50,
    objectFit: "contain",
  },
  documentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  documentReference: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
  },
  documentDate: {
    fontSize: 12,
    color: "#4b5563",
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
    color: "#111827",
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  statusBadge: {
    padding: 6,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
    width: "30%",
  },
  sectionContainer: {
    marginBottom: 25,
    borderRadius: 6,
    border: "1pt solid #e5e7eb",
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
    color: "#1f2937",
    padding: 10,
    borderBottom: "1pt solid #e5e7eb",
  },
  sectionContent: {
    padding: 12,
  },
  merchantHeader: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111827",
  },
  businessName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#111827",
  },
  businessAddress: {
    fontSize: 11,
    marginBottom: 10,
    color: "#4b5563",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "bold",
    width: "30%",
    color: "#4b5563",
  },
  infoValue: {
    fontSize: 11,
    width: "70%",
    color: "#1f2937",
  },
  qualificationSection: {
    marginTop: 12,
  },
  qualificationTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#4b5563",
  },
  qualificationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  qualificationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  qualificationText: {
    fontSize: 11,
    color: "#1f2937",
  },
  termsSection: {
    marginTop: 25,
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#111827",
    paddingBottom: 5,
    borderBottom: "1pt solid #e5e7eb",
  },
  noteItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  dotPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#6b7280",
    marginRight: 8,
    marginTop: 6,
  },
  noteText: {
    fontSize: 9,
    flex: 1,
    lineHeight: 1.6,
    color: "#4b5563",
  },
  qrCodeContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  qrCode: {
    width: 100,
    height: 100,
  },
  qrCodeText: {
    fontSize: 8,
    textAlign: "center",
    color: "#6b7280",
    marginTop: 5,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#6b7280",
    paddingTop: 10,
    borderTop: "1pt solid #e5e7eb",
  },
});

// Format dates helper
const formatDate = (date: string | null | undefined): string => {
  if (!date) return "N/A";
  try {
    return format(new Date(date), "MMMM d, yyyy");
  } catch (error) {
    return "Invalid Date";
  }
};

// Format currency helper
const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined) return "N/A";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

// ATM GO Application PDF Component
const ATMGOApplicationPDF: React.FC<ATMGOApplicationPDFProps> = ({
  application,
  logoUrl,
  title,
  author,
  subject,
  keywords,
  creator,
  producer,
  uploadedDocuments,
}) => {
  // Generate a reference number based on application ID and timestamp
  const referenceNumber = `ATMGO-${application.id}-${new Date()
    .getTime()
    .toString()
    .slice(-6)}`;

  // Get status badge color
  const getStatusBadgeStyle = () => {
    const baseStyle = styles.statusBadge;

    switch (application.status) {
      case "DONE":
        return { ...baseStyle, backgroundColor: "#0284c7" }; // Blue
      case "Approved":
        return { ...baseStyle, backgroundColor: "#059669" }; // Green
      case "Rejected":
        return { ...baseStyle, backgroundColor: "#dc2626" }; // Red
      default:
        return { ...baseStyle, backgroundColor: "#d97706" }; // Amber
    }
  };

  return (
    <Document
      title={title || `ATM GO Application - ${referenceNumber}`}
      author={author || "PHILTECH ATM GO"}
      subject={subject || "ATM GO Merchant Application"}
      keywords={keywords || "ATM GO, application, merchant"}
      creator={creator || "ATM GO System"}
      producer={producer || "PHILTECH ATM GO"}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>
              PHILTECH Global Solutions Inc.
            </Text>
            <Text style={styles.headerText}>ATM GO Merchant Services</Text>
            <Text style={styles.headerText}>Contact: support@atmgo.ph</Text>
            <Text style={styles.headerText}>
              Channel: ATM GO MERCHANT SERVICES
            </Text>
          </View>
          {logoUrl && <Image src={logoUrl} style={styles.logo} />}
        </View>

        {/* Document Title and Status */}
        <Text style={styles.documentTitle}>ATM GO MERCHANT REGISTRATION</Text>

        <View style={styles.statusContainer}>
          <View style={getStatusBadgeStyle()}>
            <Text>{application.status}</Text>
          </View>
        </View>

        {/* Document Information */}
        <View style={styles.documentInfo}>
          <Text style={styles.documentReference}>
            Reference No: {referenceNumber}
          </Text>
          <Text style={styles.documentDate}>
            {application.status === "DONE" ? "Completed On: " : "Applied On: "}
            {formatDate(
              application.status === "DONE"
                ? application.processed_at
                : application.submitted_at
            )}
          </Text>
        </View>

        {/* Merchant Information Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>MERCHANT INFORMATION</Text>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{application.complete_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{application.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact Number:</Text>
              <Text style={styles.infoValue}>{application.cellphone}</Text>
            </View>
          </View>
        </View>

        {/* Business Information Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>BUSINESS DETAILS</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.businessName}>{application.business_name}</Text>
            <Text style={styles.businessAddress}>
              {application.complete_address || "Address not specified"}
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Business Type:</Text>
              <Text style={styles.infoValue}>
                {application.business_industry || "Not specified"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Years in Operation:</Text>
              <Text style={styles.infoValue}>
                {application.business_operational_years || "Not specified"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Branch Count:</Text>
              <Text style={styles.infoValue}>
                {application.branch_count || "Not specified"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fare to Nearest Bank:</Text>
              <Text style={styles.infoValue}>
                {application.fareToNearestBankFormatted
                  ? formatCurrency(application.fareToNearestBankFormatted)
                  : "Not specified"}
              </Text>
            </View>

            <View style={styles.qualificationSection}>
              <Text style={styles.qualificationTitle}>Qualifications:</Text>

              <View style={styles.qualificationRow}>
                <View
                  style={{
                    ...styles.qualificationDot,
                    backgroundColor:
                      application.has_business_permit === "YES"
                        ? "#059669"
                        : "#d1d5db",
                  }}
                ></View>
                <Text style={styles.qualificationText}>Business Permit</Text>
              </View>

              <View style={styles.qualificationRow}>
                <View
                  style={{
                    ...styles.qualificationDot,
                    backgroundColor:
                      application.has_extra_capital === "YES"
                        ? "#059669"
                        : "#d1d5db",
                  }}
                ></View>
                <Text style={styles.qualificationText}>Extra Capital</Text>
              </View>

              <View style={styles.qualificationRow}>
                <View
                  style={{
                    ...styles.qualificationDot,
                    backgroundColor:
                      application.agree_with_transaction_target === "YES"
                        ? "#059669"
                        : "#d1d5db",
                  }}
                ></View>
                <Text style={styles.qualificationText}>
                  Agrees with Transaction Target
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Business Documentation Section */}
        {application.has_business_permit === "YES" && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>BUSINESS DOCUMENTATION</Text>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Business Permit:</Text>
                <Text style={styles.infoValue}>
                  {application.business_permit_details || "Not specified"}
                </Text>
              </View>

              {application.dti_details && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>DTI Certificate:</Text>
                  <Text style={styles.infoValue}>
                    {application.dti_details}
                  </Text>
                </View>
              )}

              {application.sec_details && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>SEC Registration:</Text>
                  <Text style={styles.infoValue}>
                    {application.sec_details}
                  </Text>
                </View>
              )}

              {application.cda_details && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>CDA Registration:</Text>
                  <Text style={styles.infoValue}>
                    {application.cda_details}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {uploadedDocuments && uploadedDocuments.length > 0 && (
          <View style={styles.sectionContainer} break>
            <Text style={styles.sectionTitle}>UPLOADED DOCUMENTS</Text>
            <View style={styles.sectionContent}>
              {uploadedDocuments.map((doc, index) => (
                <View
                  key={index}
                  style={[styles.infoRow, { marginBottom: 15 }]}
                >
                  <View style={{ width: "100%" }}>
                    <Text style={[styles.infoLabel, { marginBottom: 5 }]}>
                      {doc.document_type || "Document"} ({doc.status})
                    </Text>

                    {doc.document_url && doc.file_type && doc.file_type.includes('image') && (
  <Image 
    src={doc.document_data_url || doc.document_url} 
    style={{ width: 250, height: 150, marginBottom: 10, objectFit: 'contain' }} 
  />
)}

                    <Text style={styles.infoValue}>
                      {doc.original_filename || "Unnamed document"}(
                      {doc.file_size
                        ? `${(doc.file_size / 1024).toFixed(1)} KB`
                        : "Size unknown"}
                      )
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ATM Device Information Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>ATM DEVICE INFORMATION</Text>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Serial Number:</Text>
              <Text style={styles.infoValue}>
                {application.atm_serial_number || "Not Yet Assigned"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>{application.status}</Text>
            </View>

            {application.admin_notes && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Admin Notes:</Text>
                <Text style={styles.infoValue}>{application.admin_notes}</Text>
              </View>
            )}

            {application.processed_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Processed On:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(application.processed_at)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>TERMS & CONDITIONS</Text>

          <View style={styles.noteItem}>
            <View style={styles.dotPoint} />
            <Text style={styles.noteText}>
              This document serves as official proof of registration with ATM
              GO.
            </Text>
          </View>

          <View style={styles.noteItem}>
            <View style={styles.dotPoint} />
            <Text style={styles.noteText}>
              The ATM device provided is the property of PHILTECH Global
              Solutions Inc. and must be handled with care.
            </Text>
          </View>

          <View style={styles.noteItem}>
            <View style={styles.dotPoint} />
            <Text style={styles.noteText}>
              Merchants are responsible for maintaining the required float
              amount to service customer transactions.
            </Text>
          </View>

          <View style={styles.noteItem}>
            <View style={styles.dotPoint} />
            <Text style={styles.noteText}>
              Commission rates are subject to the terms outlined in your
              merchant agreement.
            </Text>
          </View>

          <View style={styles.noteItem}>
            <View style={styles.dotPoint} />
            <Text style={styles.noteText}>
              For inquiries or support, please contact our merchant helpdesk at
              support@atmgo.ph.
            </Text>
          </View>
        </View>

        {(application.status === "DONE" || application.status === "Approved") &&
          application.atm_serial_number && (
            <View style={styles.qrCodeContainer}>
              {/* This is a placeholder for QR code - in a real implementation, you would generate a QR code */}
              <View style={styles.qrCode} />
              <Text style={styles.qrCodeText}>
                Scan to verify document authenticity
              </Text>
            </View>
          )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This document is valid for the purposes of ATM GO merchant
            registration and verification.
          </Text>
          <Text>Generated on: {format(new Date(), "MMMM dd, yyyy")}</Text>
          <Text>
            © {new Date().getFullYear()} PHILTECH Global Solutions Inc. All
            rights reserved.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ATMGOApplicationPDF;
