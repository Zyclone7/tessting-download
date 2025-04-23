import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Define types for document data
interface DocumentData {
  id: number | string;
  document_type?: string;
  document_url?: string;
  file_type?: string;
  status?: string;
  original_filename?: string;
}

// Define types for the application data
interface ATMGOApplication {
  id: number;
  complete_name?: string;
  business_name?: string;
  email?: string;
  cellphone?: string;
  has_business_permit?: 'YES' | 'NO';
  has_extra_capital?: 'YES' | 'NO';
  agree_with_transaction_target?: 'YES' | 'NO';
  submitted_at?: string;
  status: 'Approved' | 'Rejected' | 'Pending' | 'DONE' | string;
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
  processed_by?: number | string;
  processed_at?: string;
  atm_serial_number?: string;
  documents?: DocumentData[];
}

// Define props for the component
interface ATMGOApplicationDocumentProps {
  application: ATMGOApplication;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '1pt solid #ddd',
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  logo: {
    width: 100,
    height: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  reference: {
    fontSize: 10,
    color: '#999',
  },
  statusBadge: {
    padding: 5,
    borderRadius: 4,
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
    width: 80,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: '#f5f5f5',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '30%',
    fontSize: 10,
    color: '#666',
  },
  value: {
    width: '70%',
    fontSize: 10,
  },
  qualification: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  qualificationLabel: {
    width: '70%',
    fontSize: 10,
  },
  qualificationValue: {
    width: '30%',
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    textAlign: 'center',
    color: '#999',
    borderTop: '1pt solid #ddd',
    paddingTop: 10,
  },
  adminNotes: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    fontSize: 10,
  },
  documentSection: {
    marginBottom: 15,
  },
  documentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  documentImage: {
    maxWidth: '100%',
    height: 200,
    marginBottom: 10,
    objectFit: 'contain',
    border: '1pt solid #eee',
  },
  documentInfo: {
    fontSize: 9,
    color: '#666',
    marginBottom: 5,
  },
  businessPermitImage: {
    maxWidth: '100%',
    height: 150,
    marginTop: 5,
    marginBottom: 10,
    objectFit: 'contain',
    border: '1pt solid #eee',
  },
});

// Status badge styles
const getStatusStyle = (status: string): { backgroundColor: string } => {
  switch (status) {
    case 'Approved':
      return { backgroundColor: '#10b981' };
    case 'Rejected':
      return { backgroundColor: '#ef4444' };
    case 'Pending':
      return { backgroundColor: '#f59e0b' };
    case 'DONE':
      return { backgroundColor: '#3b82f6' };
    default:
      return { backgroundColor: '#9ca3af' };
  }
};

// Format date with time
const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'MMM d, yyyy h:mm a');
};

// Format currency
const formatCurrency = (amount?: number): string => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

// Helper to check if the URL is a valid blob URL
const isBlobUrl = (url?: string): boolean => {
  return !!url && url.startsWith('blob:');
};

// Helper to check if the URL is an image type
const isImageUrl = (url?: string, fileType?: string): boolean => {
  if (!url) return false;
  
  // Check file extension or file type if provided
  if (fileType) {
    return fileType.includes('image');
  }
  
  // Try to guess from URL
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.jpg') || 
         lowerUrl.endsWith('.jpeg') || 
         lowerUrl.endsWith('.png') || 
         lowerUrl.endsWith('.gif') || 
         lowerUrl.endsWith('.webp');
};

// ATM GO Application Document component
const ATMGOApplicationDocument: React.FC<ATMGOApplicationDocumentProps> = ({ application }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>ATM GO Application</Text>
            <Text style={styles.subtitle}>Application ID: {application.id}</Text>
            <Text style={styles.reference}>Submitted on {formatDateTime(application.submitted_at)}</Text>
          </View>
          <View>
            <View style={[styles.statusBadge, getStatusStyle(application.status)]}>
              <Text>{application.status}</Text>
            </View>
          </View>
        </View>

        {/* Applicant Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Applicant Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Full Name:</Text>
            <Text style={styles.value}>{application.complete_name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{application.email || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone Number:</Text>
            <Text style={styles.value}>{application.cellphone || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{application.complete_address || 'N/A'}</Text>
          </View>
        </View>

        {/* Business Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Business Name:</Text>
            <Text style={styles.value}>{application.business_name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Industry:</Text>
            <Text style={styles.value}>{application.business_industry || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Existing Business:</Text>
            <Text style={styles.value}>{application.existing_business || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Years in Operation:</Text>
            <Text style={styles.value}>{application.business_operational_years || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Branch Count:</Text>
            <Text style={styles.value}>{application.branch_count || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fare to Nearest Bank:</Text>
            <Text style={styles.value}>{application.fareToNearestBankFormatted ? formatCurrency(application.fareToNearestBankFormatted) : 'N/A'}</Text>
          </View>
        </View>

        {/* Qualifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Qualifications</Text>
          <View style={styles.qualification}>
            <Text style={styles.qualificationLabel}>Has Business Permit:</Text>
            <Text style={styles.qualificationValue}>{application.has_business_permit || 'NO'}</Text>
          </View>
          <View style={styles.qualification}>
            <Text style={styles.qualificationLabel}>Has Extra Capital:</Text>
            <Text style={styles.qualificationValue}>{application.has_extra_capital || 'NO'}</Text>
          </View>
          <View style={styles.qualification}>
            <Text style={styles.qualificationLabel}>Agrees with Transaction Target:</Text>
            <Text style={styles.qualificationValue}>{application.agree_with_transaction_target || 'NO'}</Text>
          </View>
        </View>

        {/* Business Documentation (if applicable) */}
        {application.has_business_permit === 'YES' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Documentation</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Business Permit Number:</Text>
              <Text style={styles.value}>{application.business_permit_details || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>DTI:</Text>
              <Text style={styles.value}>{application.dti_details || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>SEC:</Text>
              <Text style={styles.value}>{application.sec_details || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>CDA:</Text>
              <Text style={styles.value}>{application.cda_details || 'N/A'}</Text>
            </View>
            
            {/* Business Permit Image (if available) */}
            {application.business_permit_image && (
              <View>
                <Text style={styles.documentTitle}>Business Permit Image:</Text>
                <Image 
                  src={application.business_permit_image} 
                  style={styles.businessPermitImage} 
                />
              </View>
            )}
          </View>
        )}

        {/* ATM Information (if applicable) */}
        {application.status === 'Approved' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ATM Device Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>ATM Serial Number:</Text>
              <Text style={styles.value}>{application.atm_serial_number || 'Not assigned yet'}</Text>
            </View>
          </View>
        )}

        {/* Documents Section (if available) */}
        {application.documents && application.documents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submitted Documents</Text>
            {application.documents.map((doc, index) => (
              <View key={index} style={styles.documentSection}>
                <Text style={styles.documentTitle}>
                  {doc.document_type || `Document ${index + 1}`}
                </Text>
                
                {doc.document_url && isImageUrl(doc.document_url, doc.file_type) && (
                  <Image 
                    src={doc.document_url} 
                    style={styles.documentImage} 
                  />
                )}
                
                <Text style={styles.documentInfo}>
                  Filename: {doc.original_filename || 'Unknown'}
                </Text>
                <Text style={styles.documentInfo}>
                  Status: {doc.status || 'Unknown'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Admin Notes (if applicable) */}
        {application.admin_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Notes</Text>
            <Text style={styles.adminNotes}>{application.admin_notes}</Text>
            <Text style={styles.reference}>
              Processed by Admin #{application.processed_by || 'N/A'} on {formatDateTime(application.processed_at || new Date().toISOString())}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This document was generated on {format(new Date(), 'MMMM d, yyyy h:mm a')} • ATM GO Application Portal
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ATMGOApplicationDocument;