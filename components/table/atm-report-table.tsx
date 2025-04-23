"use client";

import React, { useEffect, useState } from "react";
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons";
import {
  IconColumns,
  IconUsersPlus,
  IconUserUp,
  IconFileTypeCsv,
  IconDownload,
  IconFilter,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CSVLink } from "react-csv";
import {
  parseISO,
  format,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AtmReportCreation from "../atm-report-creation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowUpDown,
  CalendarIcon,
  CreditCard,
  Edit,
  Loader2,
  PoundSterlingIcon as PhilippinePeso,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import ATMDashboardPrint from "../atm-report-print";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import * as Slider from "@radix-ui/react-slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserContext } from "@/hooks/use-user";
import {
  getAllAtmTransactions,
  updateTransactionStatusById,
  updateTransactionStatusByBatch,
  getTransactionsByStatus,
} from "@/actions/atm-transaction";
import { Skeleton } from "@/components/ui/skeleton";
import { parse } from "date-fns";
import { formatNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Toast } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import { ApproveBatchContent } from "../atm-approve-dialog";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  setViewVoucher: any;
  onRefresh: () => void;
}

export default function AtmReportTable({ setViewVoucher, onRefresh }: Props) {
  const [voucherData, setVoucherData] = useState<any[]>([]);
  const [currentVoucherId, setCurrentVoucherId] = useState<number>(0);
  const [ifEditing, setIfEditing] = useState<boolean>(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [selectedDateField, setSelectedDateField] = useState<
    "created_at" | "transaction_date"
  >("transaction_date");
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 100000]);
  const [, setStatusType] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenReject, setIsOpenReject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { user } = useUserContext();
  const [isCheckLoading, setIsCheckLoading] = useState(false);
  const { toast } = useToast();
  const [isApproveBatchDialogOpen, setIsApproveBatchDialogOpen] =
    useState(false);

  const [showApproveButton, setShowApproveButton] = useState(false);

  const handleConfirmCheck = async (id: number, status: string) => {
    setIsCheckLoading(true);
    try {
      const response = await updateTransactionStatusById(id, "unverified");
      if (response) {
        // Update the local data
        setVoucherData((prevData) =>
          prevData.map((item) =>
            item.ID === id ? { ...item, status: "unverified" } : item
          )
        );
        setData((prevData) =>
          prevData.map((item) =>
            item.ID === id ? { ...item, status: "unverified" } : item
          )
        );
        setIsOpen(false);

        // Show status toast
        toast({
          title: "Status Updated",
          description: "Transaction has been marked as unverified",
        });

        // Move to the next transaction row
        const currentIndex = data.findIndex((item) => item.ID === id);
        if (currentIndex < data.length - 1) {
          setCurrentVoucherId(currentIndex + 1);
          // Show navigation toast
          toast({
            title: "Navigation",
            description: "Moved to next transaction",
          });
        }

        // Scroll dialog to top
        const dialogContent = document.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
      } else {
        // Handle error
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update transaction status",
        });
        console.error("Failed to update transaction status");
      }
    } catch (error) {
      console.error("Error updating transaction status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating status",
      });
    } finally {
      setIsCheckLoading(false);
    }
  };

  const handleConfirmVerify = async (id: number, status: string) => {
    setIsCheckLoading(true);
    try {
      const response = await updateTransactionStatusById(id, "verified");
      if (response) {
        // Show status toast
        toast({
          title: "Status Updated",
          description: "Transaction has been marked as verified",
        });

        // Refresh the page
        window.location.reload();

        // Note: Code below this point won't execute due to page refresh
      } else {
        // Handle error
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update transaction status",
        });
        console.error("Failed to update transaction status");
      }
    } catch (error) {
      console.error("Error updating transaction status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating status",
      });
    } finally {
      setIsCheckLoading(false);
    }
  };

  const handleConfirmApprove = async (id: number, status: string) => {
    setIsCheckLoading(true);
    try {
      const response = await updateTransactionStatusById(id, "approved");
      if (response) {
        // Update the local data
        setVoucherData((prevData) =>
          prevData.map((item) =>
            item.ID === id ? { ...item, status: "approved" } : item
          )
        );
        setData((prevData) =>
          prevData.map((item) =>
            item.ID === id ? { ...item, status: "approved" } : item
          )
        );
        setIsOpen(false);

        // Show status toast
        toast({
          title: "Status Updated",
          description: "Transaction has been marked as approved",
        });

        // Move to the next transaction row
        const currentIndex = data.findIndex((item) => item.ID === id);
        if (currentIndex < data.length - 1) {
          setCurrentVoucherId(currentIndex + 1);
          // Show navigation toast
          toast({
            title: "Navigation",
            description: "Moved to next transaction",
          });
        }

        // Scroll dialog to top
        const dialogContent = document.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
      } else {
        // Handle error
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update transaction status",
        });
        console.error("Failed to update transaction status");
      }
    } catch (error) {
      console.error("Error updating transaction status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating status",
      });
    } finally {
      setIsCheckLoading(false);
    }
  };

  const handleConfirmReject = async (id: number, status: string) => {
    setIsCheckLoading(true);
    try {
      const response = await updateTransactionStatusById(id, "rejected");
      if (response) {
        // Update the local data
        setVoucherData((prevData) =>
          prevData.map((item) =>
            item.ID === id ? { ...item, status: "rejected" } : item
          )
        );
        setData((prevData) =>
          prevData.map((item) =>
            item.ID === id ? { ...item, status: "rejected" } : item
          )
        );
        setIsOpenReject(false);

        // Show status toast
        toast({
          title: "Status Updated",
          description: "Transaction has been marked as rejected",
        });

        // Move to the next transaction row
        const currentIndex = data.findIndex((item) => item.ID === id);
        if (currentIndex < data.length - 1) {
          setCurrentVoucherId(currentIndex + 1);
          // Show navigation toast
          toast({
            title: "Navigation",
            description: "Moved to next transaction",
          });
        }

        // Scroll dialog to top
        const dialogContent = document.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
      } else {
        // Handle error
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update transaction status",
        });
        console.error("Failed to update transaction status");
      }
    } catch (error) {
      console.error("Error updating transaction status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating status",
      });
    } finally {
      setIsCheckLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
    onRefresh(); // Call the onRefresh prop
  };

  const handleCancel = () => setIsOpen(false);

  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getAllAtmTransactions();
      if (result.success) {
        setData(result.data ?? []);
        setVoucherData(result.data ?? []);
        console.log(result.data ?? []);
      } else {
        setError(result.error || "An error occurred while fetching data");
      }
    } catch (err) {
      setError("An error occurred while fetching data");
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const fetchVerifiedTransactions = async () => {
    try {
      const result = await getTransactionsByStatus("verified");
      if (result.success) {
        return result.data;
      } else {
        console.error("Error fetching verified transactions:", result.error);
        return [];
      }
    } catch (error) {
      console.error("Error fetching verified transactions:", error);
      return [];
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const resetFilters = () => {
    setGlobalFilter("");
    setDateRange(undefined);
    setSelectedDateField("created_at");
    setTransactionTypes([]);
    setAmountRange([0, 100000]);
    setData(voucherData);
  };

  const fuzzyFilter = (row: any, columnId: any, value: any) => {
    const itemValue = row.getValue(columnId);
    return (
      typeof itemValue === "string" &&
      itemValue.toLowerCase().includes(value.toLowerCase())
    );
  };

  const handleRowClick = (voucher: any, rowIndex: number) => {
    setViewVoucher(voucher);
    setCurrentVoucherId(rowIndex);
    setIfEditing(false);
  };

  const handleTransactionTypeChange = (type: string) => {
    setTransactionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleAmountRangeChange = (value: number[]) => {
    setAmountRange([value[0], value[1]]);
  };

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const handleEdit = () => {
    setIfEditing(!ifEditing);
  };

  const handleDateChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  };

  const handleDateFieldChange = (value: string) => {
    if (value === "created_at" || value === "transaction_date") {
      setSelectedDateField(value);
    }
  };

  const handleStatusChange = async (value: string) => {
    setStatusType(value);
    setLoading(true);
    try {
      let filteredData;
      if (value === "all") {
        const result = await getAllAtmTransactions();
        filteredData = result.success ? result.data : [];
      } else {
        const result = await getTransactionsByStatus(value);
        filteredData = result.success ? result.data : [];
      }
      setData(filteredData);
      setShowApproveButton(value === "verified");
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("An error occurred while fetching transactions");
    } finally {
      setLoading(false);
    }
    setCurrentVoucherId(0);
  };

  const calculateStatistics = (filteredData: any[]) => {
    return {
      totalWithdraw: filteredData.reduce(
        (sum, item) => sum + Number(item.withdraw_amount || 0),
        0
      ),
      totalWithdrawCount: filteredData.reduce(
        (sum, item) => sum + Number(item.withdraw_count || 0),
        0
      ),
      totalFundTransfer: filteredData.reduce(
        (sum, item) => sum + Number(item.fund_transfer_amount || 0),
        0
      ),
      totalFundTransferCount: filteredData.reduce(
        (sum, item) => sum + Number(item.fund_transfer_count || 0),
        0
      ),
      totalBillPaymentCount: filteredData.reduce(
        (sum, item) => sum + Number(item.bill_payment_count || 0),
        0
      ),
      totalBillPayment: filteredData.reduce(
        (sum, item) => sum + Number(item.bill_payment_amount || 0),
        0
      ),
      totalCashInCount: filteredData.reduce(
        (sum, item) => sum + Number(item.cash_in_count || 0),
        0
      ),
      totalCashInAmount: filteredData.reduce(
        (sum, item) => sum + Number(item.cash_in_amount || 0),
        0
      ),
      totalTransactionCount: filteredData.reduce(
        (sum, item) => sum + Number(item.total_transaction_count || 0),
        0
      ),
    };
  };

  const applyAdvancedFilters = () => {
    const filteredData = voucherData.filter((item) => {
      let itemDate;

      itemDate = parseISO(item[selectedDateField]);

      const isInDateRange = dateRange
        ? isWithinInterval(itemDate, {
            start: startOfDay(dateRange.from!),
            end: endOfDay(dateRange.to || dateRange.from!),
          })
        : true;

      const matchesGlobalFilter =
        !globalFilter ||
        Object.values(item).some(
          (val) =>
            typeof val === "string" &&
            val.toLowerCase().includes(globalFilter.toLowerCase())
        );

      const matchesTransactionType =
        transactionTypes.length === 0 ||
        (item.withdraw_count > 0 && transactionTypes.includes("withdraw")) ||
        (item.balance_inquiry_count > 0 &&
          transactionTypes.includes("balance_inquiry")) ||
        (item.fund_transfer_count > 0 &&
          transactionTypes.includes("fund_transfer"));

      const isInAmountRange =
        Number(item.total_amount) >= amountRange[0] &&
        Number(item.total_amount) <= amountRange[1];

      return (
        isInDateRange &&
        matchesGlobalFilter &&
        matchesTransactionType &&
        isInAmountRange
      );
    });

    setData(filteredData);
    setIsFilterPopoverOpen(false);
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const stats = calculateStatistics(data);

  const handleCheck = (transactionId: number) => {};

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "merchant_id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Merchant ID
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("merchant_id")}</div>
      ),
    },
    {
      accessorKey: "merchant_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Merchant Name
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("merchant_name")}</div>
      ),
      filterFn: fuzzyFilter,
    },
    {
      accessorKey: "transaction_date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-right"
          >
            Transaction
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dateStr: string | null = row.getValue("transaction_date");
        if (!dateStr) {
          return <div className="text-right font-medium">Not used</div>;
        }
        const date = parseISO(dateStr);
        if (isNaN(date.getTime())) {
          return <div className="text-right font-medium">Invalid Date</div>;
        }
        const formattedDate = format(date, "MMMM d, yyyy");
        return <div className="text-right font-medium">{formattedDate}</div>;
      },
    },

    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Status
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue("status");
        let statusText = "";
        let gradientClass = "";

        if (status === "unchecked") {
          statusText = "Unchecked";
          gradientClass =
            "bg-gradient-to-r from-gray-400 via-gray-400 to-gray-500 text-gray-900";
        } else if (status === "unverified") {
          statusText = "Unverified";
          gradientClass =
            "bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-900";
        } else if (status === "verified") {
          statusText = "Verified";
          gradientClass =
            "bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 text-blue-900";
        } else if (status === "rejected") {
          statusText = "Rejected";
          gradientClass =
            "bg-gradient-to-r from-red-300 via-red-400 to-red-500 text-red-900";
        } else if (status === "approved") {
          statusText = "Approved";
          gradientClass =
            "bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-green-900";
        } else {
          // Default fallback
          statusText = "Unknown";
          gradientClass =
            "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 text-gray-700";
        }

        return (
          <div
            className={`font-medium ${gradientClass} p-2 rounded-lg text-center`}
          >
            {statusText}
          </div>
        );
      },
    },

    {
      accessorKey: "withdraw_count",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Withdraw Count
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-900 dark:text-blue-300 text-blue-800 rounded-lg p-2">
          {row.getValue("withdraw_count")}
        </div>
      ),
    },
    {
      accessorKey: "withdraw_amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Withdraw Amount
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-900 dark:text-blue-300 text-blue-800 rounded-lg p-2">
          ₱ {formatNumber(parseInt(row.getValue("withdraw_amount"))) || 0}
        </div>
      ),
    },
    {
      accessorKey: "fund_transfer_count",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Fund Transfer Count
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium bg-gradient-to-r from-yellow-200 to-yellow-300 dark:from-yellow-800 dark:to-yellow-900 dark:text-yellow-300 text-yellow-800 rounded-lg p-2">
          {row.getValue("fund_transfer_count")}
        </div>
      ),
    },
    {
      accessorKey: "fund_transfer_amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Fund Transfer Amount
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium bg-gradient-to-r from-yellow-200 to-yellow-300 dark:from-yellow-800 dark:to-yellow-900 dark:text-yellow-300 text-yellow-800 rounded-lg p-2">
          ₱ {formatNumber(parseInt(row.getValue("fund_transfer_amount"))) || 0}
        </div>
      ),
    },
    {
      accessorKey: "bill_payment_count",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Bill Payment Count
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium bg-gradient-to-r from-green-200 to-green-300 dark:from-green-800 dark:to-green-900 dark:text-green-300 text-green-800 rounded-lg p-2">
          {row.getValue("bill_payment_count")}
        </div>
      ),
    },
    {
      accessorKey: "bill_payment_amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Bill Payment Amount
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium bg-gradient-to-r from-green-200 to-green-300 dark:from-green-800 dark:to-green-900 dark:text-green-300 text-green-800 rounded-lg p-2">
          ₱ {formatNumber(parseInt(row.getValue("bill_payment_amount"))) || 0}
        </div>
      ),
    },
    {
      accessorKey: "cash_in_count",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Cash In Count
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium bg-gradient-to-r from-pink-200 to-pink-300 dark:from-pink-800 dark:to-pink-900 dark:text-pink-300 text-pink-800 rounded-lg p-2">
          {row.getValue("cash_in_count")}
        </div>
      ),
    },
    {
      accessorKey: "cash_in_amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Cash In Amount
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium bg-gradient-to-r from-pink-200 to-pink-300 dark:from-pink-800 dark:to-pink-900 dark:text-pink-300 text-pink-800 rounded-lg p-2">
          ₱ {formatNumber(parseInt(row.getValue("cash_in_amount"))) || 0}
        </div>
      ),
    },
    {
      accessorKey: "balance_inquiry_count",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Balance Inquiry Count
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium bg-gradient-to-r from-teal-200 to-teal-300 dark:from-teal-800 dark:to-teal-900 dark:text-teal-300 text-teal-800 rounded-lg p-2">
          {row.getValue("balance_inquiry_count")}
        </div>
      ),
    },
    {
      accessorKey: "balance_inquiry_amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Balance Inquiry Amount
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium bg-gradient-to-r from-teal-200 to-teal-300 dark:from-teal-800 dark:to-teal-900 dark:text-teal-300 text-teal-800 rounded-lg p-2">
          ₱{" "}
          {formatNumber(parseInt(row.getValue("balance_inquiry_amount"))) || 0}
        </div>
      ),
    },
    {
      accessorKey: "total_transaction_count",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Total Transaction Count
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium bg-gradient-to-r from-red-200 to-red-300 dark:from-red-800 dark:to-red-900 dark:text-red-300 text-red-800 rounded-lg p-2">
          {row.getValue("total_transaction_count")}
        </div>
      ),
    },
    {
      accessorKey: "total_amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Total Amount
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium bg-gradient-to-r from-red-200 to-red-300 dark:from-red-800 dark:to-red-900 dark:text-red-300 text-red-800 rounded-lg p-2">
          ₱ {formatNumber(parseInt(row.getValue("total_amount"))) || 0}
        </div>
      ),
    },

    {
      accessorKey: "created_at",
      header: () => <div className="text-right font-medium">Created</div>,
      cell: ({ row }) => {
        let dateStr = row.getValue("created_at");

        if (typeof dateStr !== "string" || dateStr.trim() === "") {
          return <div className="text-right font-medium"></div>;
        }

        try {
          // Parse the date in the 'yyyy-MM-dd HH:mm:ss' format
          const date = parse(dateStr, "yyyy-MM-dd HH:mm:ss", new Date());

          // Check if the date is valid
          if (isNaN(date.getTime())) {
            return <div className="text-right font-medium"></div>;
          }

          const formattedDate = format(date, "MMMM d, yyyy");
          return (
            <div className="text-right font-medium">
              {row.getValue("created_at")}
            </div>
          );
        } catch (error) {
          console.error("Error parsing date:", error);
          return <div className="text-right font-medium"></div>;
        }
      },
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const voucher = row.original;
        return (
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
                onClick={() =>
                  navigator.clipboard.writeText(voucher.voucherId.toString())
                }
              >
                Copy Voucher ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View voucher details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    autoResetPageIndex: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  if (error) {
    return <div className="text-center text-red-500 mt-4">{error}</div>;
  }

  useEffect(() => {
    if (data.length > 0 && currentVoucherId >= 0) {
      setViewVoucher(data[currentVoucherId]);
    }
  }, [currentVoucherId, data, setViewVoucher]);

  return (
    <div className="w-full items-center justify-center">
      <div className="mb-4 flex flex-row justify-between">
        <Popover
          open={isFilterPopoverOpen}
          onOpenChange={setIsFilterPopoverOpen}
        >
          <PopoverTrigger asChild>
            <Button variant="outline">
              <IconFilter className="mr-2 h-4 w-4" />
              Advanced Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Date Field</h4>
                <Select
                  value={selectedDateField}
                  onValueChange={handleDateFieldChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created At</SelectItem>
                    <SelectItem value="transaction_date">
                      Transaction Date
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Date Range</h4>
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={handleDateChange}
                />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Transaction Types</h4>
                <div className="flex flex-wrap gap-2">
                  {["withdraw", "balance_inquiry", "fund_transfer"].map(
                    (type) => (
                      <Button
                        key={type}
                        variant={
                          transactionTypes.includes(type)
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleTransactionTypeChange(type)}
                        className="capitalize"
                      >
                        {type.replace("_", " ")}
                      </Button>
                    )
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Amount Range</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-muted-foreground">
                        Min
                      </label>
                      <Input
                        type="number"
                        value={amountRange[0]}
                        onChange={(e) =>
                          setAmountRange([
                            Number(e.target.value),
                            amountRange[1],
                          ])
                        }
                        className="w-28"
                        placeholder="₱0"
                      />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      to
                    </span>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-muted-foreground">
                        Max
                      </label>
                      <Input
                        type="number"
                        value={amountRange[1]}
                        onChange={(e) =>
                          setAmountRange([
                            amountRange[0],
                            Number(e.target.value),
                          ])
                        }
                        className="w-28"
                        placeholder="₱1,000,000"
                      />
                    </div>
                  </div>
                </div>
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-6"
                  value={amountRange}
                  onValueChange={handleAmountRangeChange}
                  min={0}
                  max={1000000}
                  step={1000}
                >
                  <Slider.Track className="bg-slate-200 relative flex-1 rounded-full h-2">
                    <Slider.Range className="absolute bg-gradient-to-r from-blue-500 to-purple-500 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-5 h-5 bg-blue-500 shadow-md rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    aria-label="Min amount"
                  />
                  <Slider.Thumb
                    className="block w-5 h-5 bg-blue-500 shadow-md rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    aria-label="Max amount"
                  />
                </Slider.Root>
                <div className="flex justify-between text-sm font-medium text-muted-foreground">
                  <span>₱{amountRange[0].toLocaleString()}</span>
                  <span>₱{amountRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
              <Button onClick={applyAdvancedFilters}>Apply Filters</Button>
            </div>
          </PopoverContent>
        </Popover>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" onClick={() => handleStatusChange("all")}>
              All
            </TabsTrigger>
            <TabsTrigger
              value="unverified"
              onClick={() => handleStatusChange("unverified")}
            >
              Unverified
            </TabsTrigger>
            <TabsTrigger
              value="verified"
              onClick={() => handleStatusChange("verified")}
            >
              Verified
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              onClick={() => handleStatusChange("approved")}
            >
              Approved
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              onClick={() => handleStatusChange("rejected")}
            >
              Rejected
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-2">
        {loading ? (
          <>
            {[...Array(6)].map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Skeleton className="h-4 w-[120px]" />
                  </CardTitle>
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-[100px] mb-2" />
                  <Skeleton className="h-4 w-[80px]" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Withdrawals
                </CardTitle>
                <PhilippinePeso className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalWithdrawCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Amount: ₱ {stats.totalWithdraw.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Fund Transfers
                </CardTitle>
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalFundTransferCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Amount: ₱ {stats.totalFundTransfer.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Bills Payment
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalBillPaymentCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Amount: ₱ {stats.totalFundTransfer.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash In</CardTitle>
                <PhilippinePeso className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalCashInCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Amount: ₱ {stats.totalCashInAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Transactions
                </CardTitle>
                <IconColumns className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalTransactionCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  All transaction types
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Passive Income
                </CardTitle>
                <IconColumns className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">30,678 credits</div>
                <p className="text-xs text-muted-foreground">
                  Today: 1,234 credits
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Global filter..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm mr-4"
        />

        <div className="flex-grow"></div>
        {(user?.role === "admin" || user?.role === "approver") && (
          <Dialog
            open={isApproveBatchDialogOpen}
            onOpenChange={setIsApproveBatchDialogOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setIsApproveBatchDialogOpen(true)}>
                Approve Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-full max-h-[calc(100vh-5rem)] overflow-scroll">
              <DialogTitle></DialogTitle>
              <ApproveBatchContent />
            </DialogContent>
          </Dialog>
        )}
        <Dialog>
          {isClient ? (
            <CSVLink data={data} filename="atm_transctions.csv">
              <Button className="ml-2" variant="outline">
                <IconDownload className="mr-2 h-4 w-4" />
                Export Template
              </Button>
            </CSVLink>
          ) : null}

          {user?.role === "admin" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-2">
                  <IconUserUp className="mr-2 h-4 w-4" />
                  Upload <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <IconUsersPlus />
                  <div className="ml-1">Single</div>
                </DropdownMenuItem>
                <DialogTrigger asChild>
                  <DropdownMenuItem className="cursor-pointer">
                    <IconFileTypeCsv />
                    <div className="ml-1">Import CSV</div>
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {user?.role === "uploader" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-2">
                  <IconUserUp className="mr-2 h-4 w-4" />
                  Upload <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <IconUsersPlus />
                  <div className="ml-1">Single</div>
                </DropdownMenuItem>
                <DialogTrigger asChild>
                  <DropdownMenuItem className="cursor-pointer">
                    <IconFileTypeCsv />
                    <div className="ml-1">Import CSV</div>
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DialogContent className="w-5/6 max-w-none overflow-y-auto lg:max-h-full">
            <DialogHeader>
              <DialogTitle></DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <AtmReportCreation onUploadComplete={handleRefresh} />
          </DialogContent>
        </Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="ml-2" variant="outline">
              <IconColumns className="mr-2 h-4 w-4" />
              Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border overflow-scroll no-scrollbar">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-center">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="cursor-pointer">
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
                  <Sheet key={row.id}>
                    <SheetTrigger asChild>
                      <motion.tr
                        key={row.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                        onClick={() => {
                          // Set the current voucher ID to the index of the clicked row
                          const rowIndex = data.findIndex(
                            (item) => item.ID === row.original.ID
                          );
                          setCurrentVoucherId(rowIndex);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="text-center">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </motion.tr>
                    </SheetTrigger>
                    <SheetContent
                      side="top"
                      className="w-5/6 border rounded-2xl h-full mx-auto p-6 bg-background text-foreground"
                    >
                      <div className="h-full">
                        <SheetHeader>
                          <SheetTitle>Transaction Details</SheetTitle>
                          <SheetDescription>
                            Check and validate your transaction details
                          </SheetDescription>
                          <Separator />
                        </SheetHeader>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentVoucherId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                            }}
                            className="mt-4"
                          >
                            {!ifEditing ? (
                              <ScrollArea className="h-[calc(100vh-8rem)]">
                                <div className="ml-6 mt-6 flex flex-row justify-between">
                                  <ATMDashboardPrint
                                    voucherData={data}
                                    currentVoucherId={currentVoucherId}
                                  />
                                  <div className="flex flex-row gap-2 mr-6">
                                    {/* Verifier can verify or reject unverified vouchers */}
                                    {(user?.role === "verifier" ||
                                      user?.role === "admin") &&
                                      data[currentVoucherId].status ===
                                        "unverified" && (
                                        <div className="flex flex-row gap-2">
                                          {/* Verify Dialog */}
                                          <Dialog
                                            open={isOpen}
                                            onOpenChange={(open) => {
                                              setIsOpen(open);
                                              if (!open) {
                                                setIsCheckLoading(false);
                                              }
                                            }}
                                          >
                                            <DialogTrigger asChild>
                                              <Button
                                                onClick={() => setIsOpen(true)}
                                                className="bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 text-blue-900"
                                              >
                                                Verify
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent
                                              className="max-w-md rounded-lg p-6 animate-fadeIn"
                                              style={{
                                                animationDuration: "300ms",
                                                animationTimingFunction:
                                                  "ease-out",
                                              }}
                                            >
                                              <DialogHeader>
                                                <DialogTitle className="text-xl font-semibold text-center">
                                                  Are you sure you want to
                                                  verify?
                                                </DialogTitle>
                                              </DialogHeader>
                                              <p className="text-center text-gray-600 mt-2">
                                                This action will mark the
                                                transaction as verified. Please
                                                confirm if you want to proceed.
                                              </p>
                                              <DialogFooter className="mt-4 flex justify-center space-x-4">
                                                <Button
                                                  className="bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 text-blue-900"
                                                  onClick={() =>
                                                    handleConfirmVerify(
                                                      data[currentVoucherId].ID,
                                                      "verified"
                                                    )
                                                  }
                                                  disabled={isCheckLoading}
                                                >
                                                  {isCheckLoading ? (
                                                    <>
                                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                      Verifying...
                                                    </>
                                                  ) : (
                                                    "Yes, Verify"
                                                  )}
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  onClick={() =>
                                                    setIsOpen(false)
                                                  }
                                                >
                                                  Cancel
                                                </Button>
                                              </DialogFooter>
                                            </DialogContent>
                                          </Dialog>

                                          {/* Reject Dialog - Only for verifiers */}
                                          {user?.role === "verifier" && (
                                            <Dialog
                                              open={isOpenReject}
                                              onOpenChange={(open) => {
                                                setIsOpenReject(open);
                                                if (!open) {
                                                  setIsCheckLoading(false);
                                                }
                                              }}
                                            >
                                              <DialogTrigger asChild>
                                                <Button
                                                  className="bg-gradient-to-r from-red-300 via-red-400 to-red-500 text-red-900"
                                                  onClick={() =>
                                                    setIsOpenReject(true)
                                                  }
                                                >
                                                  Reject
                                                </Button>
                                              </DialogTrigger>
                                              <DialogContent
                                                className="max-w-md rounded-lg p-6 animate-fadeIn"
                                                style={{
                                                  animationDuration: "300ms",
                                                  animationTimingFunction:
                                                    "ease-out",
                                                }}
                                              >
                                                <DialogHeader>
                                                  <DialogTitle className="text-xl font-semibold text-center">
                                                    Are you sure?
                                                  </DialogTitle>
                                                </DialogHeader>
                                                <p className="text-center text-gray-600 mt-2">
                                                  This action is irreversible.
                                                  Please confirm if you want to
                                                  proceed.
                                                </p>
                                                <DialogFooter className="mt-4 flex justify-center space-x-4">
                                                  <Button
                                                    className="bg-gradient-to-r from-red-300 via-red-400 to-red-500 text-red-900"
                                                    onClick={() =>
                                                      handleConfirmReject(
                                                        data[currentVoucherId]
                                                          .ID,
                                                        "rejected"
                                                      )
                                                    }
                                                    disabled={isCheckLoading}
                                                  >
                                                    {isCheckLoading ? (
                                                      <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Rejecting...
                                                      </>
                                                    ) : (
                                                      "Yes, Reject"
                                                    )}
                                                  </Button>
                                                  <Button
                                                    variant="outline"
                                                    onClick={handleCancel}
                                                  >
                                                    Cancel
                                                  </Button>
                                                </DialogFooter>
                                              </DialogContent>
                                            </Dialog>
                                          )}
                                        </div>
                                      )}

                                    {/* Admin can approve or reject verified vouchers */}
                                    {(user?.role === "approver" ||
                                      user?.role === "admin") &&
                                      data[currentVoucherId].status ===
                                        "verified" && (
                                        <div className="flex flex-row gap-2">
                                          {/* Approve Dialog */}
                                          <Dialog
                                            open={isOpen}
                                            onOpenChange={(open) => {
                                              setIsOpen(open);
                                              if (!open) {
                                                setIsCheckLoading(false);
                                              }
                                            }}
                                          >
                                            <DialogTrigger asChild>
                                              <Button
                                                onClick={() => setIsOpen(true)}
                                              >
                                                Approve
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent
                                              className="max-w-md rounded-lg p-6 animate-fadeIn"
                                              style={{
                                                animationDuration: "300ms",
                                                animationTimingFunction:
                                                  "ease-out",
                                              }}
                                            >
                                              <DialogHeader>
                                                <DialogTitle className="text-xl font-semibold text-center">
                                                  Are you sure?
                                                </DialogTitle>
                                              </DialogHeader>
                                              <p className="text-center text-gray-600 mt-2">
                                                This action is irreversible.
                                                Please confirm if you want to
                                                proceed.
                                              </p>
                                              <DialogFooter className="mt-4 flex justify-center space-x-4">
                                                <Button
                                                  onClick={() =>
                                                    handleConfirmApprove(
                                                      data[currentVoucherId].ID,
                                                      "approved"
                                                    )
                                                  }
                                                  disabled={isCheckLoading}
                                                >
                                                  {isCheckLoading ? (
                                                    <>
                                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                      Approving...
                                                    </>
                                                  ) : (
                                                    "Yes, Approve"
                                                  )}
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  onClick={handleCancel}
                                                >
                                                  Cancel
                                                </Button>
                                              </DialogFooter>
                                            </DialogContent>
                                          </Dialog>

                                          {/* Reject Dialog */}
                                          <Dialog
                                            open={isOpenReject}
                                            onOpenChange={(open) => {
                                              setIsOpenReject(open);
                                              if (!open) {
                                                setIsCheckLoading(false);
                                              }
                                            }}
                                          >
                                            <DialogTrigger asChild>
                                              <Button
                                                variant="destructive"
                                                onClick={() =>
                                                  setIsOpenReject(true)
                                                }
                                              >
                                                Reject
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent
                                              className="max-w-md rounded-lg p-6 animate-fadeIn"
                                              style={{
                                                animationDuration: "300ms",
                                                animationTimingFunction:
                                                  "ease-out",
                                              }}
                                            >
                                              <DialogHeader>
                                                <DialogTitle className="text-xl font-semibold text-center">
                                                  Are you sure?
                                                </DialogTitle>
                                              </DialogHeader>
                                              <p className="text-center text-gray-600 mt-2">
                                                This action is irreversible.
                                                Please confirm if you want to
                                                proceed.
                                              </p>
                                              <DialogFooter className="mt-4 flex justify-center space-x-4">
                                                <Button
                                                  variant="destructive"
                                                  onClick={() =>
                                                    handleConfirmReject(
                                                      data[currentVoucherId].ID,
                                                      "rejected"
                                                    )
                                                  }
                                                  disabled={isCheckLoading}
                                                >
                                                  {isCheckLoading ? (
                                                    <>
                                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                      Rejecting...
                                                    </>
                                                  ) : (
                                                    "Yes, Reject"
                                                  )}
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  onClick={handleCancel}
                                                >
                                                  Cancel
                                                </Button>
                                              </DialogFooter>
                                            </DialogContent>
                                          </Dialog>
                                        </div>
                                      )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
                                  <div className="space-y-8">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-xl font-semibold flex items-center">
                                          <CreditCard className="mr-2 h-5 w-5" />{" "}
                                          Transaction Details
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-2">
                                          <Detail
                                            title="Merchant ID"
                                            value={
                                              data[currentVoucherId].merchant_id
                                            }
                                          />
                                          <Detail
                                            title="Merchant Name"
                                            value={
                                              data[currentVoucherId]
                                                .merchant_name
                                            }
                                          />
                                          <Detail
                                            title="Transaction Date"
                                            value={new Date(
                                              data[
                                                currentVoucherId
                                              ].transaction_date
                                            ).toLocaleDateString("en-US", {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                            })}
                                          />
                                          <Detail
                                            title="Status"
                                            value={
                                              formatStatus(
                                                data[currentVoucherId].status
                                              ) || "Waiting"
                                            }
                                            isBadge
                                          />
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-xl font-semibold flex items-center">
                                          <ArrowUpDown className="mr-2 h-5 w-5" />{" "}
                                          Transaction Counts
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-2">
                                          <Detail
                                            title="Withdraw Count"
                                            value={
                                              data[currentVoucherId]
                                                .withdraw_count
                                            }
                                          />
                                          <Detail
                                            title="Fund Transfer Count"
                                            value={
                                              data[currentVoucherId]
                                                .fund_transfer_count
                                            }
                                          />
                                          <Detail
                                            title="Bills Payment Count"
                                            value={
                                              data[currentVoucherId]
                                                .bill_payment_count
                                            }
                                          />
                                          <Detail
                                            title="Cash In Count"
                                            value={
                                              data[currentVoucherId]
                                                .cash_in_count
                                            }
                                          />
                                          <Detail
                                            title="Balance Inquiry Count"
                                            value={
                                              data[currentVoucherId]
                                                .balance_inquiry_count
                                            }
                                          />
                                          <Separator className="my-2" />
                                          <Detail
                                            title="Total Transaction Count"
                                            value={
                                              data[currentVoucherId]
                                                .total_transaction_count
                                            }
                                          />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  <div className="space-y-8">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-xl font-semibold flex items-center">
                                          <PhilippinePeso className="mr-2 h-5 w-5" />{" "}
                                          Transaction Amounts
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-2">
                                          <Detail
                                            title="Withdraw Amount"
                                            value={Number(
                                              data[currentVoucherId]
                                                .withdraw_amount || 0
                                            )}
                                            isCurrency
                                          />
                                          <Detail
                                            title="Fund Transfer Amount"
                                            value={Number(
                                              data[currentVoucherId]
                                                .fund_transfer_amount || 0
                                            )}
                                            isCurrency
                                          />
                                          <Detail
                                            title="Bills Payment Amount"
                                            value={Number(
                                              data[currentVoucherId]
                                                .bill_payment_amount || 0
                                            )}
                                            isCurrency
                                          />
                                          <Detail
                                            title="Cash In Amount"
                                            value={Number(
                                              data[currentVoucherId]
                                                .cash_in_amount || 0
                                            )}
                                            isCurrency
                                          />
                                          <Detail
                                            title="Balance Inquiry Amount"
                                            value={Number(
                                              data[currentVoucherId]
                                                .balance_inquiry_amount || 0
                                            )}
                                            isCurrency
                                          />
                                          <Separator className="my-2" />
                                          <Detail
                                            title="Total Amount"
                                            value={Number(
                                              data[currentVoucherId]
                                                .total_amount || 0
                                            )}
                                            isCurrency
                                          />
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-xl font-semibold flex items-center">
                                          <PhilippinePeso className="mr-2 h-5 w-5" />{" "}
                                          Transaction Fees
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="spacey-2">
                                          <Detail
                                            title="Transaction Fee (RCBC)"
                                            value={Number(
                                              data[currentVoucherId]
                                                .transaction_fee_rcbc || 0
                                            )}
                                            isCurrency
                                          />
                                          <Detail
                                            title="Transaction Fee (Merchant)"
                                            value={Number(
                                              data[currentVoucherId]
                                                .transaction_fee_merchant || 0
                                            )}
                                            isCurrency
                                          />
                                          <Separator className="my-2" />
                                          <Detail
                                            title="Total Fees"
                                            value={
                                              Number(
                                                data[currentVoucherId]
                                                  .transaction_fee_rcbc || 0
                                              ) +
                                              Number(
                                                data[currentVoucherId]
                                                  .transaction_fee_merchant || 0
                                              )
                                            }
                                            isCurrency
                                          />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>
                              </ScrollArea>
                            ) : (
                              <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="merchant-id">
                                      Merchant ID
                                    </Label>
                                    <Input
                                      id="merchant-id"
                                      placeholder="Merchant ID"
                                      defaultValue={
                                        data[currentVoucherId].merchant_id
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="merchant-name">
                                      Merchant Name
                                    </Label>
                                    <Input
                                      id="merchant-name"
                                      placeholder="Merchant Name"
                                      defaultValue={
                                        data[currentVoucherId].merchant_name
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="transaction-date">
                                      Transaction Date
                                    </Label>
                                    <Input
                                      id="transaction-date"
                                      placeholder="Transaction Date"
                                      type="date"
                                      defaultValue={
                                        new Date(
                                          data[
                                            currentVoucherId
                                          ].transaction_date
                                        )
                                          .toISOString()
                                          .split("T")[0]
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="withdraw-count">
                                      Withdraw Count
                                    </Label>
                                    <Input
                                      id="withdraw-count"
                                      placeholder="Withdraw Count"
                                      type="number"
                                      defaultValue={
                                        data[currentVoucherId].withdraw_count
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="total-amount">
                                      Total Amount
                                    </Label>
                                    <Input
                                      id="total-amount"
                                      placeholder="Total Amount"
                                      type="number"
                                      defaultValue={
                                        data[currentVoucherId].total_amount
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="expiry-date">
                                      Expiry Date
                                    </Label>
                                    <Input
                                      id="expiry-date"
                                      placeholder="Expiry Date"
                                      type="date"
                                      defaultValue={
                                        data[currentVoucherId].expiry_date
                                          ? new Date(
                                              data[currentVoucherId].expiry_date
                                            )
                                              .toISOString()
                                              .split("T")[0]
                                          : ""
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="mt-6">
                                  <Button className="w-full">
                                    Save Changes
                                  </Button>
                                </div>
                                <div className="mt-6">
                                  <Button
                                    onClick={() => handleEdit()}
                                    className="w-full"
                                    variant={"destructive"}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </SheetContent>
                  </Sheet>
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
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {/* Modified to only show ending number of current page range */}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} row(s)
          {table.getFilteredSelectedRowModel().rows.length > 0 &&
            ` (${table.getFilteredSelectedRowModel().rows.length} selected)`}
        </div>
        <div className="space-x-2 flex flex-row items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            First Page
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="overflow-x-auto max-w-[500px] flex space-x-2">
            {Array.from(
              { length: table.getPageCount() },
              (_, index) => index + 1
            ).map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={
                  table.getState().pagination.pageIndex === pageNumber - 1
                    ? "ghost"
                    : "outline"
                }
                size="sm"
                onClick={() => table.setPageIndex(pageNumber - 1)}
                className="flex-shrink-10"
              >
                {pageNumber}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            Last Page
          </Button>
          <div className="max-w-[100px]">
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Select Row Count</SelectLabel>
                  {[10, 25, 50, 100, 250, 500].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

function DatePickerWithRange({
  className,
  date,
  onDateChange,
}: React.HTMLAttributes<HTMLDivElement> & {
  date: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const Detail: React.FC<any> = ({
  title,
  value,
  isCurrency = false,
  isBadge = false,
}) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-sm font-medium text-gray-500">{title}</span>
    {isBadge ? (
      <Badge variant={value === "Waiting" ? "secondary" : "default"}>
        {value}
      </Badge>
    ) : (
      <span className="text-sm font-semibold">
        {isCurrency
          ? `₱ ${Number(value || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : typeof value === "number"
          ? value.toLocaleString("en-US")
          : value}
      </span>
    )}
  </div>
);
