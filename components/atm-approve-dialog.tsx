"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { DatePickerWithRange } from "./atm-approve-date";
import {
  updateTransactionStatusByBatch,
  getTransactionsByStatus,
} from "@/actions/atm-transaction";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Users,
  X,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const columns = [
  {
    id: "select",
    header: ({ table }: any) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }: any) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "merchant_id",
    header: "Merchant ID",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
      <span className="whitespace-nowrap font-medium">
        {row.getValue("merchant_id")}
      </span>
    ),
  },
  {
    accessorKey: "merchant_name",
    header: "Merchant Name",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
      <span className="whitespace-nowrap">{row.getValue("merchant_name")}</span>
    ),
  },
  {
    accessorKey: "transaction_date",
    header: "Transaction Date",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      const date = new Date(row.getValue("transaction_date"));
      return (
        <span className="whitespace-nowrap">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "withdraw_count",
    header: "Withdraw Count",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
      <Badge
        variant="outline"
        className="whitespace-nowrap bg-slate-50 text-slate-700 border-slate-200"
      >
        {row.getValue("withdraw_count") || 0}
      </Badge>
    ),
  },
  {
    accessorKey: "fund_transfer_count",
    header: "Fund Transfer",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
      <Badge
        variant="outline"
        className="whitespace-nowrap bg-slate-50 text-slate-700 border-slate-200"
      >
        {row.getValue("fund_transfer_count") || 0}
      </Badge>
    ),
  },
  {
    accessorKey: "cash_in_count",
    header: "GCash Count",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
      <Badge
        variant="outline"
        className="whitespace-nowrap bg-slate-50 text-slate-700 border-slate-200"
      >
        {row.getValue("cash_in_count") || 0}
      </Badge>
    ),
  },
  {
    accessorKey: "bill_payment_count",
    header: "Bill Payment",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
      <Badge
        variant="outline"
        className="whitespace-nowrap bg-slate-50 text-slate-700 border-slate-200"
      >
        {row.getValue("bill_payment_count") || 0}
      </Badge>
    ),
  },
  {
    accessorKey: "balance_inquiry_count",
    header: "Balance Inquiry",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      const totalCount = row.getValue("balance_inquiry_count") || 0;

      return (
        <Badge className="whitespace-nowrap bg-red-500 text-slate-50">
          {totalCount}
        </Badge>
      );
    },
  },
  {
    accessorKey: "total_transaction_count",
    header: "Total Count",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      const totalCount =
        (row.getValue("total_transaction_count") || 0) -
        (row.getValue("balance_inquiry_count") || 0);

      return (
        <Badge className="whitespace-nowrap bg-slate-700 text-slate-50">
          {totalCount}
        </Badge>
      );
    },
  },
  
  {
    accessorKey: "total_amount",
    header: "Total Amount",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      return (
        <span className="whitespace-nowrap font-medium">
          ₱{" "}
          {Number.parseFloat(row.getValue("total_amount")).toLocaleString(
            "en-US",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}
        </span>
      );
    },
  },
];

// Approved transactions columns
const approvedColumns = [
  {
    accessorKey: "merchant_id",
    header: "Merchant ID",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
      <span className="whitespace-nowrap font-medium">
        {row.getValue("merchant_id")}
      </span>
    ),
  },
  {
    accessorKey: "merchant_name",
    header: "Merchant Name",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
      <span className="whitespace-nowrap">{row.getValue("merchant_name")}</span>
    ),
  },
  {
    accessorKey: "transaction_date",
    header: "Transaction Date",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      const date = new Date(row.getValue("transaction_date"));
      return (
        <span className="whitespace-nowrap">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "total_transaction_count",
    header: "Total Count",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      const totalCount = row.getValue("total_transaction_count") || 0;

      return (
        <Badge
          variant="outline"
          className="whitespace-nowrap bg-slate-100 text-slate-700"
        >
          {totalCount}
        </Badge>
      );
    },
  },
  {
    accessorKey: "total_amount",
    header: "Total Amount",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      return (
        <span className="whitespace-nowrap font-medium">
          ₱{" "}
          {Number.parseFloat(row.getValue("total_amount")).toLocaleString(
            "en-US",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "approved_date",
    header: "Approved Date",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      const date = row.getValue("approved_date")
        ? new Date(row.getValue("approved_date"))
        : null;

      return (
        <span className="whitespace-nowrap text-slate-600">
          {date
            ? date.toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A"}
        </span>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: () => (
      <Badge className="whitespace-nowrap bg-slate-200 text-slate-800">
        <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
      </Badge>
    ),
  },
];

// Stat card component for reusability
const StatCard = ({ title, value, icon, description, color }: any) => (
  <Card className="overflow-hidden">
    <CardHeader className={`p-4 ${color}`}>
      <div className="flex justify-between items-center">
        <CardTitle className="text-sm font-medium text-white">
          {title}
        </CardTitle>
        {icon}
      </div>
    </CardHeader>
    <CardContent className="p-4">
      <div className="text-2xl font-bold">{value}</div>
      <CardDescription>{description}</CardDescription>
    </CardContent>
  </Card>
);

// Transaction card component
interface Transaction {
  merchant_id: string;
  merchant_name: string;
  transaction_date: string;
  withdraw_count: number;
  fund_transfer_count: number;
  cash_in_count: number;
  bill_payment_count: number;
  total_amount: number;
}

const TransactionCard = ({
  transaction,
  isApproved = false,
}: {
  transaction: Transaction;
  isApproved?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex justify-between items-start mb-2">
      <div className="font-medium truncate max-w-[70%]">
        {transaction.merchant_name}
      </div>
      {isApproved && (
        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
        </Badge>
      )}
    </div>
    <div className="text-sm text-slate-500 mb-2">
      ID: {transaction.merchant_id}
    </div>
    <div className="text-sm text-slate-500 mb-2">
      {new Date(transaction.transaction_date).toLocaleDateString()}
    </div>
    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
      <div className="flex gap-2">
        {transaction.withdraw_count > 0 && (
          <Badge variant="outline" className="text-xs bg-slate-50">
            W: {transaction.withdraw_count}
          </Badge>
        )}
        {transaction.fund_transfer_count > 0 && (
          <Badge variant="outline" className="text-xs bg-slate-50">
            FT: {transaction.fund_transfer_count}
          </Badge>
        )}
        {transaction.cash_in_count > 0 && (
          <Badge variant="outline" className="text-xs bg-slate-50">
            GC: {transaction.cash_in_count}
          </Badge>
        )}
        {transaction.bill_payment_count > 0 && (
          <Badge variant="outline" className="text-xs bg-slate-50">
            BP: {transaction.bill_payment_count}
          </Badge>
        )}
      </div>
      <div className="font-medium">
        ₱ {Number(transaction.total_amount).toLocaleString()}
      </div>
    </div>
  </motion.div>
);

export function ApproveBatchContent({ inDialog = false }) {
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<any | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [verifiedTransactions, setVerifiedTransactions] = useState<any[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [currentBatch, setCurrentBatch] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showApproved, setShowApproved] = useState(false);
  const [approvedTransactions, setApprovedTransactions] = useState<any[]>([]);
  const [approvedView, setApprovedView] = useState<"grid" | "table">("grid");
  const [approvedFilter, setApprovedFilter] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchVerifiedTransactions();
  }, []);

  const fetchVerifiedTransactions = async () => {
    setIsLoading(true);
    try {
      const result = await getTransactionsByStatus("verified");
      console.log("result", result);
      if (result.success) {
        // Add animation by setting with a slight delay
        setTimeout(() => {
          setVerifiedTransactions(result.data);
          setIsLoading(false);
        }, 300);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch verified transactions",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching verified transactions:", error);
      toast({
        title: "Error",
        description: "An error occurred while fetching verified transactions",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const fetchApprovedTransactions = async () => {
    setIsLoading(true);
    try {
      const result = await getTransactionsByStatus("approved");
      if (result.success) {
        setApprovedTransactions(result.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch approved transactions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching approved transactions:", error);
      toast({
        title: "Error",
        description: "An error occurred while fetching approved transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const result = await getTransactionsByStatus("verified");
      if (result.success) {
        setVerifiedTransactions(result.data);
        toast({
          title: "Refreshed",
          description: "Transaction data has been refreshed",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to refresh transactions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error refreshing transactions:", error);
      toast({
        title: "Error",
        description: "An error occurred while refreshing transactions",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredData = useMemo(() => {
    let data = verifiedTransactions;

    if (activeTab === "withdraw") {
      data = data.filter((item) => (item.withdraw_count || 0) > 0);
    } else if (activeTab === "fund_transfer") {
      data = data.filter((item) => (item.fund_transfer_count || 0) > 0);
    } else if (activeTab === "cash_in") {
      data = data.filter((item) => (item.cash_in_count || 0) > 0);
    } else if (activeTab === "bill_payment") {
      data = data.filter((item) => (item.bill_payment_count || 0) > 0);
    }

    if (!dateRange?.from) return data;

    return data.filter((item) => {
      const itemDate = new Date(item.transaction_date);
      return (
        itemDate >= dateRange.from &&
        (!dateRange.to || itemDate <= dateRange.to)
      );
    });
  }, [verifiedTransactions, dateRange, activeTab]);

  const filteredApprovedTransactions = useMemo(() => {
    if (!approvedFilter) return approvedTransactions;

    const searchLower = approvedFilter.toLowerCase();
    return approvedTransactions.filter(
      (tx) =>
        tx.merchant_id.toLowerCase().includes(searchLower) ||
        (tx.merchant_name &&
          tx.merchant_name.toLowerCase().includes(searchLower))
    );
  }, [approvedTransactions, approvedFilter]);

  useEffect(() => {
    setSelectedRows([]);
  }, [filteredData]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalAmount = verifiedTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.total_amount || 0),
      0
    );

    const totalWithdrawCount = verifiedTransactions.reduce(
      (sum, transaction) => sum + (transaction.withdraw_count || 0),
      0
    );

    const totalFundTransferCount = verifiedTransactions.reduce(
      (sum, transaction) => sum + (transaction.fund_transfer_count || 0),
      0
    );

    const totalCashInCount = verifiedTransactions.reduce(
      (sum, transaction) => sum + (transaction.cash_in_count || 0),
      0
    );

    const totalBillPaymentCount = verifiedTransactions.reduce(
      (sum, transaction) => sum + (transaction.bill_payment_count || 0),
      0
    );

    const uniqueMerchants = new Set(
      verifiedTransactions.map((transaction) => transaction.merchant_id)
    ).size;

    return {
      totalAmount,
      totalWithdrawCount,
      totalFundTransferCount,
      totalCashInCount,
      totalBillPaymentCount,
      uniqueMerchants,
      transactionCount: verifiedTransactions.length,
    };
  }, [verifiedTransactions]);

  // Process transactions in batches
  const handleApproveBatch = async () => {
    if (selectedRows.length === 0) {
      toast({
        title: "No transactions selected",
        description: "Please select at least one transaction to approve.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProcessedCount(0);
    setTotalToProcess(selectedRows.length);

    // Get all transaction IDs
    const allIds = selectedRows.map((row) => row.ID);

    try {
      // Process in batches of 2
      let currentIndex = 0;

      while (currentIndex < allIds.length) {
        // Get the current batch
        const batchIds = allIds.slice(currentIndex, currentIndex + 2);
        setCurrentBatch(batchIds);

        // Process the batch
        const result = await updateTransactionStatusByBatch(
          batchIds,
          "approved",
          batchIds.length
        );

        if (result.success) {
          // Update processed count
          setProcessedCount((prev) => prev + batchIds.length);

          // Optimistically update the UI
          const processedIdSet = new Set(batchIds);
          setVerifiedTransactions((prev) =>
            prev.filter((transaction) => !processedIdSet.has(transaction.ID))
          );
        } else {
          throw new Error(result.error || "Failed to approve batch");
        }

        // Add a small delay for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Move to the next batch
        currentIndex += 2;
      }

      // All batches processed successfully
      toast({
        title: "Batch Approved",
        description: `Successfully approved ${allIds.length} transactions.`,
      });

      // Reset state
      setSelectedRows([]);
      setCurrentBatch([]);

      // Refresh approved transactions if they're being shown
      if (showApproved) {
        fetchApprovedTransactions();
      }
    } catch (error) {
      console.error("Error processing batch:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress percentage
  const progressPercentage =
    totalToProcess > 0
      ? Math.round((processedCount / totalToProcess) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={inDialog ? "max-h-[80vh] overflow-y-auto pr-1" : ""}
    >
      <CardHeader className="border-b border-r border-l border-t bg-slate-100 sticky top-0 z-40 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">
              ATM Transaction Batch Approval
            </CardTitle>
            <CardDescription>
              Manage and approve verified ATM transactions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowApproved(!showApproved);
                      if (!showApproved && approvedTransactions.length === 0) {
                        fetchApprovedTransactions();
                      }
                    }}
                    className="border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    {showApproved ? "Hide Approved" : "Show Approved"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {showApproved
                      ? "Hide recently approved transactions"
                      : "View recently approved transactions"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={isRefreshing || isLoading}
                    className="border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh transaction data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Amount"
            value={`₱ ${statistics.totalAmount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            icon={<DollarSign className="h-5 w-5 text-white" />}
            description="Total value of pending transactions"
            color="bg-slate-700"
          />
          <StatCard
            title="Transactions"
            value={statistics.transactionCount}
            icon={<TrendingUp className="h-5 w-5 text-white" />}
            description="Pending verification"
            color="bg-slate-600"
          />
          <StatCard
            title="Unique Merchants"
            value={statistics.uniqueMerchants}
            icon={<Users className="h-5 w-5 text-white" />}
            description="Different merchants with transactions"
            color="bg-slate-500"
          />
          <StatCard
            title="Selected"
            value={selectedRows.length}
            icon={<CheckCircle2 className="h-5 w-5 text-white" />}
            description="Transactions ready for approval"
            color="bg-slate-400"
          />
        </div>

        {/* Transaction Type Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Withdrawals
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {statistics.totalWithdrawCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-slate-700 text-xs font-medium">
                  {Math.round(
                    (statistics.totalWithdrawCount /
                      (statistics.totalWithdrawCount +
                        statistics.totalFundTransferCount +
                        statistics.totalCashInCount +
                        statistics.totalBillPaymentCount)) *
                      100 || 0
                  )}
                  %
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Fund Transfers
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {statistics.totalFundTransferCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-slate-700 text-xs font-medium">
                  {Math.round(
                    (statistics.totalFundTransferCount /
                      (statistics.totalWithdrawCount +
                        statistics.totalFundTransferCount +
                        statistics.totalCashInCount +
                        statistics.totalBillPaymentCount)) *
                      100 || 0
                  )}
                  %
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-700">GCash</p>
                <p className="text-2xl font-bold text-slate-900">
                  {statistics.totalCashInCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-slate-700 text-xs font-medium">
                  {Math.round(
                    (statistics.totalCashInCount /
                      (statistics.totalWithdrawCount +
                        statistics.totalFundTransferCount +
                        statistics.totalCashInCount +
                        statistics.totalBillPaymentCount)) *
                      100 || 0
                  )}
                  %
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Bill Payments
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {statistics.totalBillPaymentCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-slate-700 text-xs font-medium">
                  {Math.round(
                    (statistics.totalBillPaymentCount /
                      (statistics.totalWithdrawCount +
                        statistics.totalFundTransferCount +
                        statistics.totalCashInCount +
                        statistics.totalBillPaymentCount)) *
                      100 || 0
                  )}
                  %
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 sticky top-[73px] z-50 bg-slate-100 rounded-md">
            <div className="flex items-center gap-2 p-1 rounded-md border border-slate-200">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${
                  activeTab === "all"
                    ? "bg-white shadow-sm"
                    : "hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab("all")}
              >
                <Filter className="h-3.5 w-3.5" />
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${
                  activeTab === "withdraw"
                    ? "bg-white shadow-sm"
                    : "hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab("withdraw")}
              >
                Withdraw
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${
                  activeTab === "fund_transfer"
                    ? "bg-white shadow-sm"
                    : "hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab("fund_transfer")}
              >
                Transfer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${
                  activeTab === "cash_in"
                    ? "bg-white shadow-sm"
                    : "hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab("cash_in")}
              >
                GCash
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${
                  activeTab === "bill_payment"
                    ? "bg-white shadow-sm"
                    : "hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab("bill_payment")}
              >
                Bills
              </Button>
            </div>

            <div className="flex-shrink-0">
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                className="bg-white border-slate-200"
                showLabel={false}
              />
            </div>

            <div className="flex-grow"></div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleApproveBatch}
                disabled={isLoading || selectedRows.length === 0}
                className="relative overflow-hidden bg-slate-800 hover:bg-slate-700"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    Approve Selected
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-slate-600 text-white"
                    >
                      {selectedRows.length}
                    </Badge>
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {isLoading && totalToProcess > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200"
            >
              <div className="flex justify-between text-sm font-medium">
                <span>Processing transactions...</span>
                <span>
                  {processedCount} of {totalToProcess} complete
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              {currentBatch.length > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-slate-500"
                >
                  Processing batch: {currentBatch.join(", ")}
                </motion.p>
              )}
            </motion.div>
          )}

          {showApproved && (
            <div className="mb-6 overflow-hidden">
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-800 text-sm">
                      Recently Approved Transactions
                    </CardTitle>
                    <CardDescription>
                      {approvedTransactions.length} transactions approved
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-200 text-slate-700 hover:bg-slate-100"
                        >
                          View All {approvedTransactions.length}{" "}
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle>Approved Transactions</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-1">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="relative w-full max-w-sm">
                                <input
                                  type="text"
                                  placeholder="Search by merchant ID or name..."
                                  className="w-full pl-3 pr-10 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-300"
                                  value={approvedFilter}
                                  onChange={(e) =>
                                    setApprovedFilter(e.target.value)
                                  }
                                />
                                {approvedFilter && (
                                  <button
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    onClick={() => setApprovedFilter("")}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>

                              <div className="flex gap-2 ml-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`border-slate-200 ${
                                    approvedView === "grid"
                                      ? "bg-slate-100"
                                      : ""
                                  }`}
                                  onClick={() => setApprovedView("grid")}
                                >
                                  Grid
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`border-slate-200 ${
                                    approvedView === "table"
                                      ? "bg-slate-100"
                                      : ""
                                  }`}
                                  onClick={() => setApprovedView("table")}
                                >
                                  Table
                                </Button>
                              </div>
                            </div>

                            <AnimatePresence mode="wait">
                              {approvedView === "grid" ? (
                                <motion.div
                                  key="grid-view"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {filteredApprovedTransactions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                      {filteredApprovedTransactions.map(
                                        (tx) => (
                                          <TransactionCard
                                            key={tx.ID}
                                            transaction={tx}
                                            isApproved={true}
                                          />
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-slate-500">
                                      <AlertCircle className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                      <p>No approved transactions found</p>
                                      {approvedFilter && (
                                        <p className="text-sm mt-1">
                                          Try adjusting your search criteria
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="table-view"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="rounded-md border border-slate-200 overflow-hidden">
                                    <DataTable
                                      columns={approvedColumns}
                                      data={filteredApprovedTransactions}
                                      onRowsSelected={(rows) =>
                                        console.log("Selected rows:", rows)
                                      }
                                    />
                                  </div>
                                  {filteredApprovedTransactions.length ===
                                    0 && (
                                    <div className="text-center py-8 text-slate-500">
                                      <AlertCircle className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                      <p>No approved transactions found</p>
                                      {approvedFilter && (
                                        <p className="text-sm mt-1">
                                          Try adjusting your search criteria
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : approvedTransactions.length > 0 ? (
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-3 gap-3"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: {
                          transition: {
                            staggerChildren: 0.05,
                          },
                        },
                        hidden: {},
                      }}
                    >
                      {approvedTransactions.slice(0, 6).map((tx, index) => (
                        <motion.div
                          key={tx.ID}
                          variants={{
                            visible: { opacity: 1, y: 0 },
                            hidden: { opacity: 0, y: 20 },
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <TransactionCard transaction={tx} isApproved={true} />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-center py-4 text-sm text-slate-500">
                      No recently approved transactions found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {isLoading && totalToProcess === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-slate-400 mb-4" />
              <p className="text-slate-500">Loading transactions...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  onRowsSelected={setSelectedRows}
                />
              </div>
              {filteredData.length === 0 && !isLoading && (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>
                    No transactions found. Try adjusting your filters or
                    refreshing the data.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    className="mt-4 border-slate-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {!isLoading && filteredData.length > 0 && (
            <div className="flex justify-between text-sm text-slate-500 mt-4">
              <span>
                Showing {filteredData.length} transaction
                {filteredData.length !== 1 ? "s" : ""}
              </span>
              <span>
                {selectedRows.length} of {filteredData.length} selected
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t p-4 bg-slate-50">
        <div className="text-xs text-slate-500 w-full flex justify-between items-center">
          <div>Last updated: {new Date().toLocaleString()}</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-slate-200">
              Verified Transactions
            </Badge>
            <Badge
              variant="outline"
              className="bg-slate-100 text-slate-700 border-slate-200 text-xs"
            >
              Auto-refresh enabled
            </Badge>
          </div>
        </div>
      </CardFooter>
    </motion.div>
  );
}

// Dialog wrapper component for parent usage
export function ApproveBatchDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>Approve Batch</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
        <DialogTitle className="sr-only">Approve Batch</DialogTitle>
        <ApproveBatchContent inDialog={true} />
      </DialogContent>
    </Dialog>
  );
}
