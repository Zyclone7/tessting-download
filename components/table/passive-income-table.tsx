"use client";

import React, { useEffect, useState } from "react";
import { ChevronDownIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { format, subDays, isToday, startOfDay } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  ArrowUpDown,
  X,
  DollarSign,
  User,
  CreditCard,
  Calendar,
  Layers,
  ArrowDownToLine,
  Send,
  Receipt,
  ArrowUpToLine,
  Calculator,
  Mail,
  Tag,
  TrendingUp,
  Clock,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  BarChart3,
  PieChart,
  Filter,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePickerWithRange } from "../date-picker-with-range";

// Replace the API fetch functions with direct imports of the server actions
import {
  getPassiveIncomeTransactions,
  getPassiveIncomeTransactionsByRecipientId,
} from "@/actions/passive-income";
import { useUserContext } from "@/hooks/use-user";

// Helper function to serialize Decimal values for JSON
function serializeDecimal(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map(serializeDecimal);
    }

    const result: Record<string, any> = {};
    for (const key in obj) {
      // Check if the value is a Decimal (has toFixed method)
      if (
        obj[key] &&
        typeof obj[key] === "object" &&
        typeof obj[key].toFixed === "function"
      ) {
        result[key] = Number(obj[key]);
      } else {
        result[key] = serializeDecimal(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

interface UserType {
  ID: number;
  user_nicename: string | null;
  user_email: string | null;
  user_role: string | null;
  user_level: number | null;
  user_credits: number | null;
  user_referral_code: string | null;
}

interface ATMTransaction {
  ID: number;
  merchant_id: string;
  merchant_name: string | null;
  transaction_date: string;
  withdraw_count: number | null;
  balance_inquiry_count: number | null;
  fund_transfer_count: number | null;
  total_transaction_count: number | null;
  withdraw_amount: number | null;
  balance_inquiry_amount: number | null;
  fund_transfer_amount: number | null;
  total_amount: number | null;
  transaction_fee_rcbc: number | null;
  transaction_fee_merchant: number | null;
  bill_payment_count: number | null;
  bill_payment_amount: number | null;
  cash_in_count: number | null;
  cash_in_amount: number | null;
  created_at: string | null;
  status: string | null;
  verified_date: string | null;
  approved_date: string | null;
  rejected_date: string | null;
}

interface PassiveIncomeTransaction {
  ID: number;
  transaction_id: number;
  sender_user_id: number;
  recipient_user_id: number;
  income_amount: number | null;
  level: number;
  created_at: string | null;
  sender: UserType | null;
  recipient: UserType | null;
  atmTransaction: ATMTransaction | null;
}

// Change the DateRange interface to match the react-day-picker DateRange type
// Replace the current DateRange interface with this:
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface FilterState {
  dateRange: DateRange;
  datePreset: string;
  minAmount: string;
  maxAmount: string;
  level: string;
}

export default function PassiveIncomeDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [data, setData] = useState<PassiveIncomeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedTransaction, setSelectedTransaction] =
    useState<PassiveIncomeTransaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("income");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStatsCards, setShowStatsCards] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Filter state
  // Then update the initial filterState to use undefined instead of null:
  const [filterState, setFilterState] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    datePreset: "allTime",
    minAmount: "",
    maxAmount: "",
    level: "",
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const { user } = useUserContext();

  // Add transaction counts tracking
  const [todayTransactions, setTodayTransactions] = useState<
    PassiveIncomeTransaction[]
  >([]);
  const [level1Transactions, setLevel1Transactions] = useState<
    PassiveIncomeTransaction[]
  >([]);
  const [level2Transactions, setLevel2Transactions] = useState<
    PassiveIncomeTransaction[]
  >([]);
  const [level3Transactions, setLevel3Transactions] = useState<
    PassiveIncomeTransaction[]
  >([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update the useEffect that calls fetchData
  useEffect(() => {
    if (isClient) {
      fetchData(false).then(() => {
        // This will run after data is fetched
      });
    }
  }, [isClient]);

  // Add a new useEffect to process the data after it's loaded
  useEffect(() => {
    if (data.length > 0) {
      // Categorize transactions by level
      const level1 = data.filter((item) => item.level === 1);
      const level2 = data.filter((item) => item.level === 2);
      const level3 = data.filter((item) => item.level === 3);

      // Categorize transactions by date
      const today = data.filter((item) => {
        if (!item.created_at) return false;
        try {
          const date = new Date(item.created_at);
          return isToday(date);
        } catch (error) {
          return false;
        }
      });

      setLevel1Transactions(level1);
      setLevel2Transactions(level2);
      setLevel3Transactions(level3);
      setTodayTransactions(today);
    }
  }, [data]);

  useEffect(() => {
    if (isClient) {
      fetchData();
    }
  }, [isClient]);

  // Apply date preset when it changes
  useEffect(() => {
    if (
      filterState.datePreset !== "custom" &&
      filterState.datePreset !== "allTime"
    ) {
      const today = new Date();
      let fromDate: Date | undefined = undefined;

      switch (filterState.datePreset) {
        case "today":
          fromDate = startOfDay(today);
          break;
        case "7days":
          fromDate = subDays(today, 7);
          break;
        case "15days":
          fromDate = subDays(today, 15);
          break;
        case "30days":
          fromDate = subDays(today, 30);
          break;
        case "moreThan30":
          // Set to date more than 30 days ago
          setFilterState((prev) => ({
            ...prev,
            dateRange: {
              from: undefined,
              to: subDays(today, 30),
            },
          }));
          return; // Early return as this is a special case
      }

      if (fromDate) {
        setFilterState((prev) => ({
          ...prev,
          dateRange: {
            from: fromDate,
            to: today,
          },
        }));
      }
    }
  }, [filterState.datePreset]);

  const fetchData = async (showToast = true) => {
    setLoading(true);
    if (showToast) {
      setIsRefreshing(true);
    }

    try {
      let result;
      if (user?.role === "admin") {
        result = await getPassiveIncomeTransactions();
      } else {
        result = await getPassiveIncomeTransactionsByRecipientId(user?.id ?? 0);
      }

      if (result.success) {
        setData(result.data);
        if (showToast) {
          toast({
            title: "Data refreshed",
            description: `Successfully loaded ${result.data.length} transactions`,
          });
        }
      } else {
        setError(result.error || "An error occurred while fetching data");
        toast({
          title: "Error",
          description: result.error || "An error occurred while fetching data",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError("An error occurred while fetching data");
      toast({
        title: "Error",
        description: err.message || "An error occurred while fetching data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      if (showToast) {
        setIsRefreshing(false);
      }
    }
  };

  // Helper function to get transaction counts by type
  const getTransactionCountsByType = (
    transactions: PassiveIncomeTransaction[],
    type: "withdraw" | "fund_transfer" | "bill_payment" | "cash_in"
  ) => {
    return transactions.reduce((sum, item) => {
      if (!item.atmTransaction) return sum;
      const countKey = `${type}_count` as keyof ATMTransaction;
      return sum + ((item.atmTransaction[countKey] as number) || 0);
    }, 0);
  };

  const formatUserRole = (role: any) => {
    if (!role) return "N/A";
    return role
      .split("_")
      .map(
        (word: any) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(" ")
      .replace("Package", "");
  };

  // Calculate total earned income
  const totalEarnedIncome = React.useMemo(() => {
    return data.reduce(
      (sum, item) => sum + (Number(item.income_amount) || 0),
      0
    );
  }, [data]);

  // Calculate today's income
  const todayIncome = React.useMemo(() => {
    return data.reduce((sum, item) => {
      if (!item.created_at) return sum;

      try {
        const date = new Date(item.created_at);
        if (isNaN(date.getTime())) return sum;

        if (isToday(date)) {
          return sum + (Number(item.income_amount) || 0);
        }
      } catch (error) {
        // Skip invalid dates
      }

      return sum;
    }, 0);
  }, [data]);

  // Calculate income by level
  const incomeByLevel = React.useMemo(() => {
    const byLevel: Record<number, number> = {};
    data.forEach((item) => {
      const level = item.level;
      byLevel[level] =
        (byLevel[level] || 0) + (Number(item.income_amount) || 0);
    });
    return byLevel;
  }, [data]);

  // Apply filters to data
  const filteredData = React.useMemo(() => {
    let filtered = [...data];

    // Apply date range filter if both dates are set
    if (
      filterState.dateRange &&
      filterState.dateRange.from &&
      filterState.dateRange.to
    ) {
      filtered = filtered.filter((item) => {
        try {
          if (!item.created_at) return false;
          const date = new Date(item.created_at);
          if (isNaN(date.getTime())) return false;

          // For "moreThan30" preset, we want dates BEFORE the "to" date
          if (filterState.datePreset === "moreThan30") {
            return date <= filterState.dateRange!.to!;
          }

          // For all other cases, check if date is within range
          return (
            date >= filterState.dateRange!.from! &&
            date <= filterState.dateRange!.to!
          );
        } catch (error) {
          return false;
        }
      });
    }

    // Apply level filter
    if (filterState.level && filterState.level !== "all") {
      filtered = filtered.filter(
        (item) => item.level === Number(filterState.level)
      );
    }

    // Apply min amount filter
    if (filterState.minAmount) {
      const minAmount = Number.parseFloat(filterState.minAmount);
      if (!isNaN(minAmount)) {
        filtered = filtered.filter(
          (item) => (item.income_amount || 0) >= minAmount
        );
      }
    }

    // Apply max amount filter
    if (filterState.maxAmount) {
      const maxAmount = Number.parseFloat(filterState.maxAmount);
      if (!isNaN(maxAmount)) {
        filtered = filtered.filter(
          (item) => (item.income_amount || 0) <= maxAmount
        );
      }
    }

    // Apply global filter
    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          item.transaction_id.toString().includes(searchTerm) ||
          (item.sender?.user_nicename?.toLowerCase() || "").includes(
            searchTerm
          ) ||
          (item.recipient?.user_nicename?.toLowerCase() || "").includes(
            searchTerm
          ) ||
          (item.sender?.user_email?.toLowerCase() || "").includes(searchTerm) ||
          (item.recipient?.user_email?.toLowerCase() || "").includes(
            searchTerm
          ) ||
          item.level.toString().includes(searchTerm)
        );
      });
    }

    return filtered;
  }, [data, filterState, globalFilter]);

  // Calculate total filtered amount
  const totalFilteredAmount = React.useMemo(() => {
    return filteredData.reduce(
      (sum, item) => sum + (Number(item.income_amount) || 0),
      0
    );
  }, [filteredData]);

  const applyFilters = () => {
    const newActiveFilters = [...activeFilters];

    // Apply date filter
    if (
      filterState.dateRange &&
      filterState.dateRange.from &&
      filterState.dateRange.to
    ) {
      if (!newActiveFilters.includes("date")) {
        newActiveFilters.push("date");
      }
    } else {
      const index = newActiveFilters.indexOf("date");
      if (index !== -1) {
        newActiveFilters.splice(index, 1);
      }
    }

    // Apply level filter
    if (filterState.level && filterState.level !== "all") {
      if (!newActiveFilters.includes("level")) {
        newActiveFilters.push("level");
      }
    } else {
      const index = newActiveFilters.indexOf("level");
      if (index !== -1) {
        newActiveFilters.splice(index, 1);
      }
    }

    // Apply amount filters
    if (filterState.minAmount || filterState.maxAmount) {
      if (!newActiveFilters.includes("amount")) {
        newActiveFilters.push("amount");
      }
    } else {
      const index = newActiveFilters.indexOf("amount");
      if (index !== -1) {
        newActiveFilters.splice(index, 1);
      }
    }

    setActiveFilters(newActiveFilters);
    setIsFilterActive(newActiveFilters.length > 0);
  };

  // Update the clearAllFilters function to use undefined instead of null:
  const clearAllFilters = () => {
    setFilterState({
      dateRange: { from: undefined, to: undefined },
      datePreset: "allTime",
      minAmount: "",
      maxAmount: "",
      level: "",
    });
    setGlobalFilter("");
    table.resetColumnFilters();
    setActiveFilters([]);
    setIsFilterActive(false);
  };

  // Update the handleViewTransactionDetails function to set loadingDetails to true immediately
  const handleViewTransactionDetails = async (
    transaction: PassiveIncomeTransaction
  ) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
    setLoadingDetails(true);

    // Since we already have the transaction details, we can just set loadingDetails to false
    setTimeout(() => {
      setLoadingDetails(false);
    }, 300); // Small delay for better UX
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch (error) {
      return dateString;
    }
  };

  // Calculate total transactions
  const calculateTotalTransactions = (transaction: ATMTransaction) => {
    return (
      (transaction.withdraw_count || 0) +
      (transaction.fund_transfer_count || 0) +
      (transaction.bill_payment_count || 0) +
      (transaction.cash_in_count || 0)
    );
  };

  // Calculate earned credits based on level
  const calculateEarnedCredits = (
    transaction: ATMTransaction,
    level: number
  ) => {
    const totalTransactions = calculateTotalTransactions(transaction);
    const multiplier = level === 1 ? 3 : 1;
    return totalTransactions * multiplier;
  };

  // Get user initials for avatar
  const getUserInitials = (user: UserType | null) => {
    if (!user || !user.user_nicename) return "?";
    const nameParts = user.user_nicename.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return user.user_nicename.substring(0, 2).toUpperCase();
  };

  // Update the formatDateRange function to handle undefined instead of null:
  const formatDateRange = (range: DateRange | undefined) => {
    if (!range || (!range.from && !range.to)) return "All Time";
    if (range.from && range.to) {
      return `${format(range.from, "MMM dd, yyyy")} - ${format(
        range.to,
        "MMM dd, yyyy"
      )}`;
    }
    if (range.from) return `From ${format(range.from, "MMM dd, yyyy")}`;
    if (range.to) return `Until ${format(range.to, "MMM dd, yyyy")}`;
    return "Custom Range";
  };

  const columns: ColumnDef<PassiveIncomeTransaction>[] = [
    {
      accessorKey: "ID",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-full justify-start"
          >
            ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="pl-4">{row.getValue("ID")}</div>,
    },
    {
      accessorKey: "transaction_id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-full justify-start"
          >
            Transaction ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("transaction_id")}</div>,
    },
    {
      accessorKey: "sender",
      header: "Sender",
      cell: ({ row }) => {
        const sender = row.original.sender;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border">
              <AvatarFallback className="bg-primary/10">
                {getUserInitials(sender)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                {sender?.user_nicename || "Unknown"}
              </span>
              <span className="text-xs text-muted-foreground">
                {sender?.user_email || ""}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "recipient",
      header: "Recipient",
      cell: ({ row }) => {
        const recipient = row.original.recipient;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border">
              <AvatarFallback className="bg-primary/10">
                {getUserInitials(recipient)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                {recipient?.user_nicename || "Unknown"}
              </span>
              <span className="text-xs text-muted-foreground">
                {recipient?.user_email || ""}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "income_amount",
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Income Amount
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium text-green-600">
          {(Number(row.getValue("income_amount")) || 0).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "level",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-full justify-center gap-2"
        >
          Level
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const level = row.getValue("level") as number;
        return (
          <div className="text-center">
            <Badge
              variant={
                level === 1 ? "default" : level === 2 ? "secondary" : "outline"
              }
              className="mx-auto"
            >
              Level {level}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Date
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right text-sm">
          {formatDate(row.getValue("created_at"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <DotsHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(transaction.ID.toString());
                    toast({
                      title: "Copied",
                      description: "Income ID copied to clipboard",
                    });
                  }}
                >
                  Copy income ID
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(
                      transaction.transaction_id.toString()
                    );
                    toast({
                      title: "Copied",
                      description: "Transaction ID copied to clipboard",
                    });
                  }}
                >
                  Copy transaction ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewTransactionDetails(transaction);
                  }}
                >
                  View details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: (filters) => {
      setColumnFilters(filters);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
  });

  if (!isClient) {
    return null;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-4">{error}</div>;
  }

  // Calculate total transactions for each level
  const level1Count = data.filter((item) => item.level === 1).length;
  const level2Count = data.filter((item) => item.level === 2).length;
  const level3Count = data.filter((item) => item.level === 3).length;
  const totalCount = data.length;

  // Calculate today's transactions count
  const todayTransactionsCount = data.filter((item) => {
    if (!item.created_at) return false;
    try {
      const date = new Date(item.created_at);
      return isToday(date);
    } catch (error) {
      return false;
    }
  }).length;

  return (
    <div className="w-full space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4"
      >
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Passive Income Dashboard</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fetchData(true)}
                  disabled={isRefreshing}
                  className="relative"
                >
                  <RefreshCw
                    className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  <span className="sr-only">Refresh data</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatsCards(!showStatsCards)}
                  className="gap-2"
                >
                  {showStatsCards ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {showStatsCards ? "Hide Stats" : "Show Stats"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {showStatsCards
                    ? "Hide statistics cards"
                    : "Show statistics cards"}
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
                  onClick={() =>
                    setViewMode(viewMode === "table" ? "cards" : "table")
                  }
                  className="gap-2"
                >
                  {viewMode === "table" ? (
                    <BarChart3 className="h-4 w-4" />
                  ) : (
                    <PieChart className="h-4 w-4" />
                  )}
                  {viewMode === "table" ? "Card View" : "Table View"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Switch to {viewMode === "table" ? "card" : "table"} view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>
      {showStatsCards && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Card className="overflow-hidden border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50 dark:bg-green-900/20">
                  <CardTitle className="text-sm font-medium">
                    Total Income
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-green-600">
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      totalEarnedIncome.toFixed(2)
                    )}
                  </div>
                  {loading ? (
                    <div className="space-y-1 mt-1">
                      <div className="text-xs text-muted-foreground">
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 mt-1">
                      <div className="text-xs text-muted-foreground">
                        {data.length} transactions
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <ArrowDownToLine className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(data, "withdraw")}{" "}
                          withdrawals
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <Send className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(data, "fund_transfer")}{" "}
                          transfers
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <Receipt className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(data, "bill_payment")}{" "}
                          bills
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <ArrowUpToLine className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(data, "cash_in")} cash in
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <Card className="overflow-hidden border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-amber-50 dark:bg-amber-900/20">
                  <CardTitle className="text-sm font-medium">
                    Today's Income
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-amber-600">
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      todayIncome.toFixed(2)
                    )}
                  </div>
                  {loading ? (
                    <div className="space-y-1 mt-1">
                      <div className="text-xs text-muted-foreground">
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 mt-1">
                      <div className="text-xs text-muted-foreground">
                        {todayTransactionsCount} transactions
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <ArrowDownToLine className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            todayTransactions,
                            "withdraw"
                          )}{" "}
                          withdrawals
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <Send className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            todayTransactions,
                            "fund_transfer"
                          )}{" "}
                          transfers
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <Receipt className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            todayTransactions,
                            "bill_payment"
                          )}{" "}
                          bills
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <ArrowUpToLine className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            todayTransactions,
                            "cash_in"
                          )}{" "}
                          cash in
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Card className="overflow-hidden border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50 dark:bg-blue-900/20">
                  <CardTitle className="text-sm font-medium">
                    Level 1 Income
                  </CardTitle>
                  <Layers className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      (incomeByLevel[1] || 0).toFixed(2)
                    )}
                  </div>
                  {loading ? (
                    <div className="space-y-1 mt-1">
                      <div className="text-xs text-muted-foreground">
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 mt-1">
                      <div className="text-xs text-muted-foreground">
                        {level1Count} transactions
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <ArrowDownToLine className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            level1Transactions,
                            "withdraw"
                          )}{" "}
                          withdrawals
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <Send className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            level1Transactions,
                            "fund_transfer"
                          )}{" "}
                          transfers
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <Receipt className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            level1Transactions,
                            "bill_payment"
                          )}{" "}
                          bills
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <ArrowUpToLine className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            level1Transactions,
                            "cash_in"
                          )}{" "}
                          cash in
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <Card className="overflow-hidden border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-purple-50 dark:bg-purple-900/20">
                  <CardTitle className="text-sm font-medium">
                    Level 2 Income
                  </CardTitle>
                  <Layers className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      (incomeByLevel[2] || 0).toFixed(2)
                    )}
                  </div>
                  {loading ? (
                    <div className="space-y-1 mt-1">
                      <div className="text-xs text-muted-foreground">
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 mt-1">
                      <div className="text-xs text-muted-foreground">
                        {level2Count} transactions
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <ArrowDownToLine className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            level2Transactions,
                            "withdraw"
                          )}{" "}
                          withdrawals
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <Send className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            level2Transactions,
                            "fund_transfer"
                          )}{" "}
                          transfers
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <Receipt className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            level2Transactions,
                            "bill_payment"
                          )}{" "}
                          bills
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <ArrowUpToLine className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            level2Transactions,
                            "cash_in"
                          )}{" "}
                          cash in
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Card className="overflow-hidden border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-emerald-50 dark:bg-emerald-900/20">
                  <CardTitle className="text-sm font-medium">
                    Level 3 Income
                  </CardTitle>
                  <Layers className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      (incomeByLevel[3] || 0).toFixed(2)
                    )}
                  </div>
                  {loading ? (
                    <div className="space-y-1 mt-1">
                      <div className="text-xs text-muted-foreground">
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 mt-1">
                      <div className="text-xs text-muted-foreground">
                        {level3Count} transactions
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <ArrowDownToLine className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            level3Transactions,
                            "withdraw"
                          )}{" "}
                          withdrawals
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <Send className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            level3Transactions,
                            "fund_transfer"
                          )}{" "}
                          transfers
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <Receipt className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            level3Transactions,
                            "bill_payment"
                          )}{" "}
                          bills
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 h-4"
                        >
                          <ArrowUpToLine className="h-3 w-3 mr-1" />{" "}
                          {getTransactionCountsByType(
                            level3Transactions,
                            "cash_in"
                          )}{" "}
                          cash in
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Input
            placeholder="Search transactions..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />

          {/* Date Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Date Range</span>
                {isFilterActive && activeFilters.includes("date") && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[300px] p-4" align="start">
              <div className="space-y-4">
                <h4 className="font-medium">Filter by Date</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={
                      filterState.datePreset === "today" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFilterState((prev) => ({
                        ...prev,
                        datePreset: "today",
                      }))
                    }
                    className="w-full"
                  >
                    Today
                  </Button>
                  <Button
                    variant={
                      filterState.datePreset === "7days" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFilterState((prev) => ({
                        ...prev,
                        datePreset: "7days",
                      }))
                    }
                    className="w-full"
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    variant={
                      filterState.datePreset === "15days"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFilterState((prev) => ({
                        ...prev,
                        datePreset: "15days",
                      }))
                    }
                    className="w-full"
                  >
                    Last 15 Days
                  </Button>
                  <Button
                    variant={
                      filterState.datePreset === "30days"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFilterState((prev) => ({
                        ...prev,
                        datePreset: "30days",
                      }))
                    }
                    className="w-full"
                  >
                    Last 30 Days
                  </Button>
                  <Button
                    variant={
                      filterState.datePreset === "moreThan30"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFilterState((prev) => ({
                        ...prev,
                        datePreset: "moreThan30",
                      }))
                    }
                    className="w-full"
                  >
                    More than 30 Days
                  </Button>
                  <Button
                    variant={
                      filterState.datePreset === "allTime"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFilterState((prev) => ({
                        ...prev,
                        datePreset: "allTime",
                        dateRange: { from: undefined, to: undefined },
                      }))
                    }
                    className="w-full"
                  >
                    All Time
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Custom Date Range</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setFilterState((prev) => ({
                          ...prev,
                          datePreset: "custom",
                        }))
                      }
                    >
                      Custom
                    </Button>
                  </div>
                  <DatePickerWithRange
                    date={filterState.dateRange}
                    setDate={(range) => {
                      setFilterState((prev: any) => ({
                        ...prev,
                        dateRange: range,
                        datePreset: "custom",
                      }));
                    }}
                  />
                </div>

                <div className="flex justify-between pt-2">
                  {/* Update the date filter reset button handler: */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterState((prev) => ({
                        ...prev,
                        dateRange: { from: undefined, to: undefined },
                        datePreset: "allTime",
                      }));
                    }}
                  >
                    Reset
                  </Button>
                  <Button onClick={applyFilters}>Apply</Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Advanced Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative h-9 gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {isFilterActive &&
                  (activeFilters.includes("level") ||
                    activeFilters.includes("amount")) && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"></span>
                  )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4" align="start">
              <div className="space-y-4">
                <h4 className="font-medium">Filter by Level</h4>
                <Select
                  value={filterState.level}
                  onValueChange={(value) =>
                    setFilterState((prev) => ({
                      ...prev,
                      level: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="1">Level 1</SelectItem>
                    <SelectItem value="2">Level 2</SelectItem>
                    <SelectItem value="3">Level 3</SelectItem>
                  </SelectContent>
                </Select>

                <h4 className="font-medium">Filter by Amount</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="min-amount">Min Amount</Label>
                    <Input
                      id="min-amount"
                      placeholder="0.00"
                      value={filterState.minAmount}
                      onChange={(e) =>
                        setFilterState((prev) => ({
                          ...prev,
                          minAmount: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-amount">Max Amount</Label>
                    <Input
                      id="max-amount"
                      placeholder="1000.00"
                      value={filterState.maxAmount}
                      onChange={(e) =>
                        setFilterState((prev) => ({
                          ...prev,
                          maxAmount: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={clearAllFilters}>
                    Reset
                  </Button>
                  <Button onClick={applyFilters}>Apply</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active filters display */}
        {isFilterActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 my-2"
          >
            <span className="text-sm font-medium text-muted-foreground">
              Active filters:
            </span>

            {activeFilters.includes("date") && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {filterState.datePreset === "today"
                  ? "Today"
                  : filterState.datePreset === "7days"
                  ? "Last 7 days"
                  : filterState.datePreset === "15days"
                  ? "Last 15 days"
                  : filterState.datePreset === "30days"
                  ? "Last 30 days"
                  : filterState.datePreset === "moreThan30"
                  ? "More than 30 days ago"
                  : formatDateRange(filterState.dateRange)}
                {/* Update the date filter badge removal handler: */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => {
                    setFilterState((prev) => ({
                      ...prev,
                      dateRange: { from: undefined, to: undefined },
                      datePreset: "allTime",
                    }));
                    const index = activeFilters.indexOf("date");
                    if (index !== -1) {
                      const newFilters = [...activeFilters];
                      newFilters.splice(index, 1);
                      setActiveFilters(newFilters);
                      setIsFilterActive(newFilters.length > 0);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {activeFilters.includes("level") && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                Level {filterState.level}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => {
                    setFilterState((prev) => ({
                      ...prev,
                      level: "",
                    }));
                    const index = activeFilters.indexOf("level");
                    if (index !== -1) {
                      const newFilters = [...activeFilters];
                      newFilters.splice(index, 1);
                      setActiveFilters(newFilters);
                      setIsFilterActive(newFilters.length > 0);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {activeFilters.includes("amount") && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {filterState.minAmount && filterState.maxAmount
                  ? `${filterState.minAmount} - ${filterState.maxAmount}`
                  : filterState.minAmount
                  ? `Min: ${filterState.minAmount}`
                  : `Max: ${filterState.maxAmount}`}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => {
                    setFilterState((prev) => ({
                      ...prev,
                      minAmount: "",
                      maxAmount: "",
                    }));
                    const index = activeFilters.indexOf("amount");
                    if (index !== -1) {
                      const newFilters = [...activeFilters];
                      newFilters.splice(index, 1);
                      setActiveFilters(newFilters);
                      setIsFilterActive(newFilters.length > 0);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={clearAllFilters}
            >
              Clear all
            </Button>
          </motion.div>
        )}
      </div>

      {viewMode === "table" ? (
        <Card className="border-none shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    [...Array(5)].map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columns.map((column, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTransactionDetails(row.original);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 py-4 border-t">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <X className="h-4 w-4 rotate-45" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronDownIcon className="h-4 w-4 rotate-90" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronDownIcon className="h-4 w-4 -rotate-90" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <X className="h-4 w-4 -rotate-45" />
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {loading ? (
              [...Array(6)].map((_, index) => (
                <Card key={index} className="border-none shadow-md">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between mb-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </CardFooter>
                </Card>
              ))
            ) : filteredData.length > 0 ? (
              filteredData.map((transaction) => (
                <motion.div
                  key={transaction.ID}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <Card
                    className="border-none shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleViewTransactionDetails(transaction)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">
                          Transaction #{transaction.transaction_id}
                        </CardTitle>
                        <Badge
                          variant={
                            transaction.level === 1
                              ? "default"
                              : transaction.level === 2
                              ? "secondary"
                              : "outline"
                          }
                        >
                          Level {transaction.level}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(transaction.created_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col items-center">
                          <Avatar className="h-10 w-10 border mb-1">
                            <AvatarFallback className="bg-primary/10">
                              {getUserInitials(transaction.sender)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">Sender</span>
                        </div>
                        <ArrowDownToLine className="h-5 w-5 text-muted-foreground" />
                        <div className="flex flex-col items-center">
                          <Avatar className="h-10 w-10 border mb-1">
                            <AvatarFallback className="bg-primary/10">
                              {getUserInitials(transaction.recipient)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">Recipient</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">From:</span>
                          <span className="font-medium">
                            {transaction.sender?.user_nicename || "Unknown"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">To:</span>
                          <span className="font-medium">
                            {transaction.recipient?.user_nicename || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <span className="text-sm font-medium text-muted-foreground">
                        Income:
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {(Number(transaction.income_amount) || 0).toFixed(2)}
                      </span>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full flex justify-center items-center h-40">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Transaction Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl w-full h-auto max-h-[80vh] overflow-y-auto p-0 gap-0">
          <DialogTitle></DialogTitle>
          {loadingDetails ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="w-full max-w-md mx-auto space-y-6">
                <div className="flex items-center justify-center">
                  <Skeleton className="h-16 w-16 rounded-full" />
                </div>
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-6 w-1/2 mx-auto" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <Skeleton className="h-8 w-full" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader className="sticky top-0 z-10 bg-background px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">
                      Passive Income Details
                    </DialogTitle>
                    <DialogDescription>
                      Income ID: {selectedTransaction?.ID} | Transaction ID:{" "}
                      {selectedTransaction?.transaction_id}
                    </DialogDescription>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {formatDate(selectedTransaction?.created_at || null)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="p-6">
                <Tabs defaultValue="income" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="income">Income Details</TabsTrigger>
                    <TabsTrigger value="transaction">
                      Transaction Details
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="income" className="space-y-6">
                    {selectedTransaction && (
                      <>
                        <Card className="overflow-hidden border-none shadow-md">
                          <CardHeader className="bg-green-50 dark:bg-green-900/20 pb-3">
                            <CardTitle className="text-xl font-semibold flex items-center">
                              <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                              Income Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Income Amount
                                  </Label>
                                  <span className="text-lg font-semibold text-green-600">
                                    {(
                                      Number(
                                        selectedTransaction.income_amount
                                      ) || 0
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Level
                                  </Label>
                                  <Badge
                                    variant={
                                      selectedTransaction.level === 1
                                        ? "default"
                                        : selectedTransaction.level === 2
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    Level {selectedTransaction.level}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Date Created
                                  </Label>
                                  <span className="text-sm font-medium">
                                    {formatDate(selectedTransaction.created_at)}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Transaction ID
                                  </Label>
                                  <span className="text-sm font-semibold">
                                    {selectedTransaction.transaction_id}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Sender ID
                                  </Label>
                                  <span className="text-sm font-semibold">
                                    {selectedTransaction.sender_user_id}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Recipient ID
                                  </Label>
                                  <span className="text-sm font-semibold">
                                    {selectedTransaction.recipient_user_id}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="overflow-hidden border-none shadow-md">
                            <CardHeader className="bg-blue-50 dark:bg-blue-900/20 pb-3">
                              <CardTitle className="text-lg font-semibold flex items-center">
                                <User className="mr-2 h-5 w-5 text-blue-600" />
                                Sender Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                              {selectedTransaction.sender ? (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                      <AvatarFallback className="text-lg">
                                        {getUserInitials(
                                          selectedTransaction.sender
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="text-lg font-semibold">
                                        {selectedTransaction.sender
                                          .user_nicename || "Unknown"}
                                      </h3>
                                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {selectedTransaction.sender
                                          .user_email || "No email"}
                                      </p>
                                    </div>
                                  </div>
                                  <Separator />
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">
                                        Role
                                      </Label>
                                      <p className="font-medium">
                                        {formatUserRole(
                                          selectedTransaction.sender.user_role
                                        ) || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">
                                        Level
                                      </Label>
                                      <p className="font-medium">
                                        {selectedTransaction.sender
                                          .user_level || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">
                                        Credits
                                      </Label>
                                      <p className="font-medium">
                                        {(
                                          Number(
                                            selectedTransaction.sender
                                              ?.user_credits
                                          ) || 0
                                        ).toFixed(2)}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">
                                        Referral Code
                                      </Label>
                                      <p className="font-medium flex items-center gap-1">
                                        <Tag className="h-3 w-3" />
                                        {selectedTransaction.sender
                                          .user_referral_code || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  Sender information not available
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          <Card className="overflow-hidden border-none shadow-md">
                            <CardHeader className="bg-purple-50 dark:bg-purple-900/20 pb-3">
                              <CardTitle className="text-lg font-semibold flex items-center">
                                <User className="mr-2 h-5 w-5 text-purple-600" />
                                Recipient Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                              {selectedTransaction.recipient ? (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                      <AvatarFallback className="text-lg">
                                        {getUserInitials(
                                          selectedTransaction.recipient
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="text-lg font-semibold">
                                        {selectedTransaction.recipient
                                          .user_nicename || "Unknown"}
                                      </h3>
                                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {selectedTransaction.recipient
                                          .user_email || "No email"}
                                      </p>
                                    </div>
                                  </div>
                                  <Separator />
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">
                                        Role
                                      </Label>
                                      <p className="font-medium">
                                        {formatUserRole(
                                          selectedTransaction.recipient
                                            .user_role
                                        ) || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">
                                        Level
                                      </Label>
                                      <p className="font-medium">
                                        {selectedTransaction.recipient
                                          .user_level || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">
                                        Credits
                                      </Label>
                                      <p className="font-medium">
                                        {(
                                          Number(
                                            selectedTransaction.recipient
                                              ?.user_credits
                                          ) || 0
                                        ).toFixed(2)}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">
                                        Referral Code
                                      </Label>
                                      <p className="font-medium flex items-center gap-1">
                                        <Tag className="h-3 w-3" />
                                        {selectedTransaction.recipient
                                          .user_referral_code || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  Recipient information not available
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="transaction" className="space-y-6">
                    {selectedTransaction?.atmTransaction ? (
                      <>
                        <Card className="overflow-hidden border-none shadow-md">
                          <CardHeader className="bg-primary/5 pb-3">
                            <CardTitle className="text-xl font-semibold flex items-center">
                              <CreditCard className="mr-2 h-5 w-5 text-primary" />
                              Transaction Information
                            </CardTitle>
                            <CardDescription>
                              Transaction ID:{" "}
                              {selectedTransaction.atmTransaction.ID}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Merchant ID
                                  </Label>
                                  <span className="text-sm font-semibold">
                                    {typeof selectedTransaction.atmTransaction
                                      .merchant_id === "string"
                                      ? selectedTransaction.atmTransaction
                                          .merchant_id
                                      : "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Merchant Name
                                  </Label>
                                  <span className="text-sm font-semibold">
                                    {selectedTransaction.atmTransaction
                                      .merchant_name || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Transaction Date
                                  </Label>
                                  <span className="text-sm font-semibold">
                                    {typeof selectedTransaction.atmTransaction
                                      .transaction_date === "string"
                                      ? selectedTransaction.atmTransaction
                                          .transaction_date
                                      : "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Status
                                  </Label>
                                  <span className="text-sm font-semibold">
                                    {selectedTransaction.atmTransaction
                                      .status || "N/A"}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Total Amount
                                  </Label>
                                  <span className="text-sm font-semibold">
                                    {typeof selectedTransaction.atmTransaction
                                      .total_amount === "number"
                                      ? selectedTransaction.atmTransaction.total_amount.toFixed(
                                          2
                                        )
                                      : "0.00"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Transaction Fee (RCBC)
                                  </Label>
                                  <span className="text-sm font-semibold">
                                    {typeof selectedTransaction.atmTransaction
                                      .transaction_fee_rcbc === "number"
                                      ? selectedTransaction.atmTransaction.transaction_fee_rcbc.toFixed(
                                          2
                                        )
                                      : "0.00"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Transaction Fee (Merchant)
                                  </Label>
                                  <span className="text-sm font-semibold">
                                    {typeof selectedTransaction.atmTransaction
                                      .transaction_fee_merchant === "number"
                                      ? selectedTransaction.atmTransaction.transaction_fee_merchant.toFixed(
                                          2
                                        )
                                      : "0.00"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b pb-2">
                                  <Label className="text-sm font-medium text-gray-500">
                                    Created At
                                  </Label>
                                  <span className="text-sm font-semibold">
                                    {selectedTransaction.atmTransaction
                                      .created_at &&
                                    typeof selectedTransaction.atmTransaction
                                      .created_at === "string"
                                      ? formatDate(
                                          selectedTransaction.atmTransaction
                                            .created_at
                                        )
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-none shadow-md">
                          <CardHeader className="bg-green-50 dark:bg-green-900/20 pb-3">
                            <CardTitle className="text-xl font-semibold flex items-center">
                              <Calculator className="mr-2 h-5 w-5 text-green-600" />
                              Transaction Counts
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <ArrowDownToLine className="h-4 w-4 text-blue-600" />
                                  <Label className="text-sm font-medium">
                                    Withdrawals
                                  </Label>
                                </div>
                                <div className="text-2xl font-bold">
                                  {selectedTransaction.atmTransaction
                                    .withdraw_count || 0}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Send className="h-4 w-4 text-green-600" />
                                  <Label className="text-sm font-medium">
                                    Fund Transfers
                                  </Label>
                                </div>
                                <div className="text-2xl font-bold">
                                  {selectedTransaction.atmTransaction
                                    .fund_transfer_count || 0}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Receipt className="h-4 w-4 text-amber-600" />
                                  <Label className="text-sm font-medium">
                                    Bill Payments
                                  </Label>
                                </div>
                                <div className="text-2xl font-bold">
                                  {selectedTransaction.atmTransaction
                                    .bill_payment_count || 0}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <ArrowUpToLine className="h-4 w-4 text-purple-600" />
                                  <Label className="text-sm font-medium">
                                    Cash In
                                  </Label>
                                </div>
                                <div className="text-2xl font-bold">
                                  {selectedTransaction.atmTransaction
                                    .cash_in_count || 0}
                                </div>
                              </div>
                            </div>

                            <Separator className="my-6" />

                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                              <div className="space-y-2 w-full md:w-1/2">
                                <Label className="text-sm font-medium">
                                  Total Transactions
                                </Label>
                                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                  <span className="text-sm font-medium">
                                    {selectedTransaction.atmTransaction
                                      .withdraw_count || 0}{" "}
                                    +{" "}
                                    {selectedTransaction.atmTransaction
                                      .fund_transfer_count || 0}{" "}
                                    +{" "}
                                    {selectedTransaction.atmTransaction
                                      .bill_payment_count || 0}{" "}
                                    +{" "}
                                    {selectedTransaction.atmTransaction
                                      .cash_in_count || 0}
                                  </span>
                                  <span className="text-xl font-bold">
                                    ={" "}
                                    {(selectedTransaction.atmTransaction
                                      .withdraw_count || 0) +
                                      (selectedTransaction.atmTransaction
                                        .fund_transfer_count || 0) +
                                      (selectedTransaction.atmTransaction
                                        .bill_payment_count || 0) +
                                      (selectedTransaction.atmTransaction
                                        .cash_in_count || 0)}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2 w-full md:w-1/2">
                                <Label className="text-sm font-medium">
                                  Earned Credits
                                </Label>
                                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <span className="text-sm font-medium">
                                    {(selectedTransaction.atmTransaction
                                      .withdraw_count || 0) +
                                      (selectedTransaction.atmTransaction
                                        .fund_transfer_count || 0) +
                                      (selectedTransaction.atmTransaction
                                        .bill_payment_count || 0) +
                                      (selectedTransaction.atmTransaction
                                        .cash_in_count || 0)}{" "}
                                    ×{" "}
                                    {selectedTransaction.level === 1
                                      ? "3"
                                      : "1"}
                                  </span>
                                  <span className="text-xl font-bold text-green-600">
                                    ={" "}
                                    {((selectedTransaction.atmTransaction
                                      .withdraw_count || 0) +
                                      (selectedTransaction.atmTransaction
                                        .fund_transfer_count || 0) +
                                      (selectedTransaction.atmTransaction
                                        .bill_payment_count || 0) +
                                      (selectedTransaction.atmTransaction
                                        .cash_in_count || 0)) *
                                      (selectedTransaction.level === 1 ? 3 : 1)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                              <h4 className="text-sm font-medium mb-2">
                                Level Multipliers
                              </h4>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="default" className="px-2">
                                    Level 1
                                  </Badge>
                                  <span className="text-xs font-medium">
                                    x3 credits
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="px-2">
                                    Level 2
                                  </Badge>
                                  <span className="text-xs font-medium">
                                    x1 credits
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="px-2">
                                    Level 3
                                  </Badge>
                                  <span className="text-xs font-medium">
                                    x1 credits
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Transaction details not available
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter className="px-6 py-4 border-t">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      selectedTransaction?.transaction_id.toString() || ""
                    )
                  }
                  className="gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Copy Transaction ID
                </Button>
                <DialogClose asChild>
                  <Button variant="default" className="gap-2">
                    <X className="h-4 w-4" />
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
