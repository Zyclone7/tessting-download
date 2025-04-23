"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  IconUsersGroup,
  IconHours24,
  IconDoorExit,
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Filter,
  CalendarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAllWifiVouchers } from "@/actions/wifi";
import WifiVoucherCreation from "./wifi-creation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// In WifiTable.tsx, update the Voucher type
export type Voucher = {
  wifi_voucher_id: number;
  code: string | null;
  surfing: number | null;
  amount: number;
  validity_days: number;
  duration: string | null; // Changed from string to string | null
  validity_text: string | null;
  status: string | null;
  note: string | null;
  voucher_created_at: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  owned_by: string | null;
};

interface Props {
  setViewVoucher: any;
}

function StatCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-[100px]" />
          </CardTitle>
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-[100px]" />
          <Skeleton className="h-4 w-[70px] mt-1" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TableRowSkeleton() {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
    >
      {Array.from({ length: 10 }).map((_, index) => (
        <TableCell key={index}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </motion.tr>
  );
}

export default function WifiTable({ setViewVoucher }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [voucherData, setVoucherData] = useState<Voucher[]>([]);
  const [currentVoucher, setCurrentVoucher] = useState<Voucher | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [productCodeFilter, setProductCodeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await getAllWifiVouchers();
        setVoucherData(response.vouchers);
      } catch (error) {
        console.error("Error fetching WIFI vouchers:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const fuzzyFilter = (row: any, columnId: any, value: any) => {
    const itemValue = row.getValue(columnId);
    return (
      typeof itemValue === "string" &&
      itemValue.toLowerCase().includes(value.toLowerCase())
    );
  };

  const handleRowClick = (voucher: Voucher) => {
    setCurrentVoucher(voucher);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<Voucher>[] = [ 
    {
      accessorKey: "wifi_voucher_id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Voucher ID
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("wifi_voucher_id")}</div>
      ),
      filterFn: fuzzyFilter,
    },
    {
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Voucher Code
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("code")}</div>
      ),
      filterFn: fuzzyFilter,
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
      cell: ({ row }) => (
        <Badge
          className={cn(
            "mt-2",
            row.getValue("status") === "used" && "bg-green-500",
            row.getValue("status") === "expired" && "bg-red-500",
            row.getValue("status") === "null" && "bg-yellow-500"
          )}
        >
          {(row.getValue("status") as string) === "null"
            ? "Unused"
            : (row.getValue("status") as string).charAt(0).toUpperCase() +
              (row.getValue("status") as string).slice(1)}
        </Badge>
      ),
    },
        {
      accessorKey: "created_at",
      header: () => <div className="text-right font-medium">Created at</div>,
      cell: ({ row }) => {
        const date: Date | null = row.getValue("created_at");
        return (
          <div className="text-right font-medium">
            {date ? format(date, "MMM d, yyyy") : "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "owned_by",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Owned By
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("owned_by") || "N/A"}</div>
      ),
      filterFn: fuzzyFilter,
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
                  navigator.clipboard.writeText(
                    voucher.wifi_voucher_id.toString()
                  )
                }
              >
                Copy Voucher ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleRowClick(voucher)}>
                View voucher details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: voucherData,
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

  const downloadCSV = () => {
    // Convert data to CSV format
    let csvContent = "wifi_voucher_id,code,amount,surfing,validity_days,duration,status,note,created_at,updated_at,owned_by\n";
    
    voucherData.forEach((voucher) => {
      const row = [
        voucher.wifi_voucher_id,
        voucher.code,
        voucher.amount,
        voucher.surfing,
        voucher.validity_days,
        voucher.duration,
        voucher.status,
        voucher.note,
        voucher.created_at ? new Date(voucher.created_at).toLocaleDateString() : "",
        voucher.updated_at ? new Date(voucher.updated_at).toLocaleDateString() : "",
        voucher.owned_by
      ];
      
      // Escape fields that might contain commas
      const escapedRow = row.map(field => {
        if (field === null || field === undefined) return '';
        const str = String(field);
        return str.includes(',') ? `"${str}"` : str;
      });
      
      csvContent += escapedRow.join(',') + '\n';
    });
  
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "vouchers.csv");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  // Animation variants for list items
  const listVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
    exit: { opacity: 0, y: -20 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full items-center justify-center"
    >
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        initial="hidden"
        animate="visible"
      >
        {isLoading ? (
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Income
                  </CardTitle>
                  <IconUsersGroup className="stroke-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    Php{" "}
                    {voucherData
                      .filter((voucher) => voucher.status === "used")
                      .reduce((sum, voucher) => sum + voucher.amount, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From {voucherData.length} vouchers
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Wifi Vouchers
                  </CardTitle>
                  <IconUsersGroup className="stroke-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{voucherData.length}</div>
                  <p className="text-xs text-muted-foreground">All vouchers</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Used
                  </CardTitle>
                  <IconHours24 className="stroke-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {
                      voucherData.filter((voucher) => voucher.status === "used")
                        .length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Used vouchers</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Unused
                  </CardTitle>
                  <IconDoorExit className="stroke-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {
                      voucherData.filter((voucher) => voucher.status === "null")
                        .length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available vouchers
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <Link href="/dashboard/wifi-voucher/transaction-history">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Transaction History
                    </CardTitle>
                    <IconDoorExit className="stroke-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {
                        voucherData.filter(
                          (voucher) => voucher.status === "used"
                        ).length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Used voucher transactions
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          </>
        )}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center py-4"
      >
        <Input
          placeholder="Filter vouchers..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex-grow"></div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="ml-2">
              <Filter className="mr-2 h-4 w-4" />
              Advanced Filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Product Code</h4>
                <Select
                  value={productCodeFilter}
                  onValueChange={(value) => {
                    setProductCodeFilter(value);
                    setColumnFilters((prev) => [
                      ...prev.filter((filter) => filter.id !== "product_code"),
                      ...(value !== "all"
                        ? [{ id: "product_code", value }]
                        : []),
                    ]);
                  }}
                > 
                </Select>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Status</h4>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setColumnFilters((prev) => [
                      ...prev.filter((filter) => filter.id !== "status"),
                      ...(value !== "all" ? [{ id: "status", value }] : []),
                    ]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="null">Unused</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Date Range</h4>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
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
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(range) =>
                          setDateRange({ from: range?.from, to: range?.to })
                        }
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Dialog>
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
          <DialogContent className="w-3/4 max-w-none">
          <DialogTitle></DialogTitle>
            <WifiVoucherCreation />
          </DialogContent>
        </Dialog>
        <Button className="ml-2" variant="outline" onClick={downloadCSV}>
          <IconDownload className="mr-2 h-4 w-4" />
          Export Template
        </Button>
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
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-md border h-[calc(100vh-28rem)] overflow-auto no-scrollbar"
      >
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
          <TableBody>
            <AnimatePresence>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRowSkeleton key={index} />
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={index}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      "data-[state=selected]:bg-muted relative overflow-hidden",
                      "group"
                    )}
                    onClick={() => handleRowClick(row.original)}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="text-center group-hover:text-primary transition-colors"
                      >
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-end space-x-2 py-4"
      >
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2 flex flex-row items-center">
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
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Voucher Details</DialogTitle>
          </DialogHeader>
          {currentVoucher && (
            <div className="flex flex-row gap-8 items-start justify-center">
              <div className="w-full max-w-xl mt-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-primary">
                          Product Code
                        </h3>
                        <p className="text-sm font-medium">
                          {currentVoucher.code}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-primary">
                            Amount
                          </h3>
                          <p className="text-sm font-medium">
                            ₱{currentVoucher.amount.toFixed(2)}
                          </p>{" "}
                        </div>
                      
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-primary">
                          Owned By
                        </h3>
                        <p className="text-sm font-medium">
                          {currentVoucher.owned_by || "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2 p-6 pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              <Separator
                orientation="vertical"
                className="mt-8 h-auto border-l"
              />
              <div className="w-full max-w-xl mt-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">
                          Status
                        </h3>
                        <Badge
                          className={cn(
                            currentVoucher.status === "used" && "bg-green-500",
                            currentVoucher.status === "expired" && "bg-red-500",
                            currentVoucher.status === "null" && "bg-yellow-500"
                          )}
                        >
                          {currentVoucher.status === "null"
                            ? "Unused"
                            : currentVoucher.status
                            ? currentVoucher.status.charAt(0).toUpperCase() +
                              currentVoucher.status.slice(1)
                            : "N/A"}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-primary">
                          Created Date
                        </h3>
                        <p className="text-sm font-medium">
                          {currentVoucher.created_at
                            ? new Date(
                                currentVoucher.created_at
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-primary">
                          Used By
                        </h3>
                        <p className="text-sm font-medium">
                          {currentVoucher.owned_by || "N/A"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-primary">
                          Sold By
                        </h3>
                        <p className="text-sm font-medium">N/A</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}