"use client";

import type React from "react";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { pdf } from "@react-pdf/renderer";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  FileDown,
  Filter,
  Search,
  X,
  Plane,
  CreditCard,
  FileText,
  Loader2,
} from "lucide-react";

// UI Components
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

// Table imports
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

// Actions and utilities
import { getBookingHistoryByUserId, getAirportById } from "@/actions/booking";
import { useUserContext } from "@/hooks/use-user";
import { formatNumber } from "@/lib/utils";
import ItineraryDocument from "@/components/itinerary_document";

interface UserBookingHistory {
  uid: number;
  reference_no: string | null;
  title: string | null;
  last_name: string | null;
  first_name: string | null;
  middle_name: string | null;
  pnr: string | null;
  email_merchant: string | null;
  email_client: string | null;
  contact_number_merchant: string | null;
  proof_of_booking_url: string | null;
  purchase_price: string | null;
  selling_price: string | null;
  amount_paid: string | null;
  payment_method: string | null;
  proof_of_payment_url: string | null;
  type_of_travel: string | null;
  date_booked_request: string | null;
  status: string | null;
  date_generated_rejected: string | null;
  reason_of_rejected: string | null;
  departure_airport_id: string | null;
  destination_airport_id: string | null;
  return_departure_airport_id: string | null;
  return_destination_airport_id: string | null;
  travel_agency_name: string | null;
  travel_agency_address: string | null;
  airbus_details_depart: string | null;
  airbus_details_return: string | null;
  flight_class_depart: string | null;
  flight_class_return: string | null;
  departure_date: string | null;
  destination_date: string | null;
  return_departure_date: string | null;
  return_destination_date: string | null;
  baggage_kilogram: string | null;
}

interface Airport {
  id: number;
  name: string;
  code: string;
  location: string;
}

interface AirportData {
  departure?: Airport;
  destination?: Airport;
  returnDeparture?: Airport;
  returnDestination?: Airport;
}

const BookingHistory = ({ onClose }: { onClose: () => void }) => {
  const [vouchers, setVouchers] = useState<UserBookingHistory[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentVoucherId, setCurrentVoucherId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { user } = useUserContext();

  // Fetch booking history data
  useEffect(() => {
    const fetchVouchers = async () => {
      if (!user?.id) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response: any = await getBookingHistoryByUserId(
          user.id.toString()
        );

        if (response.success && response.data) {
          setVouchers(response.data);
        } else {
          setError(response.message || "Failed to fetch vouchers.");
          console.error("Error from server action:", response.message);
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [user?.id]);

  // Status options for filtering
  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    vouchers.forEach((voucher) => {
      if (voucher.status) {
        statuses.add(voucher.status);
      }
    });
    return Array.from(statuses);
  }, [vouchers]);

  // Table columns definition
  const columns: ColumnDef<UserBookingHistory>[] = [
    {
      accessorKey: "reference_no",
      header: "Reference No.",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("reference_no")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          {`${row.original.title || ""} ${row.original.first_name || ""} ${
            row.original.middle_name ? ` ${row.original.middle_name}` : ""
          } ${row.original.last_name || ""}`.trim()}
        </div>
      ),
    },
    {
      accessorKey: "pnr",
      header: "PNR",
      cell: ({ row }) => <div>{row.getValue("pnr")}</div>,
    },
    {
      accessorKey: "airbus_details_depart",
      header: "Airbus Details",
      cell: ({ row }) => (
        <div>{row.getValue("airbus_details_depart") || "N/A"}</div>
      ),
    },
    {
      accessorKey: "type_of_travel",
      header: "Type of Travel",
      cell: ({ row }) => (
        <div>{formatTypeOfTravel(row.getValue("type_of_travel"))}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={
              status === "Generated"
                ? "default"
                : status === "Rejected"
                ? "destructive"
                : status === "Pending"
                ? "outline"
                : "secondary"
            }
          >
            {status || "N/A"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "date_booked_request",
      header: "Date Booked",
      cell: ({ row }) => {
        const date = row.getValue("date_booked_request");
        return (
          <div>
            {date ? format(new Date(date as string), "MMM d, yyyy") : "N/A"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const booking = row.original;
        const isDownloading = downloadingId === booking.pnr;
        const canDownload = booking.status === "Generated";

        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(booking.pnr || "");
                    }}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!canDownload || isDownloading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(booking);
                    }}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {canDownload
                    ? "Download Itinerary"
                    : "Itinerary not available"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  // Handle row click to open details dialog
  const handleRowClick = (pnr: string) => {
    setCurrentVoucherId(pnr);
    setIsDialogOpen(true);
  };

  // Initialize table
  const table = useReactTable({
    data: vouchers,
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
    },
  });

  // Apply global search filter
  useEffect(() => {
    if (searchTerm) {
      table.setGlobalFilter(searchTerm);
    } else {
      table.resetGlobalFilter();
    }
  }, [searchTerm, table]);

  // Apply status filter
  useEffect(() => {
    if (statusFilter) {
      table.getColumn("status")?.setFilterValue(statusFilter);
    } else {
      table.getColumn("status")?.setFilterValue(undefined);
    }
  }, [statusFilter, table]);

  // Export to CSV function
  const exportToCSV = () => {
    // Show a progress indicator
    setDownloadProgress(0);

    // Get selected rows or all rows if none selected
    const rowsToExport =
      table.getFilteredSelectedRowModel().rows.length > 0
        ? table.getFilteredSelectedRowModel().rows
        : table.getFilteredRowModel().rows;

    // Create headers
    const visibleColumns = table.getVisibleLeafColumns();
    const headers = visibleColumns
      .filter((column) => column.id !== "select" && column.id !== "actions")
      .map((column) => {
        if (column.columnDef.header) {
          return typeof column.columnDef.header === "string"
            ? column.columnDef.header
            : column.id;
        }
        return column.id;
      })
      .join(",");

    // Create CSV data
    const csvData = rowsToExport
      .map((row, rowIndex) => {
        // Update progress
        setDownloadProgress(Math.round((rowIndex / rowsToExport.length) * 50));

        return visibleColumns
          .filter((column) => column.id !== "select" && column.id !== "actions")
          .map((column) => {
            let value: any;

            if (column.id === "name") {
              const booking = row.original;
              value = `${booking.title || ""} ${booking.first_name || ""} ${
                booking.middle_name ? ` ${booking.middle_name}` : ""
              } ${booking.last_name || ""}`.trim();
            } else if (column.id) {
              value = row.getValue(column.id);
            } else {
              value = "";
            }

            // Format date values
            if (column.id === "date_booked_request" && value) {
              value = format(new Date(value), "yyyy-MM-dd");
            }

            // Escape commas in values
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",");
      })
      .join("\n");

    // Combine headers and data
    const csvContent = `${headers}\n${csvData}`;

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    setDownloadProgress(75);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `booking_history_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);

    setTimeout(() => {
      link.click();
      document.body.removeChild(link);
      setDownloadProgress(100);

      // Reset progress after a delay
      setTimeout(() => setDownloadProgress(null), 1000);
    }, 500);
  };

  // Handle itinerary download
  const handleDownload = async (voucher: UserBookingHistory) => {
    if (!voucher.pnr) return;

    setDownloadingId(voucher.pnr);
    setDownloadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev === null) return 10;
          return Math.min(prev + 10, 90);
        });
      }, 300);

      const { success, url } = await generateItineraryPDF(voucher);

      clearInterval(progressInterval);
      setDownloadProgress(95);

      if (success && url) {
        const filename = voucher.first_name
          ? `${voucher.first_name}_${voucher.last_name}_itinerary.pdf`
          : `booking_${voucher.reference_no || voucher.pnr}.pdf`;

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);

        setTimeout(() => {
          link.click();
          document.body.removeChild(link);
          setDownloadProgress(100);

          // Reset after a delay
          setTimeout(() => {
            setDownloadProgress(null);
            setDownloadingId(null);
          }, 1000);
        }, 500);
      } else {
        console.error("Failed to generate PDF");
        setDownloadProgress(null);
        setDownloadingId(null);
      }
    } catch (error) {
      console.error("Error downloading itinerary:", error);
      setDownloadProgress(null);
      setDownloadingId(null);
    }
  };

  // Skeleton row for loading state
  const SkeletonRow = () => (
    <TableRow>
      {columns.map((_, index) => (
        <TableCell key={index}>
          <Skeleton className="h-6 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );

  // Format type of travel string
  function formatTypeOfTravel(type: any): string {
    if (!type) return "N/A";
    return type
      .split("-")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Get current booking details
  const currentBooking = useMemo(() => {
    return vouchers.find((v) => v.pnr === currentVoucherId);
  }, [vouchers, currentVoucherId]);

  return (
    <div className="w-full space-y-4">
      {/* Header with close button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Booking History</h2>
          <p className="text-muted-foreground">
            View and manage your travel bookings
          </p>
        </div>
        <Button onClick={onClose} variant="outline" size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>

          <Select
            value={statusFilter || ""}
            onValueChange={(value) => setStatusFilter(value || null)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Filter className="mr-2 h-4 w-4" />
                <span>Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuItem key={column.id} className="capitalize">
                    <Checkbox
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      aria-label={`Toggle ${column.id} column`}
                      className="mr-2"
                    />
                    {column.id === "name"
                      ? "Name"
                      : column.id === "reference_no"
                      ? "Reference No."
                      : column.id === "pnr"
                      ? "PNR"
                      : column.id === "airbus_details_depart"
                      ? "Airbus Details"
                      : column.id === "type_of_travel"
                      ? "Type of Travel"
                      : column.id === "status"
                      ? "Status"
                      : column.id === "date_booked_request"
                      ? "Date Booked"
                      : column.id}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Download progress indicator */}
      {downloadProgress !== null && (
        <div className="space-y-1">
          <Progress value={downloadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {downloadProgress < 100
              ? "Preparing download..."
              : "Download complete!"}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
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
                Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonRow key={index} />
                ))
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() =>
                      row.original.pnr && handleRowClick(row.original.pnr)
                    }
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center h-24"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-muted-foreground">No bookings found</p>
                      {searchTerm && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter(null);
                          }}
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span>
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected
            </span>
          )}
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
              <span>{"<<"}</span>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <span>{"<"}</span>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <span>{">"}</span>
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <span>{">>"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Details Dialog */}
      <AnimatePresence>
        {isDialogOpen && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => setIsDialogOpen(open)}
          >
            <DialogContent className="w-full max-w-4xl p-0 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle>Booking Details</DialogTitle>
                  <DialogDescription>
                    {currentBooking?.reference_no && (
                      <span>Reference: {currentBooking.reference_no}</span>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4">
                  {currentBooking ? (
                    <BookingDetails booking={currentBooking} />
                  ) : (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>

                <DialogFooter className="px-6 pb-6 flex items-center justify-between">
                  <div>
                    {currentBooking?.status === "Generated" && (
                      <Button
                        onClick={() =>
                          currentBooking && handleDownload(currentBooking)
                        }
                        disabled={downloadingId === currentBooking.pnr}
                        className="mr-2"
                      >
                        {downloadingId === currentBooking.pnr ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <FileDown className="mr-2 h-4 w-4" />
                            Download Itinerary
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

// Booking details component
const BookingDetails: React.FC<{ booking: UserBookingHistory }> = ({
  booking,
}) => {
  const [airports, setAirports] = useState<AirportData>({});
  const [airportsLoading, setAirportsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState("info");

  // Fetch airport data
  useEffect(() => {
    async function fetchAirports() {
      // Build an array of requests based on available airport IDs
      const airportRequests: { key: string; id: any }[] = [];

      if (booking.departure_airport_id) {
        airportRequests.push({
          key: "departure",
          id: booking.departure_airport_id,
        });
      }
      if (booking.destination_airport_id) {
        airportRequests.push({
          key: "destination",
          id: booking.destination_airport_id,
        });
      }
      if (booking.return_departure_airport_id) {
        airportRequests.push({
          key: "returnDeparture",
          id: booking.return_departure_airport_id,
        });
      }
      if (booking.return_destination_airport_id) {
        airportRequests.push({
          key: "returnDestination",
          id: booking.return_destination_airport_id,
        });
      }

      if (airportRequests.length === 0) {
        setAirportsLoading(false);
        return;
      }

      try {
        // Fetch all airport details concurrently
        const promises = airportRequests.map((req) => getAirportById(req.id));
        const results = await Promise.all(promises);

        const fetchedAirports: AirportData = {};
        results.forEach((result, index) => {
          const key = airportRequests[index].key as keyof AirportData;
          if (result.success) {
            if (result.data) {
              fetchedAirports[key] = result.data as Airport;
            }
          } else {
            console.error(`Error fetching airport (${key}): ${result.message}`);
          }
        });
        setAirports(fetchedAirports);
      } catch (error) {
        console.error("Error fetching airports:", error);
      }
      setAirportsLoading(false);
    }

    fetchAirports();
  }, [booking]);

  if (!booking) return null;

  // Format functions
  function formatFlightClass(flightClass: string | null): string {
    if (!flightClass) return "N/A";
    return flightClass
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatAirBus(airBus: string | null): string {
    if (!airBus) return "N/A";
    return airBus
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatTypeOfTravel(type: string | null): string {
    if (!type) return "N/A";
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (error) {
      return "Invalid Date";
    }
  }

  // Get status badge variant
  function getStatusBadgeVariant(status: string | null) {
    if (!status) return "secondary";

    switch (status.toLowerCase()) {
      case "generated":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "outline";
      default:
        return "secondary";
    }
  }

  return (
    <motion.div
      className="w-full max-h-[calc(100vh-10rem)] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Tabs
        defaultValue="info"
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            <span>Flight Info</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Pricing</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Documents</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-20rem)] mt-4 pr-4">
          <TabsContent value="info" className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key="info-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Status Card */}
                <Card className="mb-4">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Current Status
                        </p>
                        <div className="flex items-center mt-1">
                          <Badge
                            variant={getStatusBadgeVariant(booking.status)}
                          >
                            {booking.status || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Booking Date
                        </p>
                        <p className="font-medium">
                          {formatDate(booking.date_booked_request)}
                        </p>
                      </div>
                    </div>

                    {/* Show rejection reason if status is Rejected */}
                    {booking.status === "Rejected" &&
                      booking.reason_of_rejected && (
                        <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                          <p className="font-semibold text-destructive">
                            Rejection Reason:
                          </p>
                          <p className="text-sm mt-1">
                            {booking.reason_of_rejected}
                          </p>
                        </div>
                      )}
                  </CardContent>
                </Card>

                {/* Passenger Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Passenger Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Detail
                        title="Passenger Name"
                        value={
                          `${booking.title || ""} ${booking.first_name || ""}${
                            booking.middle_name ? ` ${booking.middle_name}` : ""
                          } ${booking.last_name || ""}`.trim() || "N/A"
                        }
                      />
                      <Detail
                        title="Reference No"
                        value={booking.reference_no || "N/A"}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Detail
                        title="Client Email"
                        value={booking.email_client || "N/A"}
                      />
                      <Detail title="PNR" value={booking.pnr || "N/A"} />
                    </div>
                  </CardContent>
                </Card>

                {/* Flight Details */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Flight Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Detail
                        title="Type of Travel"
                        value={formatTypeOfTravel(booking.type_of_travel)}
                      />
                      <Detail
                        title="Baggage Allowance"
                        value={
                          booking.baggage_kilogram
                            ? `${booking.baggage_kilogram} kg`
                            : "N/A"
                        }
                      />
                    </div>

                    {/* Departure Flight */}
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold mb-3">Departure Flight</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Detail
                          title="Flight Class"
                          value={formatFlightClass(booking.flight_class_depart)}
                        />
                        <Detail
                          title="Air Bus Details"
                          value={formatAirBus(booking.airbus_details_depart)}
                        />
                      </div>

                      {airportsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          {airports.departure && (
                            <div className="mt-3">
                              <Detail
                                title="Departure Airport"
                                value={`${airports.departure.name}, ${airports.departure.code}, ${airports.departure.location}`}
                              />
                              <Detail
                                title="Departure Date & Time"
                                value={formatDate(booking.departure_date)}
                              />
                            </div>
                          )}

                          {airports.destination && (
                            <div className="mt-3">
                              <Detail
                                title="Destination Airport"
                                value={`${airports.destination.name}, ${airports.destination.code}, ${airports.destination.location}`}
                              />
                              <Detail
                                title="Arrival Date & Time"
                                value={formatDate(booking.destination_date)}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Return Flight (if round trip) */}
                    {booking.type_of_travel === "round-trip" && (
                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold mb-3">Return Flight</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Detail
                            title="Flight Class"
                            value={formatFlightClass(
                              booking.flight_class_return
                            )}
                          />
                          <Detail
                            title="Air Bus Details"
                            value={formatAirBus(booking.airbus_details_return)}
                          />
                        </div>

                        {airportsLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <>
                            {airports.returnDeparture && (
                              <div className="mt-3">
                                <Detail
                                  title="Departure Airport"
                                  value={`${airports.returnDeparture.name}, ${airports.returnDeparture.code}, ${airports.returnDeparture.location}`}
                                />
                                <Detail
                                  title="Departure Date & Time"
                                  value={formatDate(
                                    booking.return_departure_date
                                  )}
                                />
                              </div>
                            )}

                            {airports.returnDestination && (
                              <div className="mt-3">
                                <Detail
                                  title="Destination Airport"
                                  value={`${airports.returnDestination.name}, ${airports.returnDestination.code}, ${airports.returnDestination.location}`}
                                />
                                <Detail
                                  title="Arrival Date & Time"
                                  value={formatDate(
                                    booking.return_destination_date
                                  )}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Travel Agency Info */}
                {(booking.travel_agency_name ||
                  booking.travel_agency_address) && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>Travel Agency</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Detail
                        title="Agency Name"
                        value={booking.travel_agency_name || "N/A"}
                      />
                      <Detail
                        title="Agency Address"
                        value={booking.travel_agency_address || "N/A"}
                      />
                      <Detail
                        title="Merchant Email"
                        value={booking.email_merchant || "N/A"}
                      />
                      <Detail
                        title="Merchant Contact"
                        value={booking.contact_number_merchant || "N/A"}
                      />
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key="pricing-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Purchase Price
                        </p>
                        <p className="text-2xl font-bold">
                          ₱ {formatNumber(Number(booking.purchase_price) || 0)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Selling Price
                        </p>
                        <p className="text-2xl font-bold">
                          ₱ {formatNumber(Number(booking.selling_price) || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Amount Paid</p>
                        <p className="font-bold">
                          ₱ {formatNumber(Number(booking.amount_paid) || 0)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="font-medium">Payment Method</p>
                        <Badge variant="outline">
                          {booking.payment_method || "N/A"}
                        </Badge>
                      </div>

                      {booking.selling_price && booking.amount_paid && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Balance</p>
                            <p className="font-bold">
                              ₱{" "}
                              {formatNumber(
                                Number.parseFloat(booking.selling_price) -
                                  Number.parseFloat(booking.amount_paid)
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key="documents-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {booking.payment_method !== "credits" &&
                booking.proof_of_payment_url ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Proof of Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center p-2 border rounded-md">
                        <Image
                          src={
                            booking.proof_of_payment_url || "/placeholder.svg"
                          }
                          alt="Proof of Payment"
                          width={600}
                          height={400}
                          className="max-w-full h-auto object-contain rounded"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No documents available
                        </p>
                        {booking.payment_method === "credits" && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Payment was made using credits, no proof of payment
                            required
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </motion.div>
  );
};

// Detail component for displaying information
const Detail: React.FC<{
  title: string;
  value: string | number | React.ReactNode;
  isCurrency?: boolean;
  isBadge?: boolean;
}> = ({ title, value, isCurrency = false, isBadge = false }) => (
  <div className="flex flex-col py-1">
    <span className="text-sm font-medium text-muted-foreground">{title}</span>
    {isBadge ? (
      <Badge variant={value === "Waiting" ? "secondary" : "default"}>
        {value}
      </Badge>
    ) : (
      <span className="text-sm font-semibold mt-1">
        {isCurrency
          ? `₱ ${formatNumber(Number(value) || 0)}`
          : typeof value === "number"
          ? value.toLocaleString("en-US")
          : value}
      </span>
    )}
  </div>
);

// Generate PDF function
async function generateItineraryPDF(
  booking: UserBookingHistory
): Promise<{ success: boolean; url?: string }> {
  try {
    // Fetch airport data
    const airportRequests: Promise<any>[] = [];
    const airports: AirportData = {};

    // Fetch airport data for each airport ID in the booking
    if (booking.departure_airport_id) {
      airportRequests.push(
        getAirportById(booking.departure_airport_id).then((res) => {
          if (res.success && res.data) airports.departure = res.data as Airport;
        })
      );
    }

    if (booking.destination_airport_id) {
      airportRequests.push(
        getAirportById(booking.destination_airport_id).then((res) => {
          if (res.success && res.data)
            airports.destination = res.data as Airport;
        })
      );
    }

    if (booking.return_departure_airport_id) {
      airportRequests.push(
        getAirportById(booking.return_departure_airport_id).then((res) => {
          if (res.success && res.data)
            airports.returnDeparture = res.data as Airport;
        })
      );
    }

    if (booking.return_destination_airport_id) {
      airportRequests.push(
        getAirportById(booking.return_destination_airport_id).then((res) => {
          if (res.success && res.data)
            airports.returnDestination = res.data as Airport;
        })
      );
    }

    await Promise.all(airportRequests); // Wait for all airport requests to finish

    // Render PDF with airport data
    const blob = await pdf(
      <ItineraryDocument booking={booking} airports={airports} />
    ).toBlob();
    const pdfUrl = URL.createObjectURL(blob); // Create a URL for the PDF blob
    return { success: true, url: pdfUrl };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return { success: false };
  }
}

export default BookingHistory;
