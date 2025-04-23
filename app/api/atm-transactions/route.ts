// app/api/atm-transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllAtmTransactions, getTransactionsByMerchantId } from "@/actions/atm-transaction";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const merchantId = searchParams.get("merchantId") || "all";
  
  try {
    // If merchantId is provided, get transactions for that merchant
    // Otherwise, get all transactions
    const response = merchantId !== "all" 
      ? await getTransactionsByMerchantId(merchantId)
      : await getAllAtmTransactions();
      
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to fetch transactions" },
        { status: response.status || 500 }
      );
    }
    
    // For getTransactionsByMerchantId, the data is in response.data
    // For getAllAtmTransactions, the data is directly in response.data
    const transactions = response.data.transactions || response.data;
    
    // Map the database model to the frontend model
    const mappedTransactions = transactions.map((transaction: any) => ({
      id: transaction.ID.toString(),
      userName: transaction.merchant_id || "Unknown",
      type: "ATM Transaction",
      amount: parseFloat(transaction.total_amount) || 0,
      timestamp: transaction.transaction_date,
      status: transaction.status || "",
      reference: transaction.transaction_reference || transaction.ID.toString(),
      // Additional data that might be useful
      withdrawAmount: parseFloat(transaction.withdraw_amount) || 0,
      balanceInquiryAmount: parseFloat(transaction.balance_inquiry_amount) || 0,
      fundTransferAmount: parseFloat(transaction.fund_transfer_amount) || 0,
      transactionFeeRcbc: parseFloat(transaction.transaction_fee_rcbc) || 0,
      transactionFeeMerchant: parseFloat(transaction.transaction_fee_merchant) || 0,
      billPaymentAmount: parseFloat(transaction.bill_payment_amount) || 0,
      cashInAmount: parseFloat(transaction.cash_in_amount) || 0
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: mappedTransactions 
    });
  } catch (error) {
    console.error("Error in ATM transactions API:", error);
    return NextResponse.json(
      { error: "Failed to fetch ATM transactions" },
      { status: 500 }
    );
  }
}