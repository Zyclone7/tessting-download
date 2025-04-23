export interface TransactionData {
    merchant_id: string;
    merchant_name: string;
    transaction_date: string;
    withdraw_count: number;
    balance_inquiry_count: number;
    fund_transfer_count: number;
    total_transaction_count: number;
    withdraw_amount: number;
    balance_inquiry_amount: number;
    fund_transfer_amount: number;
    total_amount: number;
    transaction_fee_rcbc: number;
    transaction_fee_merchant: number;
    bill_payment_count: number;
    bill_payment_amount: number;
    cash_in_count: number;
    cash_in_amount: number;
    status: string;
  }
  
  export interface TransactionResponse {
    success: boolean;
    data?: TransactionData[];
    error?: string;
  }
  
  export interface ReferralIncomeTransaction {
    id: number;
    invitation_code_id: number | null;
    sender_user_id: number | null;
    recipient_user_id: number | null;
    income_amount: string;
    level: number | null;
    created_at: string;
    sender: User | null;
    recipient: User | null;
    invitation_code: InvitationCode | null;
  }
  
  export interface User {
    ID: number;
    user_nicename: string;
    user_email: string;
    user_role: string;
    user_level: number;
    user_credits: number;
    user_referral_code: string;
    otp_code: string; // new
  }
  
  export interface InvitationCode {
    id: number;
    code: string;
    package: string;
    amount: number;
    user_id: number;
    redeemed_by: number | null;
    date_purchased: string;
    created_at: string;
  }
  
  export interface Incentive {
    generation: number;
    basic_incentive: number;
    premium_incentive: number;
    elite_incentive: number;
    elite_plus_incentive: number;
  }
  
  export type Transaction = {
    type: "passive" | "referral";
    amount: number;
    date: Date;
    level: number;
    sender?: {
      user_nicename: string;
    };
    invitation_code?: {
      code: string;
    };
  };
  
  export interface Term {
    term_id: number;
    title: string;
    content: string;
    display_order: number;
    created_at: Date;
    updated_at: Date;
    effective_date: Date | null;
  }
  
  export interface Policy {
    policy_id: number;
    title: string;
    content: string;
    display_order: number;
    created_at: Date;
    updated_at: Date;
    effective_date: Date | null;
  }
  
  export interface CreateTermInput {
    title: string;
    content: string;
    effective_date?: Date;
  }
  
  export interface UpdateTermInput {
    term_id: number;
    title: string;
    content: string;
    effective_date?: Date;
  }
  
  export interface CreatePolicyInput {
    title: string;
    content: string;
    effective_date?: Date;
  }
  
  export interface UpdatePolicyInput {
    policy_id: number;
    title: string;
    content: string;
    effective_date?: Date;
  }
  
  // types.ts
  export interface ATMGOApplication {
    id: number;
    complete_name: string;
    business_name: string;
    email: string;
    cellphone: string;
    has_business_permit: "YES" | "NO";
    has_extra_capital: "YES" | "NO";
    agree_with_transaction_target: "YES" | "NO";
    submitted_at: string;
    status: string;
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
    application_id?: string;
  }
  
  export interface ApplicationDocument {
    id: number;
    application_id: number | string;
    document_type: string;
    document_url: string;
    status: string;
    file_type: string;
    original_filename: string;
    file_size: number;
    created_at: Date;
    updated_at: Date;
    // Add these optional properties to make it compatible with ATMGODocument
    reference_no?: string;
    business_name?: string;
    merchant_name?: string;
    email?: string;
    phone?: string;
    submitted_at?: string;
    processed_at?: string | null;
    atm_serial_number?: string | null;
    business_address?: string | null;
    business_type?: string | null;
    has_business_permit?: boolean;
    has_extra_capital?: boolean;
    admin_notes?: string | null;
    pdf_url?: string | null;
  }
  
  
  
  export interface ToastProps {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }