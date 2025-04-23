"use client";

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
    Building,
    CreditCard,
    FileText,
    Loader2,
    Calendar,
    Users,
    Bed,
    User,
    AlertCircle
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
import { getHotelBookingsByUserId } from "@/actions/hotel-booking";
import { useUserContext } from "@/hooks/use-user";
import { formatNumber } from "@/lib/utils";
import HotelItineraryDocument from "@/components/hotel-iterinary-documents";

interface UserHotelBooking {
    id: number;
    uid: number;
    booking_id: string | null;
    reference_no: string | null;
    title: string | null;
    last_name: string | null;
    first_name: string | null;
    middle_name: string | null;
    email_merchant: string | null;
    email_client: string | null;
    contact_number_client: string | null;
    contact_number_merchant: string | null;
    purchase_price: string | null;
    selling_price: string | null;
    amount_paid: string | null;
    payment_method: string | null;
    proof_of_payment_url: string | null;
    date_booked_request: string | null;
    status: string | null;
    date_generated_rejected: string | null;
    reason_of_rejected: string | null;
    provider: string | null;
    hotel_name: string | null;
    hotel_location: string | null;
    hotel_address: string | null;
    hotel_contact: string | null;
    check_in_date: string | null;
    check_out_date: string | null;
    check_in_time: string | null;
    check_out_time: string | null;
    room_type: string | null;
    number_of_guests: number | null;
    special_requests: string | null;
    additional_guests: any[] | null;
    travel_agency_name: string | null;
    travel_agency_address: string | null;
    travel_agency_number: string | null;
    social_media_page: string | null;
    pdf_url: string | null;
}

const HotelBookingHistory = ({ onClose }: { onClose: () => void }) => {
    const [bookings, setBookings] = useState<UserHotelBooking[]>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const { user } = useUserContext();

    // Fetch booking history data
    useEffect(() => {
        const fetchBookings = async () => {
            if (!user?.id) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response: any = await getHotelBookingsByUserId(
                    user.id.toString()
                );

                if (response.success && response.data) {
                    setBookings(response.data);
                } else {
                    setError(response.message || "Failed to fetch hotel bookings.");
                    console.error("Error from server action:", response.message);
                }
            } catch (err) {
                setError("An unexpected error occurred. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [user?.id]);

    // Status options for filtering
    const statusOptions = useMemo(() => {
        const statuses = new Set<string>();
        bookings.forEach((booking) => {
            if (booking.status) {
                statuses.add(booking.status);
            }
        });
        return Array.from(statuses);
    }, [bookings]);

    // Calculate nights for a booking
    const calculateNights = (checkIn: string | null, checkOut: string | null) => {
        if (!checkIn || !checkOut) return 0;
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Table columns definition
    const columns: ColumnDef<UserHotelBooking>[] = [
        {
            accessorKey: "reference_no",
            header: "Reference No.",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("reference_no")}</div>
            ),
        },
        {
            accessorKey: "booking_id",
            header: "Booking ID",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("booking_id") || "N/A"}</div>
            ),
        },
        {
            accessorKey: "name",
            header: "Guest Name",
            cell: ({ row }) => (
                <div>
                    {`${row.original.title || ""} ${row.original.first_name || ""} ${row.original.middle_name ? ` ${row.original.middle_name}` : ""
                        } ${row.original.last_name || ""}`.trim()}
                </div>
            ),
        },
        {
            accessorKey: "hotel_name",
            header: "Hotel",
            cell: ({ row }) => <div>{row.getValue("hotel_name") || "N/A"}</div>,
        },
        {
            accessorKey: "check_in_date",
            header: "Check-in Date",
            cell: ({ row }) => {
                const date = row.getValue("check_in_date");
                return (
                    <div>
                        {date ? format(new Date(date as string), "MMM d, yyyy") : "N/A"}
                    </div>
                );
            },
        },
        {
            accessorKey: "nights",
            header: "Nights",
            cell: ({ row }) => {
                const nights = calculateNights(
                    row.original.check_in_date,
                    row.original.check_out_date
                );
                return <div>{nights} night{nights !== 1 ? 's' : ''}</div>;
            },
        },
        {
            accessorKey: "room_type",
            header: "Room Type",
            cell: ({ row }) => <div>{row.getValue("room_type") || "Standard"}</div>,
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
                const isDownloading = downloadingId === booking.reference_no;
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
                                            handleRowClick(booking.reference_no || "");
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
    const handleRowClick = (reference_no: string) => {
        setCurrentBookingId(reference_no);
        setIsDialogOpen(true);
    };

    // Initialize table
    const table = useReactTable({
        data: bookings,
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
                            value = `${booking.title || ""} ${booking.first_name || ""} ${booking.middle_name ? ` ${booking.middle_name}` : ""
                                } ${booking.last_name || ""}`.trim();
                        } else if (column.id === "nights") {
                            value = calculateNights(
                                row.original.check_in_date,
                                row.original.check_out_date
                            );
                        } else if (column.id) {
                            value = row.getValue(column.id);
                        } else {
                            value = "";
                        }

                        // Format date values
                        if (
                            (column.id === "date_booked_request" ||
                                column.id === "check_in_date") &&
                            value
                        ) {
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
            `hotel_booking_history_${format(new Date(), "yyyy-MM-dd")}.csv`
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
    const handleDownload = async (booking: UserHotelBooking) => {
        if (!booking.reference_no) return;

        setDownloadingId(booking.reference_no);
        setDownloadProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setDownloadProgress((prev) => {
                    if (prev === null) return 10;
                    return Math.min(prev + 10, 90);
                });
            }, 300);

            // Calculate nights
            const nights = calculateNights(booking.check_in_date, booking.check_out_date);

            // Prepare booking dates object
            const bookingDates = {
                checkIn: booking.check_in_date ? new Date(booking.check_in_date) : null,
                checkOut: booking.check_out_date ? new Date(booking.check_out_date) : null,
                nights: nights
            };

            // Generate PDF
            const { success, url } = await generateHotelItineraryPDF(booking, bookingDates);

            clearInterval(progressInterval);
            setDownloadProgress(95);

            if (success && url) {
                const filename = booking.first_name
                    ? `${booking.first_name}_${booking.last_name}_hotel_itinerary.pdf`
                    : `hotel_booking_${booking.reference_no}.pdf`;

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

    // Get current booking details
    const currentBooking = useMemo(() => {
        return bookings.find((b) => b.reference_no === currentBookingId);
    }, [bookings, currentBookingId]);


    return (
        <div className="w-full space-y-4">
            {/* Header with close button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Hotel Booking History
                    </h2>
                    <p className="text-muted-foreground">
                        View and manage your hotel accommodations
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
                        value={statusFilter || "all"} // Changed from empty string to "all"
                        onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem> {/* Changed from empty string to "all" */}
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
                                            ? "Guest Name"
                                            : column.id === "reference_no"
                                                ? "Reference No."
                                                : column.id === "booking_id"
                                                    ? "Booking ID"
                                                    : column.id === "hotel_name"
                                                        ? "Hotel"
                                                        : column.id === "check_in_date"
                                                            ? "Check-in Date"
                                                            : column.id === "nights"
                                                                ? "Nights"
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
                                            row.original.reference_no &&
                                            handleRowClick(row.original.reference_no)
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
                                    <DialogTitle>Hotel Booking Details</DialogTitle>
                                    <DialogDescription className="flex flex-col gap-1 text-sm">
                                        {currentBooking?.booking_id && (
                                            <span>Booking ID: {currentBooking.booking_id}</span>
                                        )}
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
                                                disabled={downloadingId === currentBooking.reference_no}
                                                className="mr-2"
                                            >
                                                {downloadingId === currentBooking.reference_no ? (
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


// BookingDetails component
const BookingDetails = ({ booking }: { booking: UserHotelBooking }) => {
    // Calculate total nights
    const calculateNights = (checkIn: string | null, checkOut: string | null) => {
        if (!checkIn || !checkOut) return 0;
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const nights = calculateNights(booking.check_in_date, booking.check_out_date);

    return (
        <Tabs defaultValue="reservation" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="reservation">Reservation</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
                <TabsTrigger value="customer">Customer</TabsTrigger>
            </TabsList>

            <TabsContent value="reservation" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center">
                                <Building className="mr-2 h-4 w-4" />
                                Hotel Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div>
                                    <h3 className="font-semibold">{booking.hotel_name || 'N/A'}</h3>
                                    <p className="text-sm text-muted-foreground">{booking.hotel_address || booking.hotel_location || 'Address not provided'}</p>
                                </div>
                                {booking.hotel_contact && (
                                    <p className="text-sm">
                                        <span className="font-semibold">Contact:</span> {booking.hotel_contact}
                                    </p>
                                )}
                                {booking.provider && (
                                    <p className="text-sm">
                                        <span className="font-semibold">Provider:</span> {booking.provider}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center">
                                <Calendar className="mr-2 h-4 w-4" />
                                Stay Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Check-in</p>
                                        <p className="font-medium">
                                            {booking.check_in_date
                                                ? format(new Date(booking.check_in_date), "MMM d, yyyy")
                                                : 'N/A'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {booking.check_in_time || 'Standard time'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Check-out</p>
                                        <p className="font-medium">
                                            {booking.check_out_date
                                                ? format(new Date(booking.check_out_date), "MMM d, yyyy")
                                                : 'N/A'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {booking.check_out_time || 'Standard time'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm">
                                        <span className="font-semibold">Stay duration:</span> {nights} night{nights !== 1 ? 's' : ''}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">Room type:</span> {booking.room_type || 'Standard'}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">Guests:</span> {booking.number_of_guests || 1}
                                    </p>
                                </div>
                                {booking.special_requests && (
                                    <div>
                                        <p className="text-sm font-semibold">Special Requests:</p>
                                        <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {booking.additional_guests && booking.additional_guests.length > 0 && (
                        <Card className="md:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center">
                                    <Users className="mr-2 h-4 w-4" />
                                    Additional Guests
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {(() => {
                                        try {
                                            const additionalGuests = typeof booking.additional_guests === 'string'
                                                ? JSON.parse(booking.additional_guests)
                                                : booking.additional_guests;

                                            if (!additionalGuests || additionalGuests.length === 0) {
                                                return <p className="text-sm text-muted-foreground">No additional guests</p>;
                                            }

                                            return additionalGuests.map((guest: any, idx: number) => (
                                                <div key={idx} className="p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">
                                                                {guest.firstName && guest.lastName
                                                                    ? `${guest.firstName} ${guest.lastName}`
                                                                    : guest.firstName
                                                                        ? guest.firstName
                                                                        : `Guest ${idx + 1}`}
                                                            </p>
                                                            {guest.email && (
                                                                <p className="text-xs text-muted-foreground">{guest.email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                        } catch (e) {
                                            return (
                                                <div className="flex items-center justify-center p-4 border border-dashed rounded-md">
                                                    <div className="text-center">
                                                        <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                                                        <p className="text-sm text-muted-foreground">No additional guest information available</p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Payment Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-x-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Purchase Price</p>
                                        <p className="font-medium">
                                            ₱{booking.purchase_price ? formatNumber(parseFloat(booking.purchase_price)) : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Selling Price</p>
                                        <p className="font-medium">
                                            ₱{booking.selling_price ? formatNumber(parseFloat(booking.selling_price)) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm">
                                    <span className="font-semibold">Amount Paid:</span>
                                    ₱{booking.amount_paid ? formatNumber(parseFloat(booking.amount_paid)) : '0.00'}
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold">Payment Method:</span> {booking.payment_method || 'Not specified'}
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold">Status:</span>
                                    <Badge className="ml-1" variant={
                                        booking.status === "Generated" ? "default" :
                                            booking.status === "Rejected" ? "destructive" :
                                                booking.status === "Pending" ? "outline" : "secondary"
                                    }>
                                        {booking.status || 'N/A'}
                                    </Badge>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center">
                                <FileText className="mr-2 h-4 w-4" />
                                Booking Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="font-semibold">Booking ID:</span> {booking.booking_id || 'N/A'}
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold">Reference No:</span> {booking.reference_no || 'N/A'}
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold">Date Booked: </span>
                                    {booking.date_booked_request
                                        ? format(new Date(booking.date_booked_request), "MMM d, yyyy")
                                        : 'N/A'}
                                </p>
                                {booking.date_generated_rejected && (
                                    <p className="text-sm">
                                        <span className="font-semibold">Date Generated/Rejected:</span>
                                        {format(new Date(booking.date_generated_rejected), "MMM d, yyyy")}
                                    </p>
                                )}
                                {booking.reason_of_rejected && (
                                    <div>
                                        <p className="text-sm font-semibold text-destructive">Reason for Rejection:</p>
                                        <p className="text-sm text-muted-foreground">{booking.reason_of_rejected}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="customer" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center">
                                <Users className="mr-2 h-4 w-4" />
                                Guest Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <h3 className="font-semibold">
                                    {booking.title} {booking.first_name} {booking.middle_name} {booking.last_name}
                                </h3>
                                {booking.email_client && (
                                    <p className="text-sm">
                                        <span className="font-semibold">Email:</span> {booking.email_client}
                                    </p>
                                )}
                                {booking.contact_number_client && (
                                    <p className="text-sm">
                                        <span className="font-semibold">Contact:</span> {booking.contact_number_client}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {(booking.travel_agency_name || booking.social_media_page) && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center">
                                    <Building className="mr-2 h-4 w-4" />
                                    Agency Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {booking.travel_agency_name && (
                                        <p className="text-sm">
                                            <span className="font-semibold">Agency Name:</span> {booking.travel_agency_name}
                                        </p>
                                    )}
                                    {booking.travel_agency_address && (
                                        <p className="text-sm">
                                            <span className="font-semibold">Agency Address:</span> {booking.travel_agency_address}
                                        </p>
                                    )}
                                    {booking.travel_agency_number && (
                                        <p className="text-sm">
                                            <span className="font-semibold">Agency Contact:</span> {booking.travel_agency_number}
                                        </p>
                                    )}
                                    {booking.social_media_page && (
                                        <p className="text-sm">
                                            <span className="font-semibold">Social Media:</span> {booking.social_media_page}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    );
};

// Utility function to generate PDF
const generateHotelItineraryPDF = async (
    booking: UserHotelBooking,
    bookingDates: {
        checkIn: Date | null;
        checkOut: Date | null;
        nights: number;
    }
) => {
    try {
        // Create the PDF document
        const document = (
            <HotelItineraryDocument booking={booking} bookingDates={bookingDates} />
        );

        // Generate PDF blob
        const blob = await pdf(document).toBlob();

        // Convert blob to URL
        const url = URL.createObjectURL(blob);

        return { success: true, url };
    } catch (error) {
        console.error("Error generating PDF:", error);
        return { success: false, url: null };
    }
};

export default HotelBookingHistory;