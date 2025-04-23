import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { format } from "date-fns";

// Assuming you have a logo image
import Logo from "@/public/images/XpressTravel.png";

// Define TypeScript interfaces
interface ATMGODocument {
  id: number;
  reference_no: string;
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
}

interface ATMGODocumentPDFProps {
  document: ATMGODocument;
  applicationDetails: any;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  logoUrl?: string | null;
  applicationId?: string;
  application: any;
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

// ATM GO Document PDF Component
const ATMGODocumentPDF: React.FC<ATMGODocumentPDFProps> = ({
  document,
  applicationDetails,
  title,
  author,
  subject,
  keywords,
  creator,
  producer,
  logoUrl,
}) => {
  // Get status badge color
  const getStatusBadgeStyle = () => {
    const baseStyle = styles.statusBadge;
    
    switch(document.status) {
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
      title={title || `ATM GO Document - ${document.reference_no}`}
      author={author || "PHILTECH ATM GO"}
      subject={subject || "ATM GO Application Document"}
      keywords={keywords || "ATM GO, application, document, merchant"}
      creator={creator || "ATM GO System"}
      producer={producer || "PHILTECH ATM GO"}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>PHILTECH Global Solutions Inc.</Text>
            <Text style={styles.headerText}>ATM GO Merchant Services</Text>
            <Text style={styles.headerText}>Contact: support@atmgo.ph</Text>
            <Text style={styles.headerText}>Channel: ATM GO MERCHANT SERVICES</Text>
          </View>
          <Image src={logoUrl || Logo.src} style={styles.logo} />
        </View>

        {/* Document Title and Status */}
        <Text style={styles.documentTitle}>ATM GO MERCHANT REGISTRATION</Text>
        
        <View style={styles.statusContainer}>
          <View style={getStatusBadgeStyle()}>
            <Text>{document.status}</Text>
          </View>
        </View>

        {/* Document Information */}
        <View style={styles.documentInfo}>
          <Text style={styles.documentReference}>Reference No: {document.reference_no}</Text>
          <Text style={styles.documentDate}>
            {document.status === "DONE" ? "Completed On: " : "Applied On: "}
            {formatDate(document.status === "DONE" ? document.processed_at : document.submitted_at)}
          </Text>
        </View>

        {/* Merchant Information Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>MERCHANT INFORMATION</Text>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{document.merchant_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{document.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact Number:</Text>
              <Text style={styles.infoValue}>{document.phone}</Text>
            </View>
          </View>
        </View>

        {/* Business Information Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>BUSINESS DETAILS</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.businessName}>{document.business_name}</Text>
            <Text style={styles.businessAddress}>{document.business_address || "Address not specified"}</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Business Type:</Text>
              <Text style={styles.infoValue}>{document.business_type || "Not specified"}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Application ID:</Text>
              <Text style={styles.infoValue}>{document.application_id}</Text>
            </View>
            
            <View style={styles.qualificationSection}>
              <Text style={styles.qualificationTitle}>Qualifications:</Text>
              
              <View style={styles.qualificationRow}>
                <View style={{ ...styles.qualificationDot, backgroundColor: document.has_business_permit ? "#059669" : "#d1d5db" }}></View>
                <Text style={styles.qualificationText}>Business Permit</Text>
              </View>
              
              <View style={styles.qualificationRow}>
                <View style={{ ...styles.qualificationDot, backgroundColor: document.has_extra_capital ? "#059669" : "#d1d5db" }}></View>
                <Text style={styles.qualificationText}>Extra Capital</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ATM Device Information Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>ATM DEVICE INFORMATION</Text>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Serial Number:</Text>
              <Text style={styles.infoValue}>{document.atm_serial_number || "Not Yet Assigned"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>{document.status}</Text>
            </View>

            {document.admin_notes && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Admin Notes:</Text>
                <Text style={styles.infoValue}>{document.admin_notes}</Text>
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
              This document serves as official proof of registration with ATM GO.
            </Text>
          </View>

          <View style={styles.noteItem}>
            <View style={styles.dotPoint} />
            <Text style={styles.noteText}>
              The ATM device provided is the property of PHILTECH Global Solutions Inc. and must be handled with care.
            </Text>
          </View>

          <View style={styles.noteItem}>
            <View style={styles.dotPoint} />
            <Text style={styles.noteText}>
              Merchants are responsible for maintaining the required float amount to service customer transactions.
            </Text>
          </View>

          <View style={styles.noteItem}>
            <View style={styles.dotPoint} />
            <Text style={styles.noteText}>
              Commission rates are subject to the terms outlined in your merchant agreement.
            </Text>
          </View>

          <View style={styles.noteItem}>
            <View style={styles.dotPoint} />
            <Text style={styles.noteText}>
              For inquiries or support, please contact our merchant helpdesk at support@atmgo.ph.
            </Text>
          </View>
        </View>

        {document.status === "DONE" && document.atm_serial_number && (
          <View style={styles.qrCodeContainer}>
            <Image 
              style={styles.qrCode} 
              src={{ uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" }} 
            />
            <Text style={styles.qrCodeText}>Scan to verify document authenticity</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This document is valid for the purposes of ATM GO merchant registration and verification.
          </Text>
          <Text>Generated on: {format(new Date(), "MMMM dd, yyyy")}</Text>
          <Text>© {new Date().getFullYear()} PHILTECH Global Solutions Inc. All rights reserved.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ATMGODocumentPDF;