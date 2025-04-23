"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { pdf } from "@react-pdf/renderer";
import {
  Download,
  FileDown,
  Filter,
  Search,
  X,
  Loader2,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building,
  CreditCard,
  FileText,
  User
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";

// Import react-table related items
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

// Import server actions (you would need to create these)
import { getAllATMGOApplications, getATMGOApplicationById } from "@/actions/atmgo";
import { useUserContext } from "@/hooks/use-user";

// Import PDF Document Component
import ATMGODocumentPDF from "./atm-go-documents";

// Define types
interface ATMGODocument {
  id: number;
  reference_no: string;
  application_id: string;
  business_name: string;
  merchant_name: string;
  email: string;
  phone: string;
  status: "Pending" | "Approved" | "Rejected" | "DONE";
  submitted_at: string;
  processed_at: string | null;
  atm_serial_number: string | null;
  business_address: string | null;
  business_type: string | null;
  has_business_permit: boolean;
  has_extra_capital: boolean;
  admin_notes: string | null;
  pdf_url: string | null;
}

interface ATMGOApplication {
    id: number;
    business_name: string;
    email: string;
    status: "Pending" | "Approved" | "Rejected" | "DONE";
    submitted_at: string;
    processed_at: string | null;
    atm_serial_number: string | null;
    business_address: string | null;
    business_type: string | null;
    has_business_permit: boolean;
    has_extra_capital: boolean;
    admin_notes: string | null;
    pdf_url: string | null;
    // Any other fields that might be in the API response but not in ATMGODocument
    merchant_id?: number;
    merchant_name?: string;
    reference_no?: string;
    phone?: string;
    // Add any other fields from the API response
  }
  
  // Define the ApplicationResponse type to match your API response
  interface ApplicationResponse {
    success: boolean;
    message?: string;
    data?: ATMGOApplication | ATMGOApplication[];
  }

const ATMGODocumentsHistory = ({ onClose }: { onClose: () => void }) => {
  // State management
  const [documents, setDocuments] = useState<ATMGODocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<ATMGODocument[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { user } = useUserContext();

  // Fetch ATM GO documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user?.id) {
        return;
      }
  
      setLoading(true);
      setError(null);
  
      try {
        // Use a type assertion to treat the response as 'unknown' first
        const apiResponse = await getAllATMGOApplications({ 
          userId: user.id.toString() 
        }) as unknown;
        
        // Then cast it to the structure you expect
        const response = apiResponse as {
          success: boolean;
          message?: string;
          data?: any;  // Using 'any' here to avoid type conflicts
        };
  
        if (response.success && response.data) {
          // Handle both single item and array scenarios
          const applications = Array.isArray(response.data) 
            ? response.data 
            : [response.data];
            
          // Transform the data to match ATMGODocument structure
          const documents: ATMGODocument[] = applications.map(app => ({
            id: app.id,
            reference_no: app.reference_no || `REF-${app.id}`,
            application_id: app.id.toString(),
            business_name: app.business_name || '',
            merchant_name: app.merchant_name || "Unknown",
            email: app.email || '',
            phone: app.phone || "N/A",
            status: app.status || "Pending",
            submitted_at: app.submitted_at || new Date().toISOString(),
            processed_at: app.processed_at || null,
            atm_serial_number: app.atm_serial_number || null,
            business_address: app.business_address || null,
            business_type: app.business_type || null,
            has_business_permit: app.has_business_permit || false,
            has_extra_capital: app.has_extra_capital || false,
            admin_notes: app.admin_notes || null,
            pdf_url: app.pdf_url || null
          }));
          
          // Filter to only show DONE status documents
          const doneDocuments = documents.filter(doc => doc.status === "DONE");
          
          setDocuments(documents);
          setFilteredDocuments(doneDocuments);
        } else {
          setError(response.message || "Failed to fetch ATM GO documents.");
          console.error("Error from server action:", response.message);
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again later.");
        console.error("Error fetching documents:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchDocuments();
  }, [user?.id]);

  // Table columns definition
  const columns: ColumnDef<ATMGODocument>[] = [
    {
      accessorKey: "reference_no",
      header: "Reference No.",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("reference_no")}</div>
      ),
    },
    {
      accessorKey: "application_id",
      header: "Application ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("application_id") || "N/A"}</div>
      ),
    },
    {
      accessorKey: "merchant_name",
      header: "Merchant Name",
      cell: ({ row }) => <div>{row.getValue("merchant_name") || "N/A"}</div>,
    },
    {
      accessorKey: "business_name",
      header: "Business",
      cell: ({ row }) => <div>{row.getValue("business_name") || "N/A"}</div>,
    },
    {
      accessorKey: "atm_serial_number",
      header: "ATM Serial",
      cell: ({ row }) => <div>{row.getValue("atm_serial_number") || "Not Assigned"}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            DONE
          </Badge>
        );
      },
    },
    {
      accessorKey: "submitted_at",
      header: "Date Applied",
      cell: ({ row }) => {
        const date = row.getValue("submitted_at");
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
        const document = row.original;
        const isDownloading = downloadingId === document.reference_no;

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
                      handleRowClick(document.reference_no);
                    }}
                  >
                    <Eye className="h-4 w-4" />
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
                    disabled={isDownloading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(document);
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
                  Download Document
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
    setCurrentDocumentId(reference_no);
    setIsDialogOpen(true);
  };

  // Initialize table
  const table = useReactTable({
    data: filteredDocuments,
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
            
            if (column.id) {
              value = row.getValue(column.id);
            } else {
              value = "";
            }

            // Format date values
            if (
              (column.id === "submitted_at" ||
                column.id === "processed_at") &&
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
      `atmgo_documents_${format(new Date(), "yyyy-MM-dd")}.csv`
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

  const handleDownload = async (atmDocument: ATMGODocument) => {
    if (!atmDocument.reference_no) return;
  
    setDownloadingId(atmDocument.reference_no);
    setDownloadProgress(0);
  
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev === null) return 10;
          return Math.min(prev + 10, 90);
        });
      }, 300);
  
      // Get the detailed document
      const response = await getATMGOApplicationById(parseInt(atmDocument.application_id));
      clearInterval(progressInterval);
      
      if (!response.success || !response.data) {
        throw new Error("Failed to get application details");
      }
      
      const applicationDetails = response.data;
      
      // Generate PDF
      const { success, url, isServerGenerated } = await generateATMGODocumentPDF(
        atmDocument, 
        applicationDetails
      );
  
      setDownloadProgress(95);
  
      if (success && url) {
        const filename = atmDocument.merchant_name
          ? `${atmDocument.merchant_name}_atmgo_document.pdf`
          : `atmgo_document_${atmDocument.reference_no}.pdf`;
  
        if (isServerGenerated) {
          // Open in new tab if it's a server-generated URL
          window.open(url, '_blank');
        } else {
          // Use window.document to explicitly reference the DOM document
          const link = window.document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = "hidden";
          window.document.body.appendChild(link);
  
          setTimeout(() => {
            link.click();
            window.document.body.removeChild(link);
            setDownloadProgress(100);
  
            // Reset after a delay
            setTimeout(() => {
              setDownloadProgress(null);
              setDownloadingId(null);
            }, 1000);
          }, 500);
        }
      } else {
        console.error("Failed to generate PDF");
        setDownloadProgress(null);
        setDownloadingId(null);
      }
    } catch (error) {
      console.error("Error downloading document:", error);
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

  // Get current document details
  const currentDocument = documents.find((doc) => doc.reference_no === currentDocumentId);

  // Utility function to generate PDF with error handling
const generateATMGODocumentPDF = async (
    document: ATMGODocument,
    applicationDetails: any
  ) => {
    try {
      // First try to use the document's pdf_url if available
      if (document.pdf_url) {
        return { success: true, url: document.pdf_url };
      }
      
      // Create the PDF document
      const pdfDocument = (
        <ATMGODocumentPDF document={document} applicationDetails={applicationDetails} application={applicationDetails} />
      );
  
      // Using try-catch specifically for the PDF generation part
      try {
        // Generate PDF blob - fixing the issue by using the correct API
        const pdfBlob = await pdf(pdfDocument).toBlob();
        
        // Convert blob to URL
        const url = URL.createObjectURL(pdfBlob);
        
        return { success: true, url };
      } catch (pdfError) {
        console.error("Error in PDF generation:", pdfError);
        
        // Fallback to server-side generation
        const fallbackUrl = `/api/atmgo/documents/${document.application_id}`;
        return { 
          success: true, 
          url: fallbackUrl,
          isServerGenerated: true 
        };
      }
    } catch (error) {
      console.error("Error handling document:", error);
      return { success: false, url: null };
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header with close button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            ATM GO Documents
          </h2>
          <p className="text-muted-foreground">
            View and download your completed ATM GO applications
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
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
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
                    {column.id === "merchant_name"
                      ? "Merchant Name"
                      : column.id === "reference_no"
                        ? "Reference No."
                        : column.id === "application_id"
                          ? "Application ID"
                          : column.id === "business_name"
                            ? "Business"
                            : column.id === "status"
                              ? "Status"
                              : column.id === "submitted_at"
                                ? "Date Applied"
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
                      <p className="text-muted-foreground">No completed documents found</p>
                      {searchTerm && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm("");
                          }}
                        >
                          Clear search
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

      {/* Document Details Dialog */}
      <AnimatePresence>
        {isDialogOpen && currentDocument && (
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
                  <DialogTitle>ATM GO Document Details</DialogTitle>
                  <DialogDescription className="flex flex-col gap-1 text-sm">
                    {currentDocument.application_id && (
                      <span>Application ID: {currentDocument.application_id}</span>
                    )}
                    {currentDocument.reference_no && (
                      <span>Reference: {currentDocument.reference_no}</span>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4">
                  <DocumentDetails document={currentDocument} />
                </div>

                <DialogFooter className="px-6 pb-6 flex items-center justify-between">
                  <div>
                    <Button
                      onClick={() => currentDocument && handleDownload(currentDocument)}
                      disabled={downloadingId === currentDocument.reference_no}
                      className="mr-2"
                    >
                      {downloadingId === currentDocument.reference_no ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <FileDown className="mr-2 h-4 w-4" />
                          Download Document
                        </>
                      )}
                    </Button>
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

// DocumentDetails component
const DocumentDetails = ({ document }: { document: ATMGODocument }) => {
  
    return (
      <Tabs defaultValue="application" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="merchant">Merchant</TabsTrigger>
        </TabsList>
  
        <TabsContent value="application" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Application Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      DONE
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Application ID</p>
                    <p className="font-medium">{document.application_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reference Number</p>
                    <p className="font-medium">{document.reference_no}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date Submitted</p>
                    <p className="font-medium">{format(new Date(document.submitted_at), "MMM d, yyyy")}</p>
                  </div>
                  {document.processed_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Date Processed</p>
                      <p className="font-medium">{format(new Date(document.processed_at), "MMM d, yyyy")}</p>
                    </div>
                  )}
                  {document.admin_notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Admin Notes</p>
                      <p className="text-sm bg-muted/20 p-2 rounded">{document.admin_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
  
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  ATM Device Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">ATM Serial Number</p>
                    <p className="font-medium">{document.atm_serial_number || "Not Assigned"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Qualifications</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <div className={`h-4 w-4 rounded-full ${document.has_business_permit ? "bg-green-500" : "bg-gray-300"}`}></div>
                        <span className="text-sm">Business Permit</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`h-4 w-4 rounded-full ${document.has_extra_capital ? "bg-green-500" : "bg-gray-300"}`}></div>
                        <span className="text-sm">Extra Capital</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
  
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Building className="mr-2 h-4 w-4" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Business Name</p>
                  <p className="font-medium">{document.business_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Business Type</p>
                  <p className="font-medium">{document.business_type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Business Address</p>
                  <p className="font-medium">{document.business_address || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Has Business Permit</p>
                  <Badge variant={document.has_business_permit ? "default" : "secondary"}>
                    {document.has_business_permit ? "YES" : "NO"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Has Extra Capital</p>
                  <Badge variant={document.has_extra_capital ? "default" : "secondary"}>
                    {document.has_extra_capital ? "YES" : "NO"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
  
        <TabsContent value="merchant" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <User className="mr-2 h-4 w-4" />
                Merchant Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Merchant Name</p>
                  <p className="font-medium">{document.merchant_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{document.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{document.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };
  
  export default ATMGODocumentsHistory;