import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  getTransactionCounts,
  getTransactionsByMerchantIdCount,
  getTransactionsByMerchantId,
  getMyMerchantTransactions
} from "@/actions/atm-transaction";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Define the transaction interface
interface Transaction {
  ID: string;
  merchant_id: string;
  withdraw_count: number;
  withdraw_amount: string;
  balance_inquiry_count: number;
  balance_inquiry_amount: string;
  fund_transfer_count: number;
  fund_transfer_amount: string;
  total_transaction_count: number;
  total_amount: string;
  transaction_fee_rcbc: string;
  transaction_fee_merchant: string;
  bill_payment_count: number;
  bill_payment_amount: string;
  cash_in_count: number;
  cash_in_amount: string;
  transaction_date: string;
  status: string;
  user_nicename?: string;
  generation?: number;
}

interface TransactionHistoryDashboardProps {
  userId?: string;
  merchantId?: string;
}

const TransactionHistoryDashboard: React.FC<TransactionHistoryDashboardProps> = ({
  userId,
  merchantId
}) => {
  // State for transaction data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myMerchantTransactions, setMyMerchantTransactions] = useState<Transaction[]>([]);
  const [transactionCounts, setTransactionCounts] = useState<{
    userTransactionCount: number;
    merchantTransactionCount: number;
    merchantSpecificCount?: number;
  }>({
    userTransactionCount: 0,
    merchantTransactionCount: 0
  });
  
  // Add loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("personal");
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch transaction counts
        if (userId) {
          const countsResponse = await getTransactionCounts(userId);
          if (countsResponse.success) {
            setTransactionCounts(prev => ({
              ...prev,
              userTransactionCount: countsResponse.data?.userTransactionCount || 0,
              merchantTransactionCount: countsResponse.data?.merchantTransactionCount || 0
            }));
          }
          
          // Fetch downline merchant transactions
          const myMerchantResponse = await getMyMerchantTransactions(userId);
          if (myMerchantResponse.success) {
            setMyMerchantTransactions(myMerchantResponse.data?.transactions || []);
          }
        }
        
        // Fetch transactions for specific merchant if merchantId is provided
        if (merchantId) {
          const merchantResponse = await getTransactionsByMerchantId(merchantId);
          if (merchantResponse.success) {
            setTransactions(merchantResponse.data?.transactions || []);
            
            if (merchantId !== "all") {
              // Update merchant specific count
              const merchantCountResponse = await getTransactionsByMerchantIdCount(merchantId);
              if (merchantCountResponse.success) {
                setTransactionCounts(prev => ({
                  ...prev,
                  merchantSpecificCount: merchantCountResponse.data?.transaction_count
                }));
              }
            }
          }
        } else if (userId) {
          // If no merchantId is provided but userId is, fetch user's own merchant transactions
          const user = await getUserMerchantId(userId);
          if (user?.merchant_id) {
            const userMerchantResponse = await getTransactionsByMerchantId(user.merchant_id);
            if (userMerchantResponse.success) {
              setTransactions(userMerchantResponse.data?.transactions || []);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching transaction data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userId, merchantId]);
  
  // Mock function to get user's merchant ID - replace with your actual implementation
  const getUserMerchantId = async (userId: string) => {
    // This is a placeholder - implement the actual fetch logic based on your API
    console.log("Fetching merchant ID for user:", userId);
    return { merchant_id: "user_merchant_id" }; // Replace with actual implementation
  };

  // Function to format date and time
  const formatDateTime = (dateTimeStr: string): string => {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Function to calculate time since transaction
  const getTimeSinceTransaction = (dateTimeStr: string): string => {
    const transactionDate = new Date(dateTimeStr);
    const currentDate = new Date();
    
    // Calculate difference in milliseconds
    const diffMs = currentDate.getTime() - transactionDate.getTime();
    
    // Convert to days, hours, minutes
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };
  
  // Function to get time badge styles
  const getTimeBadgeClass = (dateTimeStr: string): string => {
    const transactionDate = new Date(dateTimeStr);
    const currentDate = new Date();
    
    const diffDays = Math.floor((currentDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium";
    } else if (diffDays < 7) {
      return "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium";
    } else if (diffDays < 30) {
      return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium";
    } else {
      return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium";
    }
  };
  
  // Function to get date string for grouping
  const getDateString = (dateTimeStr: string): string => {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Group transactions by date
  const groupTransactionsByDate = (transactionList: Transaction[]) => {
    return transactionList.reduce((groups, transaction) => {
      const dateString = getDateString(transaction.transaction_date);
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);
  };
  
  const personalTransactionsByDate = groupTransactionsByDate(transactions);
  const downlineTransactionsByDate = groupTransactionsByDate(myMerchantTransactions);
  
  // Calculate totals for personal transactions
  const personalTotals = transactions.reduce((totals, transaction) => {
    totals.totalCount += transaction.total_transaction_count || 0;
    totals.totalAmount += parseFloat(transaction.total_amount) || 0;
    totals.withdrawAmount += parseFloat(transaction.withdraw_amount) || 0;
    totals.cashInAmount += parseFloat(transaction.cash_in_amount) || 0;
    return totals;
  }, { totalCount: 0, totalAmount: 0, withdrawAmount: 0, cashInAmount: 0 });
  
  // Calculate totals for downline transactions
  const downlineTotals = myMerchantTransactions.reduce((totals, transaction) => {
    totals.totalCount += transaction.total_transaction_count || 0;
    totals.totalAmount += parseFloat(transaction.total_amount) || 0;
    return totals;
  }, { totalCount: 0, totalAmount: 0 });
  
  // Render transaction table
  const renderTransactionTable = (transactionsByDate: Record<string, Transaction[]>, showMerchantInfo = false) => {
    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-100">
            <TableHead className="font-bold">Transaction ID</TableHead>
            {showMerchantInfo && (
              <>
                <TableHead className="font-bold">Merchant</TableHead>
                <TableHead className="font-bold">Generation</TableHead>
              </>
            )}
            <TableHead className="font-bold">Transaction Count</TableHead>
            <TableHead className="font-bold text-right">Withdraw Amount</TableHead>
            <TableHead className="font-bold text-right">Total Amount</TableHead>
            <TableHead className="font-bold">Date & Time</TableHead>
            <TableHead className="font-bold">Status</TableHead>
            <TableHead className="font-bold">Time Since</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.keys(transactionsByDate).length > 0 ? (
            Object.entries(transactionsByDate).map(([dateString, transactions]) => (
              <React.Fragment key={dateString}>
                <TableRow>
                  <TableCell colSpan={showMerchantInfo ? 9 : 7} className="bg-slate-50 font-medium py-2">
                    {dateString}
                  </TableCell>
                </TableRow>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.ID}>
                    <TableCell className="font-mono text-sm">{transaction.ID}</TableCell>
                    {showMerchantInfo && (
                      <>
                        <TableCell>{transaction.user_nicename || transaction.merchant_id}</TableCell>
                        <TableCell>{transaction.generation !== undefined ? `Gen ${transaction.generation}` : 'N/A'}</TableCell>
                      </>
                    )}
                    <TableCell>{transaction.total_transaction_count}</TableCell>
                    <TableCell className="text-right">
                      ${parseFloat(transaction.withdraw_amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${parseFloat(transaction.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(transaction.transaction_date)}
                    </TableCell>
                    <TableCell>
                      <span className={
                        transaction.status === "approved" 
                          ? "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                          : transaction.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium"
                          : "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium"
                      }>
                        {transaction.status || "Processing"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={getTimeBadgeClass(transaction.transaction_date)}>
                        {getTimeSinceTransaction(transaction.transaction_date)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={showMerchantInfo ? 9 : 7} className="text-center py-6 text-gray-500">
                {isLoading ? (
                  <div className="flex justify-center items-center">
                    <span className="mr-2">Loading transactions...</span>
                    <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  "No transactions found."
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };
  
  // Loading skeleton
  if (isLoading) {
    return (
      <Card className="shadow-md w-full">
        <CardHeader className="bg-slate-50">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="w-full space-y-6">
      {/* Transaction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{transactionCounts.userTransactionCount}</div>
            <div className="text-sm text-slate-500">Personal transaction count</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Downline Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{transactionCounts.merchantTransactionCount}</div>
            <div className="text-sm text-slate-500">Merchant network transactions</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {transactionCounts.userTransactionCount + transactionCounts.merchantTransactionCount}
            </div>
            <div className="text-sm text-slate-500">Combined transaction volume</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Transaction Tables */}
      <Card className="shadow-md">
        <CardHeader className="bg-slate-50">
          <CardTitle>ATM Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full border-b rounded-none p-0">
              <TabsTrigger value="personal" className="flex-1 rounded-none py-3">
                Your Transactions
              </TabsTrigger>
              <TabsTrigger value="downline" className="flex-1 rounded-none py-3">
                Downline Merchant Transactions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="m-0 p-0">
              <div className="overflow-x-auto">
                {renderTransactionTable(personalTransactionsByDate)}
              </div>
            </TabsContent>
            
            <TabsContent value="downline" className="m-0 p-0">
              <div className="overflow-x-auto">
                {renderTransactionTable(downlineTransactionsByDate, true)}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-slate-50 flex flex-col items-start">
          <div className="w-full font-medium text-lg mb-4">
            {activeTab === "personal" ? "Personal" : "Downline"} Transaction Summary
          </div>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTab === "personal" ? (
              <>
                <div className="border rounded-lg p-4 bg-white">
                  <h3 className="font-medium mb-2">Transaction Counts</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Total Transactions:</div>
                    <div className="font-medium text-right">{personalTotals.totalCount}</div>
                    <div>Database Total:</div>
                    <div className="font-medium text-right">{transactionCounts.userTransactionCount}</div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-white">
                  <h3 className="font-medium mb-2">Transaction Amounts</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Total Amount:</div>
                    <div className="font-medium text-right">${personalTotals.totalAmount.toFixed(2)}</div>
                    <div>Withdrawals:</div>
                    <div className="font-medium text-right">${personalTotals.withdrawAmount.toFixed(2)}</div>
                    <div>Cash-In:</div>
                    <div className="font-medium text-right">${personalTotals.cashInAmount.toFixed(2)}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="border rounded-lg p-4 bg-white">
                  <h3 className="font-medium mb-2">Downline Transaction Counts</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Displayed Transactions:</div>
                    <div className="font-medium text-right">{downlineTotals.totalCount}</div>
                    <div>Database Total:</div>
                    <div className="font-medium text-right">{transactionCounts.merchantTransactionCount}</div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-white">
                  <h3 className="font-medium mb-2">Network Comparison</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Your Transactions:</div>
                    <div className="font-medium text-right">{transactionCounts.userTransactionCount}</div>
                    <div>Downline Transactions:</div>
                    <div className="font-medium text-right">{transactionCounts.merchantTransactionCount}</div>
                    <div>Total Network:</div>
                    <div className="font-medium text-right">
                      {transactionCounts.userTransactionCount + transactionCounts.merchantTransactionCount}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TransactionHistoryDashboard;