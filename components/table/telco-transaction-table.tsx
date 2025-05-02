"use client";

import { useEffect, useState } from "react";
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
import {
  ChevronDown,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTelcoByUserId } from "@/actions/telco";
import { useUserContext } from "@/hooks/use-user";

// Updated interface to match the server response
interface TelcoTransaction {
  id: number;
  user_id: number;
  transaction_reference: string | null;
  provider_name: string | null;
  promo_name: string | null;
  promo_description: string | null;
  amount: number;
  service_fee: number | null;
  provider_discount: number | null;
  subtotal: number | null;
  total: number | null;
  recipient: string | null;
  validity: string | null;
  payment_method: string | null;
  status: string | null;
  response_message: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  // Add any other fields that are in your API response but missing here
  error_message?: string | null; // Using optional property with the server field name
}

interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const TelcoTransactionsTable = () => {
  const [transactions, setTransactions] = useState<TelcoTransaction[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true }, // Default sorting by created_at in descending order
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Hide some columns by default for better mobile view
    service_fee: false,
    provider_discount: false,
    subtotal: false,
    transaction_reference: false,
    updated_at: false,
    response_message: false,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const { user } = useUserContext();

  // Function to fetch transactions with pagination
  const fetchTransactions = async (page = 1, limit = 10) => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getTelcoByUserId(user.id.toString(), page, limit);

      if (response.success && response.data) {
        // Map the server response to our interface
        const mappedTransactions: TelcoTransaction[] = response.data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          transaction_reference: item.transaction_reference || null,
          provider_name: item.provider_name || null,
          promo_name: item.promo_name || null,
          promo_description: item.promo_description || null,
          amount: Number(item.amount) || 0,
          service_fee: item.service_fee ? Number(item.service_fee) : null,
          provider_discount: item.provider_discount ? Number(item.provider_discount) : null,
          subtotal: item.subtotal ? Number(item.subtotal) : null,
          total: item.total ? Number(item.total) : null,
          recipient: item.recipient || null,
          validity: item.validity || null,
          payment_method: item.payment_method || null,
          status: item.status || null,
          response_message: item.response_message || item.error_message || null,
          created_at: item.created_at ? new Date(item.created_at) : null,
          updated_at: item.updated_at ? new Date(item.updated_at) : null,
          error_message: item.error_message || null,
        }));
        
        setTransactions(mappedTransactions);
        
        if (response.metadata) {
          setPagination(response.metadata);
        }
      } else {
        setError(response.message || "Failed to fetch telco transactions.");
        console.error("Error from server action:", response.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchTransactions(pagination.page, pagination.limit);
  }, [user?.id]);

  // Function to format currency
  const formatCurrency = (amount: number | null): string => {
    if (amount === null || isNaN(Number(amount))) return "₱0.00";
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(Number(amount));
  };

  // Define columns
  const columns: ColumnDef<TelcoTransaction>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
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
      accessorKey: "transaction_reference",
      header: "Reference",
      cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("transaction_reference") || "N/A"}</div>,
    },
    {
      accessorKey: "provider_name",
      header: "Provider",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue("provider_name") || "Unknown"}
        </Badge>
      ),
    },
    {
      accessorKey: "promo_name",
      header: "Promo",
      cell: ({ row }) => <div>{row.getValue("promo_name") || "Regular Load"}</div>,
    },
    {
      accessorKey: "recipient",
      header: "Recipient",
      cell: ({ row }) => <div className="font-mono">{row.getValue("recipient") || "N/A"}</div>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <div className="text-right">{formatCurrency(row.getValue("amount"))}</div>,
    },
    {
      accessorKey: "service_fee",
      header: "Service Fee",
      cell: ({ row }) => <div className="text-right">{formatCurrency(row.getValue("service_fee"))}</div>,
    },
    {
      accessorKey: "provider_discount",
      header: "Discount",
      cell: ({ row }) => <div className="text-right">{formatCurrency(row.getValue("provider_discount"))}</div>,
    },
    {
      accessorKey: "subtotal",
      header: "Subtotal",
      cell: ({ row }) => <div className="text-right">{formatCurrency(row.getValue("subtotal"))}</div>,
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.getValue("total"))}</div>,
    },
    {
      accessorKey: "payment_method",
      header: "Payment",
      cell: ({ row }) => (
        <Badge variant={row.getValue("payment_method") === "credits" ? "secondary" : "outline"} className="capitalize">
          {row.getValue("payment_method") || "Unknown"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string | null;
        let variant: "outline" | "destructive" | "default" | "secondary" = "outline";
        if (status === "success") variant = "default";
        if (status === "failed") variant = "destructive";
        if (status === "pending") variant = "secondary";
        
        return <Badge variant={variant} className="capitalize">{status || "Unknown"}</Badge>;
      },
    },
    {
      accessorKey: "response_message",
      header: "Message",
      cell: ({ row }) => {
        // Show either response_message or error_message
        const message = row.getValue("response_message") as string || row.original.error_message;
        return <div className="text-sm truncate max-w-[200px]" title={message || ""}>{message || "N/A"}</div>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as Date | null;
        return <div>{date ? new Date(date).toLocaleString() : "N/A"}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(transaction.id.toString())}
              >
                Copy Transaction ID
              </DropdownMenuItem>
              {transaction.transaction_reference && (
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(transaction.transaction_reference || "")}
                >
                  Copy Reference
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>View Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Set up the table
  const table = useReactTable({
    data: transactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true, // We're handling pagination manually
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // CSV export functionality removed

  // Skeleton row component
  const SkeletonRow = () => (
    <TableRow>
      {columns.map((_, index) => (
        <TableCell key={index}>
          <Skeleton className="h-6 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 py-4">
        <Input
          placeholder="Filter by reference..."
          value={(table.getColumn("transaction_reference")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("transaction_reference")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
              {loading ? (
                // Show skeleton rows while loading
                Array.from({ length: pagination.limit }).map((_, index) => (
                  <SkeletonRow key={index} />
                ))
              ) : transactions.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow 
                    key={row.id} 
                    data-state={row.getIsSelected() ? "selected" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {error ? (
                      <div className="text-red-500">{error}</div>
                    ) : (
                      "No transactions found."
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Custom Pagination Controls */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {pagination.total} transaction(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => {
                fetchTransactions(1, parseInt(value, 10));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pagination.limit.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => fetchTransactions(1, pagination.limit)}
              disabled={!pagination.hasPrevPage}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => fetchTransactions(pagination.page - 1, pagination.limit)}
              disabled={!pagination.hasPrevPage}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => fetchTransactions(pagination.page + 1, pagination.limit)}
              disabled={!pagination.hasNextPage}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => fetchTransactions(pagination.totalPages, pagination.limit)}
              disabled={!pagination.hasNextPage}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelcoTransactionsTable;