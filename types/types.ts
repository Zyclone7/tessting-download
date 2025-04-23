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
