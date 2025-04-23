"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  ChevronRight,
  Store,
  Users,
  ChevronLeft,
  ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Search,
  X,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  CalendarIcon,
} from "lucide-react";
import { getOrganizationMembers } from "@/actions/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";

// Types
interface Member {
  ID: number;
  user_nicename: string;
  user_email: string;
  user_role: string | null;
  merchant_id: string | null;
  business_name: string | null;
  user_registered: Date | null;
  user_status: number;
  level: number;
  latestTransaction?: {
    approved_date: Date | null;
  };
}

interface OrganizationResponse {
  success: boolean;
  data?: Member[];
  error?: string;
}

// Sorting type
type SortField =
  | "user_nicename"
  | "user_role"
  | "user_email"
  | "business_name"
  | "merchant_id"
  | "user_registered";
type SortDirection = "asc" | "desc";

interface SortState {
  field: SortField;
  direction: SortDirection;
}

// Transaction filter type
type TransactionStatusFilter = "all" | "with-transactions" | "no-transactions";
type TransactionTimeFilter =
  | "any-time"
  | "last-7-days"
  | "last-15-days"
  | "last-30-days"
  | "older-than-30-days"
  | "custom-range";

// Pagination component
interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="text-sm text-gray-600">
        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
        entries
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page number buttons */}
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;

            if (totalPages <= 5) {
              // If we have 5 or fewer pages, show all pages
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              // If we're near the start
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // If we're near the end
              pageNum = totalPages - 4 + i;
            } else {
              // We're in the middle
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Utility functions
function getMemberTypeCount(members: Member[]) {
  return members.reduce(
    (acc, member) => {
      if (member.user_role?.includes("Merchant")) {
        acc.merchants++;
      } else if (member.user_role?.includes("Distributor")) {
        acc.distributors++;
      }
      return acc;
    },
    { merchants: 0, distributors: 0 }
  );
}

function groupMembersByLevel(members: Member[]) {
  return members.reduce((acc, member) => {
    const level = member.level;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(member);
    return acc;
  }, {} as Record<number, Member[]>);
}

function formatDate(date: Date | null) {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, yyyy");
}

// Update the getTimeSince function to provide more detailed time information
function getTimeSince(date: Date | null): string {
  if (!date) return "N/A";

  const now = new Date();
  const pastDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

  // Convert to various time units
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInMonths / 12);

  // Format the time difference in a detailed way
  if (diffInYears > 0) {
    const remainingMonths = diffInMonths % 12;
    if (remainingMonths > 0) {
      return `${diffInYears} year${diffInYears > 1 ? "s" : ""
        }, ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
    }
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""}`;
  }

  if (diffInMonths > 0) {
    const remainingDays = diffInDays % 30;
    if (remainingDays > 0) {
      return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""
        }, ${remainingDays} day${remainingDays > 1 ? "s" : ""}`;
    }
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""}`;
  }

  if (diffInDays > 0) {
    const remainingHours = diffInHours % 24;
    if (remainingHours > 0) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""
        }, ${remainingHours} hour${remainingHours > 1 ? "s" : ""}`;
    }
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""}`;
  }

  if (diffInHours > 0) {
    const remainingMinutes = diffInMinutes % 60;
    if (remainingMinutes > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""
        }, ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}`;
    }
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""}`;
  }

  if (diffInMinutes > 0) {
    const remainingSeconds = diffInSeconds % 60;
    if (remainingSeconds > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""
        }, ${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`;
    }
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""}`;
  }

  return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""}`;
}

// Get days since transaction
function getDaysSinceTransaction(date: Date | null): number {
  if (!date) return Number.POSITIVE_INFINITY;

  const now = new Date();
  const pastDate = new Date(date);
  const diffInMs = now.getTime() - pastDate.getTime();
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

// Check if transaction date is within custom date range
function isWithinDateRange(
  date: Date | null,
  dateRange: DateRange | undefined
): boolean {
  if (!date || !dateRange || !dateRange.from) return false;

  const transactionDate = new Date(date);
  const from = new Date(dateRange.from);
  from.setHours(0, 0, 0, 0);

  if (dateRange.to) {
    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);
    return transactionDate >= from && transactionDate <= to;
  }

  // If only "from" date is selected, match that exact day
  const fromEnd = new Date(from);
  fromEnd.setHours(23, 59, 59, 999);
  return transactionDate >= from && transactionDate <= fromEnd;
}

// Sort function
function sortMembers(members: Member[], sortState: SortState): Member[] {
  return [...members].sort((a, b) => {
    const { field, direction } = sortState;
    const multiplier = direction === "asc" ? 1 : -1;

    // Special case for sorting by latest transaction date
    if (field === "user_registered" && sortState.direction === "desc") {
      // First try to sort by transaction date
      const transactionDateA = a.latestTransaction?.approved_date
        ? new Date(a.latestTransaction.approved_date).getTime()
        : a.user_registered
          ? new Date(a.user_registered as Date).getTime()
          : 0;

      const transactionDateB = b.latestTransaction?.approved_date
        ? new Date(b.latestTransaction.approved_date).getTime()
        : b.user_registered
          ? new Date(b.user_registered as Date).getTime()
          : 0;

      return transactionDateB - transactionDateA;
    }

    if (field === "user_registered") {
      const dateA = a[field] ? new Date(a[field] as Date).getTime() : 0;
      const dateB = b[field] ? new Date(b[field] as Date).getTime() : 0;
      return (dateA - dateB) * multiplier;
    }

    const valueA = (a[field] || "").toString().toLowerCase();
    const valueB = (b[field] || "").toString().toLowerCase();

    if (valueA < valueB) return -1 * multiplier;
    if (valueA > valueB) return 1 * multiplier;
    return 0;
  });
}

// Filter functions
const filterMerchants = (members: Member[]) =>
  members.filter((member) => member.user_role?.includes("Merchant"));

const filterDistributors = (members: Member[]) =>
  members.filter((member) => member.user_role?.includes("Distributor"));

// Filter active users (user_status !== 0)
const filterActiveUsers = (members: Member[]) =>
  members.filter((member) => member.user_status !== 0);

// Filter by transaction status
const filterByTransactionStatus = (
  members: Member[],
  filter: TransactionStatusFilter
) => {
  if (filter === "all") return members;

  if (filter === "with-transactions") {
    return members.filter(
      (member) => member.merchant_id && member.latestTransaction?.approved_date
    );
  }

  if (filter === "no-transactions") {
    return members.filter((member) => !member.latestTransaction?.approved_date);
  }

  return members;
};

// Filter by transaction time
const filterByTransactionTime = (
  members: Member[],
  timeFilter: TransactionTimeFilter,
  dateRange: DateRange | undefined
) => {
  if (timeFilter === "any-time" && !dateRange) return members;

  if (dateRange && dateRange.from) {
    return members.filter(
      (member) =>
        member.latestTransaction?.approved_date &&
        isWithinDateRange(member.latestTransaction.approved_date, dateRange)
    );
  }

  if (timeFilter === "last-7-days") {
    return members.filter(
      (member) =>
        member.latestTransaction?.approved_date &&
        getDaysSinceTransaction(member.latestTransaction.approved_date) <= 7
    );
  }

  if (timeFilter === "last-15-days") {
    return members.filter(
      (member) =>
        member.latestTransaction?.approved_date &&
        getDaysSinceTransaction(member.latestTransaction.approved_date) <= 15 &&
        getDaysSinceTransaction(member.latestTransaction.approved_date) > 7
    );
  }

  if (timeFilter === "last-30-days") {
    return members.filter(
      (member) =>
        member.latestTransaction?.approved_date &&
        getDaysSinceTransaction(member.latestTransaction.approved_date) <= 30 &&
        getDaysSinceTransaction(member.latestTransaction.approved_date) > 15
    );
  }

  if (timeFilter === "older-than-30-days") {
    return members.filter(
      (member) =>
        member.latestTransaction?.approved_date &&
        getDaysSinceTransaction(member.latestTransaction.approved_date) > 30
    );
  }

  return members;
};

// Search function
const searchMembers = (members: Member[], searchTerm: string) => {
  if (!searchTerm.trim()) return members;

  const term = searchTerm.toLowerCase().trim();
  return members.filter(
    (member) =>
      (member.user_nicename &&
        member.user_nicename.toLowerCase().includes(term)) ||
      (member.user_email && member.user_email.toLowerCase().includes(term)) ||
      (member.business_name &&
        member.business_name.toLowerCase().includes(term)) ||
      (member.merchant_id && member.merchant_id.toLowerCase().includes(term)) ||
      (member.user_role && member.user_role.toLowerCase().includes(term))
  );
};

// Pagination function
function paginateData<T>(data: T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return data.slice(start, end);
}

// Sort Header Component
interface SortHeaderProps {
  label: string;
  field: SortField;
  currentSort: SortState;
  onSort: (field: SortField) => void;
}

function SortHeader({ label, field, currentSort, onSort }: SortHeaderProps) {
  return (
    <TableHead className="cursor-pointer" onClick={() => onSort(field)}>
      <div className="flex items-center">
        {label}
        <span className="ml-1">
          {currentSort.field === field ? (
            currentSort.direction === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-50" />
          )}
        </span>
      </div>
    </TableHead>
  );
}

// Components
function GenerationStats({
  members,
  level,
}: {
  members: Member[];
  level: number;
}) {
  const { merchants, distributors } = getMemberTypeCount(members);

  return (
    <motion.div
      className="flex items-center gap-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="font-semibold">Generation {level}</span>
      <div className="flex items-center gap-4 text-sm">
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
        >
          <Store className="h-4 w-4 text-blue-500" />
          <span>{merchants} Merchants</span>
        </motion.div>
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
        >
          <Users className="h-4 w-4 text-green-500" />
          <span>{distributors} Distributors</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Search component
function SearchBar({
  searchTerm,
  setSearchTerm,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        type="text"
        placeholder="Search members..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-9 pr-9"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Date Range Picker Component
function DateRangePicker({
  dateRange,
  setDateRange,
  isOpen,
  setIsOpen,
}: {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const quickSelectOptions = [
    { label: "Today", action: () => setQuickRange(0) },
    { label: "Yesterday", action: () => setQuickRange(1) },
    { label: "Last 7 days", action: () => setQuickRange(6) },
    { label: "Last 14 days", action: () => setQuickRange(13) },
    { label: "Last 30 days", action: () => setQuickRange(29) },
  ];

  function setQuickRange(daysAgo: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - daysAgo);
    setDateRange({ from: start, to: end });
    setSelectedOption(
      quickSelectOptions.find((o) => o.action === setQuickRange)?.label || null
    );
  }

  return (
    <div className="w-full max-w-md">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={`w-full justify-start text-left font-normal ${!dateRange ? "text-gray-500" : ""
              }`}
          >
            <CalendarIcon className="mr-2 h-5 w-5" />
            {dateRange?.from ? (
              dateRange.to ? (
                `${format(dateRange.from, "MMM d, yyyy")} - ${format(
                  dateRange.to,
                  "MMM d, yyyy"
                )}`
              ) : (
                format(dateRange.from, "MMM d, yyyy")
              )
            ) : (
              <span>Select transaction date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border border-border" align="end">
          <div className="flex flex-row min-w-[320px] max-w-sm">

            {/* Calendar Section */}
            <div className="flex-1 border-r border-border bg-background rounded-l-xl overflow-hidden">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                className="p-4"
              />

              {/* Sticky Button Footer */}
              <div className="sticky bottom-0 bg-background border-t border-border flex gap-2 p-3">
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => {
                    setDateRange(undefined)
                    setSelectedOption(null)
                    setIsOpen(false)
                  }}
                >
                  Clear
                </Button>
                <Button className="w-full" onClick={() => setIsOpen(false)}>
                  Apply
                </Button>
              </div>
            </div>

            {/* Quick Select Section */}
            <div className="w-[150px] bg-muted/20 p-3 rounded-r-xl grid gap-2">
              {quickSelectOptions.map((option) => (
                <Button
                  key={option.label}
                  variant={selectedOption === option.label ? "default" : "ghost"}
                  className="w-full justify-start text-sm"
                  onClick={() => option.action()}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>

      </Popover>
    </div>
  );
}

// Export to CSV function
function exportToCSV(members: Member[], filename: string) {
  // Define CSV headers
  const headers = [
    "Name",
    "Role",
    "Email",
    "Business",
    "Merchant ID",
    "Joined",
    "Last Transaction Date",
    "Time Since Last Transaction",
  ];

  // Convert members to CSV rows
  const rows = members.map((member) => [
    member.user_nicename || "",
    member.user_role || "",
    member.user_email || "",
    member.business_name || "",
    member.merchant_id || "",
    member.user_registered ? formatDate(member.user_registered) : "",
    member.latestTransaction?.approved_date
      ? formatDate(member.latestTransaction.approved_date)
      : "",
    member.latestTransaction?.approved_date
      ? getTimeSince(member.latestTransaction.approved_date)
      : "No transactions",
  ]);

  // Combine headers and rows
  const csvContent =
    headers.join(",") +
    "\n" +
    rows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

  // Create a Blob and download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function OrganizationList({ userId }: { userId: number }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [membersByLevel, setMembersByLevel] = useState<
    Record<number, Member[]>
  >({});
  const [expandedLevels, setExpandedLevels] = useState<number[]>([]);
  const [paginationState, setPaginationState] = useState<
    Record<string, number>
  >({});
  const [sortState, setSortState] = useState<Record<string, SortState>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionStatusFilter, setTransactionStatusFilter] =
    useState<TransactionStatusFilter>("all");
  const [transactionTimeFilter, setTransactionTimeFilter] =
    useState<TransactionTimeFilter>("any-time");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [itemsPerPageOption, setItemsPerPageOption] = useState(5);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Function to fetch members data
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = (await getOrganizationMembers(userId)) as any;
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch members");
      }

      // Filter out users with user_status of 0
      const activeMembers = filterActiveUsers(response.data);
      console.log(activeMembers);

      // Sort data by user_registered desc by default before grouping
      const sortedData = sortMembers(activeMembers, {
        field: "user_registered",
        direction: "desc",
      });
      setMembersByLevel(groupMembersByLevel(sortedData));

      // Initialize default sort state for all tabs
      const initialSortState: Record<string, SortState> = {};
      const levels = Array.from(
        new Set(sortedData.map((member) => member.level))
      );

      levels.forEach((level) => {
        initialSortState[`${level}-all`] = {
          field: "user_registered",
          direction: "desc",
        };
        initialSortState[`${level}-merchants`] = {
          field: "user_registered",
          direction: "desc",
        };
        initialSortState[`${level}-distributors`] = {
          field: "user_registered",
          direction: "desc",
        };
      });

      setSortState(initialSortState);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [userId]);

  // Auto-refresh effect
  useEffect(() => {
    let intervalId: any;

    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchMembers();
      }, 60000); // Refresh every minute
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, userId]);

  // Handle date range changes
  useEffect(() => {
    if (dateRange && dateRange.from) {
      setTransactionTimeFilter("custom-range");
    }
  }, [dateRange]);

  // Remove the useEffect for handling time filter changes since we're not using the dropdown anymore

  const toggleLevel = (level: number) => {
    setExpandedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handlePageChange = (level: number, tab: string, page: number) => {
    setPaginationState((prev) => ({
      ...prev,
      [`${level}-${tab}`]: page,
    }));
  };

  const getCurrentPage = (level: number, tab: string) => {
    return paginationState[`${level}-${tab}`] || 1;
  };

  const getCurrentSort = (level: number, tab: string): SortState => {
    return (
      sortState[`${level}-${tab}`] || {
        field: "user_registered",
        direction: "desc",
      }
    );
  };

  const handleSort = (level: number, tab: string, field: SortField) => {
    setSortState((prev) => {
      const currentSort = prev[`${level}-${tab}`] || {
        field: "user_registered",
        direction: "desc",
      };
      const newDirection =
        currentSort.field === field && currentSort.direction === "asc"
          ? "desc"
          : "asc";

      return {
        ...prev,
        [`${level}-${tab}`]: { field, direction: newDirection },
      };
    });

    // Reset to first page when sorting changes
    handlePageChange(level, tab, 1);
  };

  // Reset pagination when search or filter changes
  useEffect(() => {
    const newPaginationState: Record<string, number> = {};
    Object.keys(paginationState).forEach((key) => {
      newPaginationState[key] = 1;
    });
    setPaginationState(newPaginationState);

    // Update active filters
    const newActiveFilters: string[] = [];
    if (searchTerm) newActiveFilters.push(`Search: "${searchTerm}"`);

    if (transactionStatusFilter !== "all") {
      let statusLabel = "";
      switch (transactionStatusFilter) {
        case "with-transactions":
          statusLabel = "Has Transactions";
          break;
        case "no-transactions":
          statusLabel = "No Transactions";
          break;
      }
      newActiveFilters.push(statusLabel);
    }

    if (transactionTimeFilter !== "any-time") {
      let timeLabel = "";
      switch (transactionTimeFilter) {
        case "last-7-days":
          timeLabel = "Last 7 Days";
          break;
        case "last-15-days":
          timeLabel = "8-15 Days Ago";
          break;
        case "last-30-days":
          timeLabel = "16-30 Days Ago";
          break;
        case "older-than-30-days":
          timeLabel = "Older than 30 Days";
          break;
        case "custom-range":
          if (dateRange?.from) {
            timeLabel = dateRange.to
              ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(
                dateRange.to,
                "MMM d, yyyy"
              )}`
              : `From "MMM d, yyyy")}`;
          } else {
            timeLabel = "Custom Date Range";
          }
          break;
      }
      if (timeLabel) newActiveFilters.push(timeLabel);
    }

    setActiveFilters(newActiveFilters);
  }, [searchTerm, transactionStatusFilter, transactionTimeFilter, dateRange]);

  // Function to expand all levels
  const expandAllLevels = () => {
    const allLevels = Object.keys(membersByLevel).map(Number);
    setExpandedLevels(allLevels);
  };

  // Function to collapse all levels
  const collapseAllLevels = () => {
    setExpandedLevels([]);
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setTransactionStatusFilter("all");
    setTransactionTimeFilter("any-time");
    setDateRange(undefined);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <Skeleton className="h-20 w-full" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  // Check if there are no members
  if (Object.keys(membersByLevel).length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6 text-center"
      >
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No organization members found.</AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  // Apply filters to members
  const applyFilters = (members: Member[]) => {
    // First apply transaction status filter
    const statusFiltered = filterByTransactionStatus(
      members,
      transactionStatusFilter
    );

    // Then apply time filter if applicable
    const timeFiltered = filterByTransactionTime(
      statusFiltered,
      transactionTimeFilter,
      dateRange
    );

    // Finally apply search filter
    return searchMembers(timeFiltered, searchTerm);
  };

  // Calculate total members for export
  const allMembers = Object.values(membersByLevel).flat();
  const filteredMembers = applyFilters(allMembers);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 h-full"
    >
      {/* Top controls bar */}
      <div className="flex flex-col gap-4">
        {/* Search, filter, and action buttons */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-2">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchMembers}
                    className="h-10 w-10"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh Data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => exportToCSV(filteredMembers, "all-members")}
                >
                  Export All Filtered Members
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {Object.entries(membersByLevel).map(([level, members]) => {
                  const numericLevel = Number.parseInt(level);
                  const filteredLevelMembers = applyFilters(members);

                  if (filteredLevelMembers.length === 0) return null;

                  return (
                    <DropdownMenuItem
                      key={level}
                      onClick={() =>
                        exportToCSV(filteredLevelMembers, `generation-${level}`)
                      }
                    >
                      Export Generation {level} ({filteredLevelMembers.length})
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10">
                  Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={expandAllLevels}>
                  Expand All Levels
                </DropdownMenuItem>
                <DropdownMenuItem onClick={collapseAllLevels}>
                  Collapse All Levels
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearAllFilters}>
                  Clear All Filters
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-refresh"
                      checked={autoRefresh}
                      onCheckedChange={setAutoRefresh}
                    />
                    <Label htmlFor="auto-refresh">Auto-refresh (1 min)</Label>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="items-per-page">Items per page</Label>
                    <DropdownMenuRadioGroup
                      value={itemsPerPageOption.toString()}
                      onValueChange={(value) =>
                        setItemsPerPageOption(Number.parseInt(value))
                      }
                    >
                      <DropdownMenuRadioItem value="5">5</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="10">
                        10
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="20">
                        20
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="50">
                        50
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Transaction filter tabs and date range */}
        <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
          <div className="w-full sm:w-auto">
            <Tabs
              defaultValue="all"
              value={transactionStatusFilter}
              onValueChange={(value) =>
                setTransactionStatusFilter(value as TransactionStatusFilter)
              }
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                <TabsTrigger value="all">All Members</TabsTrigger>
                <TabsTrigger
                  value="with-transactions"
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  With Transactions
                </TabsTrigger>
                <TabsTrigger
                  value="no-transactions"
                  className="flex items-center gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  No Transactions
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="w-full sm:w-auto max-w-md">
            <DateRangePicker
              dateRange={dateRange}
              setDateRange={setDateRange}
              isOpen={datePickerOpen}
              setIsOpen={setDatePickerOpen}
            />
          </div>
        </div>

        {/* Active filters and status bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-500">
          <div className="flex flex-wrap gap-2 items-center">
            {activeFilters.length > 0 ? (
              <>
                <span>Active filters:</span>
                {activeFilters.map((filter, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="font-normal"
                  >
                    {filter}
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 px-2 text-xs"
                >
                  Clear all
                </Button>
              </>
            ) : (
              <span>No active filters</span>
            )}
          </div>
          <div className="mt-2 sm:mt-0 flex items-center gap-2">
            <span>Last updated: {lastRefreshed.toLocaleTimeString()}</span>
            {autoRefresh && (
              <Badge variant="outline" className="animate-pulse">
                Auto-refresh on
              </Badge>
            )}
          </div>
        </div>
      </div>

      {Object.entries(membersByLevel).map(([level, members]) => {
        const numericLevel = Number.parseInt(level);

        // Apply all filters
        const filteredMembers = applyFilters(members);

        // If no members match the filters, skip this level
        if (filteredMembers.length === 0) {
          return null;
        }

        const merchants = filterMerchants(filteredMembers);
        const distributors = filterDistributors(filteredMembers);

        // Get current pages
        const allCurrentPage = getCurrentPage(numericLevel, "all");
        const merchantsCurrentPage = getCurrentPage(numericLevel, "merchants");
        const distributorsCurrentPage = getCurrentPage(
          numericLevel,
          "distributors"
        );

        // Get current sort states
        const allSortState = getCurrentSort(numericLevel, "all");
        const merchantsSortState = getCurrentSort(numericLevel, "merchants");
        const distributorsSortState = getCurrentSort(
          numericLevel,
          "distributors"
        );

        // Apply sorting
        const sortedMembers = sortMembers(filteredMembers, allSortState);
        const sortedMerchants = sortMembers(merchants, merchantsSortState);
        const sortedDistributors = sortMembers(
          distributors,
          distributorsSortState
        );

        // Paginate data
        const paginatedAll = paginateData(
          sortedMembers,
          allCurrentPage,
          itemsPerPageOption
        );
        const paginatedMerchants = paginateData(
          sortedMerchants,
          merchantsCurrentPage,
          itemsPerPageOption
        );
        const paginatedDistributors = paginateData(
          sortedDistributors,
          distributorsCurrentPage,
          itemsPerPageOption
        );

        return (
          <motion.div
            key={level}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border rounded-lg overflow-hidden"
          >
            <motion.div
              className="p-4 bg-gray-50 cursor-pointer"
              onClick={() => toggleLevel(numericLevel)}
              whileHover={{ backgroundColor: "#f3f4f6" }}
            >
              <div className="flex items-center justify-between">
                <GenerationStats
                  members={filteredMembers}
                  level={numericLevel}
                />
                <motion.div
                  animate={{
                    rotate: expandedLevels.includes(numericLevel) ? 90 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-5 w-5" />
                </motion.div>
              </div>
            </motion.div>
            <AnimatePresence>
              {expandedLevels.includes(numericLevel) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Tabs defaultValue="all" className="w-full">
                    <div className="px-4 py-2 bg-gray-50 border-t border-b">
                      <TabsList className="grid grid-cols-3 w-64">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger
                          value="distributors"
                          className="flex items-center gap-1"
                        >
                          <Users className="h-3 w-3" />
                          Distributors
                        </TabsTrigger>
                        <TabsTrigger
                          value="merchants"
                          className="flex items-center gap-1"
                        >
                          <Store className="h-3 w-3" />
                          Merchants
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* All Members View */}
                    <TabsContent value="all">
                      {paginatedAll.length > 0 ? (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <SortHeader
                                  label="Name"
                                  field="user_nicename"
                                  currentSort={allSortState}
                                  onSort={(field) =>
                                    handleSort(numericLevel, "all", field)
                                  }
                                />
                                <SortHeader
                                  label="Role"
                                  field="user_role"
                                  currentSort={allSortState}
                                  onSort={(field) =>
                                    handleSort(numericLevel, "all", field)
                                  }
                                />
                                <SortHeader
                                  label="Email"
                                  field="user_email"
                                  currentSort={allSortState}
                                  onSort={(field) =>
                                    handleSort(numericLevel, "all", field)
                                  }
                                />
                                <SortHeader
                                  label="Business"
                                  field="business_name"
                                  currentSort={allSortState}
                                  onSort={(field) =>
                                    handleSort(numericLevel, "all", field)
                                  }
                                />
                                <SortHeader
                                  label="Merchant ID"
                                  field="merchant_id"
                                  currentSort={allSortState}
                                  onSort={(field) =>
                                    handleSort(numericLevel, "all", field)
                                  }
                                />
                                <SortHeader
                                  label="Joined"
                                  field="user_registered"
                                  currentSort={allSortState}
                                  onSort={(field) =>
                                    handleSort(numericLevel, "all", field)
                                  }
                                />
                                <TableHead>Last Transaction Date</TableHead>
                                <TableHead>Last Transaction</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <AnimatePresence>
                                {paginatedAll.map((member, index) => (
                                  <TableRow
                                    key={member.ID}
                                    className="animate-fade-in"
                                    style={{
                                      animationDelay: `${index * 50}ms`,
                                    }}
                                  >
                                    <TableCell className="whitespace-nowrap">
                                      {member.user_nicename}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      <span
                                        className={
                                          member.user_role?.includes("Merchant")
                                            ? "text-blue-500"
                                            : "text-green-500"
                                        }
                                      >
                                        {member.user_role ===
                                          "Basic_Merchant_Package" &&
                                          "Basic Merchant"}
                                        {member.user_role ===
                                          "Premium_Merchant_Package" &&
                                          "Premium Merchant"}
                                        {member.user_role ===
                                          "Elite_Distributor_Package" &&
                                          "Elite Distributor"}
                                        {member.user_role ===
                                          "Elite_Plus_Distributor_Package" &&
                                          "Elite Plus Distributor"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {member.user_email}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {member.business_name || "N/A"}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {member.merchant_id || "N/A"}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {formatDate(member.user_registered)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {member.merchant_id &&
                                        member.latestTransaction?.approved_date
                                        ? formatDate(
                                          member.latestTransaction
                                            .approved_date
                                        )
                                        : formatDate(member.user_registered)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {member.merchant_id &&
                                        member.latestTransaction
                                          ?.approved_date ? (
                                        <span className="text-xs font-medium text-green-600">
                                          {getTimeSince(
                                            member.latestTransaction
                                              .approved_date
                                          )}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-gray-500">
                                          {getTimeSince(member.user_registered)}
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </AnimatePresence>
                            </TableBody>
                          </Table>
                          <Pagination
                            totalItems={sortedMembers.length}
                            itemsPerPage={itemsPerPageOption}
                            currentPage={allCurrentPage}
                            onPageChange={(page) =>
                              handlePageChange(numericLevel, "all", page)
                            }
                          />
                        </>
                      ) : (
                        <div className="p-6 text-center text-gray-500 italic">
                          No members found in this generation
                        </div>
                      )}
                    </TabsContent>

                    {/* Distributors View */}
                    <TabsContent value="distributors">
                      {paginatedDistributors.length > 0 ? (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <SortHeader
                                  label="Name"
                                  field="user_nicename"
                                  currentSort={distributorsSortState}
                                  onSort={(field) =>
                                    handleSort(
                                      numericLevel,
                                      "distributors",
                                      field
                                    )
                                  }
                                />
                                <SortHeader
                                  label="Role"
                                  field="user_role"
                                  currentSort={distributorsSortState}
                                  onSort={(field) =>
                                    handleSort(
                                      numericLevel,
                                      "distributors",
                                      field
                                    )
                                  }
                                />
                                <SortHeader
                                  label="Email"
                                  field="user_email"
                                  currentSort={distributorsSortState}
                                  onSort={(field) =>
                                    handleSort(
                                      numericLevel,
                                      "distributors",
                                      field
                                    )
                                  }
                                />
                                <SortHeader
                                  label="Business"
                                  field="business_name"
                                  currentSort={distributorsSortState}
                                  onSort={(field) =>
                                    handleSort(
                                      numericLevel,
                                      "distributors",
                                      field
                                    )
                                  }
                                />
                                <SortHeader
                                  label="Joined"
                                  field="user_registered"
                                  currentSort={distributorsSortState}
                                  onSort={(field) =>
                                    handleSort(
                                      numericLevel,
                                      "distributors",
                                      field
                                    )
                                  }
                                />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <AnimatePresence>
                                {paginatedDistributors.map((member, index) => (
                                  <TableRow
                                    key={member.ID}
                                    className="animate-fade-in"
                                    style={{
                                      animationDelay: `${index * 50}ms`,
                                    }}
                                  >
                                    <TableCell className="whitespace-nowrap">
                                      {member.user_nicename}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      <span className="text-green-500">
                                        {member.user_role ===
                                          "Elite_Distributor_Package" &&
                                          "Elite Distributor"}
                                        {member.user_role ===
                                          "Elite_Distributor_Plus_Package" &&
                                          "Elite Plus Distributor"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {member.user_email}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {member.business_name || "N/A"}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {formatDate(member.user_registered)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </AnimatePresence>
                            </TableBody>
                          </Table>
                          <Pagination
                            totalItems={sortedDistributors.length}
                            itemsPerPage={itemsPerPageOption}
                            currentPage={distributorsCurrentPage}
                            onPageChange={(page) =>
                              handlePageChange(
                                numericLevel,
                                "distributors",
                                page
                              )
                            }
                          />
                        </>
                      ) : (
                        <div className="p-6 text-center text-gray-500 italic">
                          No distributors found in this generation
                        </div>
                      )}
                    </TabsContent>

                    {/* Merchants View */}
                    <TabsContent value="merchants">
                      {paginatedMerchants.length > 0 ? (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <SortHeader
                                  label="Name"
                                  field="user_nicename"
                                  currentSort={merchantsSortState}
                                  onSort={(field) =>
                                    handleSort(numericLevel, "merchants", field)
                                  }
                                />
                                <SortHeader
                                  label="Role"
                                  field="user_role"
                                  currentSort={merchantsSortState}
                                  onSort={(field) =>
                                    handleSort(numericLevel, "merchants", field)
                                  }
                                />
                                <SortHeader
                                  label="Email"
                                  field="user_email"
                                  currentSort={merchantsSortState}
                                  onSort={(field) =>
                                    handleSort(numericLevel, "merchants", field)
                                  }
                                />
                                <SortHeader
                                  label="Business"
                                  field="business_name"
                                  currentSort={merchantsSortState}
                                  onSort={(field) =>
                                    handleSort(numericLevel, "merchants", field)
                                  }
                                />
                                <SortHeader
                                  label="Merchant ID"
                                  field="merchant_id"
                                  currentSort={merchantsSortState}
                                  onSort={(field) =>
                                    handleSort(numericLevel, "merchants", field)
                                  }
                                />
                                <SortHeader
                                  label="Joined"
                                  field="user_registered"
                                  currentSort={merchantsSortState}
                                  onSort={(field) =>
                                    handleSort(numericLevel, "merchants", field)
                                  }
                                />
                                <TableHead>Last Transaction Date</TableHead>
                                <TableHead>Last Transaction</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <AnimatePresence>
                                {paginatedMerchants.map((member, index) => (
                                  <TableRow
                                    key={member.ID}
                                    className="animate-fade-in"
                                    style={{
                                      animationDelay: `${index * 50}ms`,
                                    }}
                                  >
                                    <TableCell className="whitespace-nowrap">
                                      {member.user_nicename}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      <span className="text-blue-500">
                                        {member.user_role ===
                                          "Basic_Merchant_Package" &&
                                          "Basic Merchant"}
                                        {member.user_role ===
                                          "Premium_Merchant_Package" &&
                                          "Premium Merchant"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {member.user_email}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {member.business_name || "N/A"}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {member.merchant_id || "N/A"}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {formatDate(member.user_registered)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {member.merchant_id &&
                                        member.latestTransaction?.approved_date
                                        ? formatDate(
                                          member.latestTransaction
                                            .approved_date
                                        )
                                        : formatDate(member.user_registered)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {member.merchant_id &&
                                        member.latestTransaction
                                          ?.approved_date ? (
                                        <span className="text-xs font-medium text-green-600">
                                          {getTimeSince(
                                            member.latestTransaction
                                              .approved_date
                                          )}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-gray-500">
                                          {getTimeSince(member.user_registered)}
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </AnimatePresence>
                            </TableBody>
                          </Table>
                          <Pagination
                            totalItems={sortedMerchants.length}
                            itemsPerPage={itemsPerPageOption}
                            currentPage={merchantsCurrentPage}
                            onPageChange={(page) =>
                              handlePageChange(numericLevel, "merchants", page)
                            }
                          />
                        </>
                      ) : (
                        <div className="p-6 text-center text-gray-500 italic">
                          No merchants found in this generation
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Show message when no results match filters */}
      {Object.entries(membersByLevel).every(
        ([_, members]) => applyFilters(members).length === 0
      ) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 text-center"
          >
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No members match your search or filter criteria. Try adjusting
                your filters.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

      {/* Add styles for animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </motion.div>
  );
}
