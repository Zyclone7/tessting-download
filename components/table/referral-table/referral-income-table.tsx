"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, parseISO, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpDown,
  CreditCard,
  Download,
  Filter,
  Users,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { getReferralIncomeHistory } from "@/actions/referral";
import { CSVLink } from "react-csv";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  type ReferralIncomeTransaction,
  User,
  InvitationCode,
} from "@/types/types";
import { StatCard } from "./stat-card";
import { ReferralIncomeChart } from "./referral-income-chart";
import { TransactionDetails } from "./transaction-details";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

export default function ReferralIncomeHistoryTable() {
  const [isClient, setIsClient] = useState(false);
  const [data, setData] = useState<ReferralIncomeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "id", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [activeFilters, setActiveFilters] = useState<{
    dateRange: boolean;
    incomeRange: boolean;
    package: boolean;
  }>({
    dateRange: false,
    incomeRange: false,
    package: false,
  });

  const [incomeRange, setIncomeRange] = useState<{
    min: number | undefined;
    max: number | undefined;
  }>({
    min: undefined,
    max: undefined,
  });

  const [selectedPackage, setSelectedPackage] = useState<string | undefined>();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchData();
    }
  }, [isClient, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result: any = await getReferralIncomeHistory();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "An error occurred while fetching data");
        toast({
          title: "Error",
          description: result.error || "An error occurred while fetching data",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("An error occurred while fetching data");
      toast({
        title: "Error",
        description: "An error occurred while fetching data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<ReferralIncomeTransaction>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              ID
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
      },
      {
        accessorKey: "sender",
        header: "Sender",
        cell: ({ row }) => (
          <div>{row.original.sender?.user_nicename || "N/A"}</div>
        ),
      },
      {
        accessorKey: "recipient",
        header: "Recipient",
        cell: ({ row }) => (
          <div>{row.original.recipient?.user_nicename || "N/A"}</div>
        ),
      },
      {
        accessorKey: "income_amount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = Number.parseFloat(row.getValue("income_amount"));
          const formatted = new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(amount);
          return <div className="font-medium">{formatted}</div>;
        },
      },
      {
        accessorKey: "level",
        header: "Level",
        cell: ({ row }) => <div>{row.getValue("level") || "N/A"}</div>,
      },
      {
        accessorKey: "invitation_code",
        header: "Invitation Code Package",
        cell: ({ row }) => {
          const invitationCode = row.original.invitation_code;
          let packageName = "N/A";
          let badgeGradient = "";
          if (invitationCode) {
            switch (invitationCode.package) {
              case "Elite_Plus_Distributor_Package":
                packageName = "Elite Plus Distributor";
                badgeGradient =
                  "from-rose-500 to-rose-700 bg-gradient-to-r via-rose-600";
                break;
              case "Elite_Distributor_Package":
                packageName = "Elite Distributor";
                badgeGradient =
                  "from-green-500 to-green-700 bg-gradient-to-r via-green-600";
                break;
              case "Basic_Merchant_Package":
                packageName = "Basic Merchant";
                badgeGradient =
                  "from-amber-500 to-amber-700 bg-gradient-to-r via-amber-600";
                break;
              case "Premium_Merchant_Package":
                packageName = "Premium Merchant";
                badgeGradient =
                  "from-blue-500 to-blue-700 bg-gradient-to-r via-blue-600";
                break;
              default:
                packageName = invitationCode.package;
            }
          }
          return (
            <div>
              <Badge className={`text-sm font-medium ${badgeGradient}`}>
                {packageName} ({invitationCode ? invitationCode.code : "N/A"})
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = new Date(row.getValue("created_at"));
          return isNaN(date.getTime()) ? "Invalid date" : format(date, "PPP");
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const transaction = row.original;
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
                    navigator.clipboard.writeText(transaction.id.toString())
                  }
                >
                  Copy transaction ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View transaction details</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  const applyFilters = (data: ReferralIncomeTransaction[]) => {
    let filteredData = [...data];

    // Date range filter
    if (activeFilters.dateRange) {
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.created_at);
        return itemDate >= dateRange.from && itemDate <= dateRange.to;
      });
    }

    // Income range filter
    if (activeFilters.incomeRange) {
      filteredData = filteredData.filter((item) => {
        const amount = Number(item.income_amount);
        const meetsMin = !incomeRange.min || amount >= incomeRange.min;
        const meetsMax = !incomeRange.max || amount <= incomeRange.max;
        return meetsMin && meetsMax;
      });
    }

    // Package filter
    if (activeFilters.package && selectedPackage) {
      filteredData = filteredData.filter(
        (item) => item.invitation_code?.package === selectedPackage
      );
    }

    return filteredData;
  };

  const filteredData = useMemo(
    () => applyFilters(data),
    [data, activeFilters, dateRange, incomeRange, selectedPackage]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  if (!isClient) {
    return null;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-4">{error}</div>;
  }

  const totalIncome = data.reduce(
    (sum, transaction) =>
      sum + (Number.parseFloat(transaction.income_amount) || 0),
    0
  );
  const averageIncome = data.length > 0 ? totalIncome / data.length : 0;
  const totalTransactions = data.length;
  const highestIncome =
    data.length > 0
      ? Math.max(
          ...data.map(
            (transaction) => Number.parseFloat(transaction.income_amount) || 0
          )
        )
      : 0;
  const lowestIncome =
    data.length > 0
      ? Math.min(
          ...data.map(
            (transaction) => Number.parseFloat(transaction.income_amount) || 0
          )
        )
      : 0;

  const chartData = data
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((transaction) => ({
      date: format(new Date(transaction.created_at), "MMM dd"),
      amount: Number.parseFloat(transaction.income_amount) || 0,
    }));

  return (
    <div className="w-full space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          title="Total Referral Income"
          value={new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(totalIncome)}
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          description="Total income from all referrals"
        />
        <StatCard
          title="Average Referral Income"
          value={new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(averageIncome)}
          icon={<ArrowRightIcon className="h-4 w-4 text-muted-foreground" />}
          description="Average income per referral"
        />
        <StatCard
          title="Highest Referral Income"
          value={new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(highestIncome)}
          icon={<ArrowUpIcon className="h-4 w-4 text-muted-foreground" />}
          description="Highest single referral income"
        />
        <StatCard
          title="Lowest Referral Income"
          value={new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(lowestIncome)}
          icon={<ArrowDownIcon className="h-4 w-4 text-muted-foreground" />}
          description="Lowest single referral income"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ReferralIncomeChart data={chartData} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Input
            placeholder="Filter transactions..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium leading-none">Date Range</h4>
                    <Switch
                      checked={activeFilters.dateRange}
                      onCheckedChange={(checked) =>
                        setActiveFilters((prev) => ({
                          ...prev,
                          dateRange: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="from">From</Label>
                      <Input
                        id="from"
                        className="col-span-2 h-8"
                        type="date"
                        value={format(dateRange.from, "yyyy-MM-dd")}
                        onChange={(e) =>
                          setDateRange((prev) => ({
                            ...prev,
                            from: parseISO(e.target.value),
                          }))
                        }
                        disabled={!activeFilters.dateRange}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="to">To</Label>
                      <Input
                        id="to"
                        className="col-span-2 h-8"
                        type="date"
                        value={format(dateRange.to, "yyyy-MM-dd")}
                        onChange={(e) =>
                          setDateRange((prev) => ({
                            ...prev,
                            to: parseISO(e.target.value),
                          }))
                        }
                        disabled={!activeFilters.dateRange}
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium leading-none">Income Range</h4>
                    <Switch
                      checked={activeFilters.incomeRange}
                      onCheckedChange={(checked) =>
                        setActiveFilters((prev) => ({
                          ...prev,
                          incomeRange: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="min-income">Min</Label>
                      <Input
                        id="min-income"
                        className="col-span-2 h-8"
                        type="number"
                        placeholder="Minimum income"
                        value={incomeRange.min || ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? Number(e.target.value)
                            : undefined;
                          setIncomeRange((prev) => ({ ...prev, min: value }));
                        }}
                        disabled={!activeFilters.incomeRange}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="max-income">Max</Label>
                      <Input
                        id="max-income"
                        className="col-span-2 h-8"
                        type="number"
                        placeholder="Maximum income"
                        value={incomeRange.max || ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? Number(e.target.value)
                            : undefined;
                          setIncomeRange((prev) => ({ ...prev, max: value }));
                        }}
                        disabled={!activeFilters.incomeRange}
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium leading-none">Package Type</h4>
                    <Switch
                      checked={activeFilters.package}
                      onCheckedChange={(checked) =>
                        setActiveFilters((prev) => ({
                          ...prev,
                          package: checked,
                        }))
                      }
                    />
                  </div>
                  <Select
                    value={selectedPackage}
                    onValueChange={(value) => setSelectedPackage(value)}
                    disabled={!activeFilters.package}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select package type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic_Merchant_Package">
                        Basic Merchant
                      </SelectItem>
                      <SelectItem value="Premium_Merchant_Package">
                        Premium Merchant
                      </SelectItem>
                      <SelectItem value="Elite_Distributor_Package">
                        Elite Distributor
                      </SelectItem>
                      <SelectItem value="Elite_Plus_Distributor_Package">
                        Elite Plus Distributor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveFilters({
                      dateRange: false,
                      incomeRange: false,
                      package: false,
                    });
                    setIncomeRange({ min: undefined, max: undefined });
                    setSelectedPackage(undefined);
                    setDateRange({
                      from: subDays(new Date(), 30),
                      to: new Date(),
                    });
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          {Object.entries(activeFilters).some(([_, value]) => value) && (
            <div className="flex gap-2 flex-wrap">
              {activeFilters.dateRange && (
                <Badge variant="secondary" className="h-7">
                  Date: {format(dateRange.from, "MMM d")} -{" "}
                  {format(dateRange.to, "MMM d")}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2"
                    onClick={() =>
                      setActiveFilters((prev) => ({
                        ...prev,
                        dateRange: false,
                      }))
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {activeFilters.incomeRange && (
                <Badge variant="secondary" className="h-7">
                  Income: {incomeRange.min || "0"} - {incomeRange.max || "∞"}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2"
                    onClick={() =>
                      setActiveFilters((prev) => ({
                        ...prev,
                        incomeRange: false,
                      }))
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {activeFilters.package && selectedPackage && (
                <Badge variant="secondary" className="h-7">
                  Package: {selectedPackage.replace(/_/g, " ")}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2"
                    onClick={() =>
                      setActiveFilters((prev) => ({ ...prev, package: false }))
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
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
          <Button variant="outline" className="w-full sm:w-auto">
            <CSVLink
              data={data}
              filename={`referral_income_history_${format(
                new Date(),
                "yyyy-MM-dd"
              )}.csv`}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </CSVLink>
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={fetchData}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-md border"
      >
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
                  <Dialog key={row.id}>
                    <DialogTrigger asChild>
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="cursor-pointer">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </motion.tr>
                    </DialogTrigger>
                    <DialogContent className="max-w-7xl w-full h-auto max-h-[80vh] overflow-y-auto p-6">
                      <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                        <DialogDescription>
                          View details of the selected transaction.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <TransactionDetails transaction={row.original} />
                      </div>
                    </DialogContent>
                  </Dialog>
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
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="flex items-center justify-between space-x-2 py-4"
      >
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
