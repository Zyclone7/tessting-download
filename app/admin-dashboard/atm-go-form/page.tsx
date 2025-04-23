"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import {
  IconFileTypeCsv,
  IconDownload,
  IconFilter,
  IconSearch,
  IconRefresh,
  IconChartBar,
} from "@tabler/icons-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Eye,
  FileText,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CSVLink } from "react-csv";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { updateDocumentStatus } from "@/actions/atm-documents"; // Import the server action
import { useUserContext } from "@/hooks/use-user";
import { pdf } from "@react-pdf/renderer";


// Import the server action functions
import {
  getAllATMGOApplications,
  getATMGOApplicationById,
  updateATMGOApplicationStatus,
  getATMGOApplicationStats,
  getDocumentsByApplicationId, // Add this new import
} from "@/actions/atmgo";
import ATMGOApplicationPDF from "@/components/atm-documents/pdf-documents";

// Define TypeScript interfaces
type ApplicationStatusType =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "DONE"
  | "all";

// Extend badge variants to include 'success'
declare module "@/components/ui/badge" {
  interface BadgeVariants {
    success: string;
  }
}

interface ATMGOApplication {
  id: number;
  complete_name: string;
  business_name: string;
  email: string;
  cellphone: string;
  has_business_permit: "YES" | "NO";
  has_extra_capital: "YES" | "NO";
  agree_with_transaction_target: "YES" | "NO";
  submitted_at: string;
  status: ApplicationStatusType;
  complete_address?: string;
  business_industry?: string;
  existing_business?: string;
  business_operational_years?: string;
  branch_count?: string;
  fareToNearestBankFormatted?: number;
  business_permit_image?: string;
  business_permit_details?: string;
  dti_details?: string;
  sec_details?: string;
  cda_details?: string;
  admin_notes?: string;
  processed_by?: number;
  processed_at?: string;
  atm_serial_number?: string; // Add ATM serial number field
  reference_no?: string;
  application_id?: string;
}

interface StatsData {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  DONEApplications: number; // Added this property
  todayApplications: number;
  lastWeekApplications: number;
  approvalRate: number;
}

interface PaginationInfo {
  pageIndex: number;
  pageSize: number;
  pageCount?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

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
  document_type?: string;
}

export default function ATMGOApplicationsTable() {
  // State management
  const [applications, setApplications] = useState<ATMGOApplication[]>([]);
  const [filteredData, setFilteredData] = useState<ATMGOApplication[]>([]);
  const [currentApplication, setCurrentApplication] =
    useState<ATMGOApplication | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ApplicationStatusType>("all");
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] =
    useState<boolean>(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState<boolean>(false);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] =
    useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [isSerialNumberDialogOpen, setIsSerialNumberDialogOpen] =
    useState<boolean>(false);
  const [serialNumber, setSerialNumber] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  // Add these state variables for download progress tracking
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ATMGODocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<ATMGODocument[]>(
    []
  );
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    id: string | number | null;
    status: string;
    reason: string | null;
  }>({ id: null, status: "", reason: null });
  const { user } = useUserContext();
  const [documentToReject, setDocumentToReject] = useState<
    string | number | null
  >(null);
  const [applicationDocuments, setApplicationDocuments] = useState<Array<any>>(
    []
  );
  const [pagination, setPagination] = useState<PaginationInfo>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [stats, setStats] = useState<StatsData>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    DONEApplications: 0,
    todayApplications: 0,
    lastWeekApplications: 0,
    approvalRate: 0,
  });
  const { toast } = useToast();

  // Fetch all applications and stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    setIsRefreshing(true);
    setError(null);

    try {
      // Fetch applications and stats in parallel
      const [applicationsResponse, statsResponse] = await Promise.all([
        getAllATMGOApplications({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          status: activeTab !== "all" ? activeTab : undefined,
        }),
        getATMGOApplicationStats(),
      ]);

      if (applicationsResponse.success && applicationsResponse.data) {
        // Ensure we're handling the response as an array
        const appData = Array.isArray(applicationsResponse.data)
          ? applicationsResponse.data
          : [applicationsResponse.data];

        setApplications(appData as unknown as ATMGOApplication[]);
        setFilteredData(appData as unknown as ATMGOApplication[]);

        // Set pagination info from the response
        if (applicationsResponse.pagination) {
          setPagination((prev) => ({
            ...prev,
            pageCount: applicationsResponse.pagination?.totalPages,
          }));
        }
      } else {
        setError(applicationsResponse.error || "Failed to load applications");
        toast({
          title: "Error",
          description:
            applicationsResponse.error || "Failed to load applications",
          variant: "destructive",
        });
      }

      if (statsResponse.success && statsResponse.data) {
        // Ensure approval rate is a number
        const statsData = {
          ...statsResponse.data,
          approvalRate:
            typeof statsResponse.data.approvalRate === "string"
              ? Number.parseFloat(statsResponse.data.approvalRate)
              : statsResponse.data.approvalRate,
        };

        setStats(statsData as StatsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("An error occurred while fetching data");
      toast({
        title: "Error",
        description: "Failed to load applications data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setIsRefreshing(false);
      }, 500);
    }
  }, [toast, pagination.pageIndex, pagination.pageSize, activeTab]);

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
        const apiResponse = (await getAllATMGOApplications({
          userId: user.id.toString(),
        })) as unknown;

        // Then cast it to the structure you expect
        const response = apiResponse as {
          success: boolean;
          message?: string;
          data?: any; // Using 'any' here to avoid type conflicts
        };

        if (response.success && response.data) {
          // Handle both single item and array scenarios
          const applications = Array.isArray(response.data)
            ? response.data
            : [response.data];

          // Transform the data to match ATMGODocument structure
          const documents: ATMGODocument[] = applications.map((app) => ({
            id: app.id,
            reference_no: app.reference_no || `REF-${app.id}`,
            application_id: app.id.toString(),
            business_name: app.business_name || "",
            merchant_name: app.merchant_name || "Unknown",
            email: app.email || "",
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
            pdf_url: app.pdf_url || null,
          }));

          // Filter to only show DONE status documents
          const doneDocuments = documents.filter(
            (doc) => doc.status === "DONE"
          );

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

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (currentApplication && isSerialNumberDialogOpen) {
      setSerialNumber(currentApplication.atm_serial_number || "");
    }
  }, [currentApplication, isSerialNumberDialogOpen]);

  // Apply filters when search query or active tab changes
  useEffect(() => {
    if (searchQuery.trim() === "" && applications.length > 0) {
      setFilteredData(applications);
      return;
    }

    if (applications.length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = applications.filter(
        (item) =>
          (item.complete_name &&
            item.complete_name.toLowerCase().includes(query)) ||
          (item.business_name &&
            item.business_name.toLowerCase().includes(query)) ||
          (item.email && item.email.toLowerCase().includes(query)) ||
          (item.cellphone && item.cellphone.toLowerCase().includes(query))
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, applications]);

  // Modify the handleRowClick function to use application ID instead of user ID
  const handleRowClick = useCallback(
    async (id: number) => {
      try {
        // Fetch application details
        const result = await getATMGOApplicationById(id);

        if (result.success && result.data) {
          // Make sure we're handling a single application, not an array
          const appData = Array.isArray(result.data)
            ? result.data[0]
            : result.data;
          setCurrentApplication(appData as unknown as ATMGOApplication);

          // Fetch documents associated with this application ID
          const docsResult = await getDocumentsByApplicationId(id);
          if (docsResult.success && docsResult.data) {
            setApplicationDocuments(docsResult.data);
          } else {
            setApplicationDocuments([]);
          }

          setIsDetailsOpen(true);
        } else {
          toast({
            title: "Error",
            description: "Failed to load application details",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching application details:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Add this function inside your component
  const hasDocumentType = useCallback(
    (documentType: string) => {
      return applicationDocuments.some(
        (doc) =>
          doc.document_type?.toLowerCase() === documentType.toLowerCase() &&
          doc.status === "verified"
      );
    },
    [applicationDocuments]
  );

  const areAllDocumentsVerified = useCallback(() => {
    // Return false if there are no documents
    if (applicationDocuments.length === 0) return false;

    // Check if all documents are in "Approved" status
    return applicationDocuments.every((doc) => doc.status === "verified");
  }, [applicationDocuments]);

  // Add this new function to handle marking an application as Done
  const handleMarkAsDone = useCallback(async () => {
    if (!currentApplication) return;

    // If there's no serial number yet, open the dialog to set it
    if (!currentApplication.atm_serial_number) {
      setIsSerialNumberDialogOpen(true);
      return;
    }

    setIsProcessing(true);

    try {
      // First update the application status to DONE
      const result = await updateATMGOApplicationStatus(
        currentApplication.id,
        "DONE",
        "All documents verified. Application processing completed.",
        currentApplication.atm_serial_number,
        "1" // Replace with actual admin ID
      );

      if (result.success) {
        // Then send the completion email via API route
        const emailResponse = await fetch("/api/send-completed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json", 
          },
          body: JSON.stringify({
            application: {
              ...currentApplication,
              atm_serial_number: currentApplication.atm_serial_number,
            },
            adminId: 1, // Replace with actual admin ID
          }),
        });

        const emailResult = await emailResponse.json();

        if (emailResult.success) {
          toast({
            title: "Success",
            description:
              "Application marked as completed and activation email sent to merchant",
            variant: "default",
          });
        } else {
          toast({
            title: "Partial Success",
            description:
              "Application marked as completed, but activation email failed to send",
            variant: "destructive",
          });

          // Log the email error for debugging
          console.error("Email sending failed:", emailResult.error);
        }

        // Close dialogs and refresh data
        setIsDetailsOpen(false);
        fetchData();
      } else {
        toast({
          title: "Error",
          description:
            result.error || "Failed to complete application processing",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error completing application:", error);
      toast({
        title: "Error",
        description:
          "An unexpected error occurred during application completion",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [currentApplication, toast, fetchData]);

  // Handle application approval
  // Updated handleApprove function with email sending
  // Updated handleApprove function with corrected API path
  const handleApprove = useCallback(async () => {
    if (!currentApplication) return;

    setIsProcessing(true);

    try {
      const result = await updateATMGOApplicationStatus(
        currentApplication.id,
        "Approved",
        adminNotes,
        // Assuming you have admin ID from auth context - replace with actual admin ID
        "1"
      );

      if (result.success) {
        // Send approval email via API route - note the corrected path
        const emailResponse = await fetch("/api/send-approval", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            application: {
              ...currentApplication,
              admin_notes: adminNotes,
            },
            adminId: 1, // Replace with actual admin ID
          }),
        });

        const emailResult = await emailResponse.json();

        if (emailResult.success) {
          toast({
            title: "Success",
            description: "Application approved and notification sent",
          });
        } else {
          toast({
            title: "Partial Success",
            description: "Application approved, but email failed to send",
            variant: "destructive",
          });
        }

        // Close dialogs and refresh data
        setIsApproveDialogOpen(false);
        setIsDetailsOpen(false);
        setAdminNotes("");
        fetchData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to approve application",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error approving application:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [currentApplication, adminNotes, toast, fetchData]);

  // Handle application rejection
  // Updated handleReject function with email sending
  const handleReject = useCallback(async () => {
    if (!currentApplication) return;

    if (!adminNotes.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const result = await updateATMGOApplicationStatus(
        currentApplication.id,
        "Rejected",
        adminNotes,
        // Assuming you have admin ID from auth context - replace with actual admin ID
        "1"
      );

      if (result.success) {
        // Send rejection email via API route
        const emailResponse = await fetch("/api/send-rejected", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            application: {
              ...currentApplication,
              admin_notes: adminNotes,
            },
            rejectionReason: adminNotes,
            adminId: 1, // Replace with actual admin ID
          }),
        });

        const emailResult = await emailResponse.json();

        if (emailResult.success) {
          toast({
            title: "Success",
            description: "Application rejected and notification sent",
          });
        } else {
          toast({
            title: "Partial Success",
            description: "Application rejected, but email failed to send",
            variant: "destructive",
          });
        }

        // Close dialogs and refresh data
        setIsRejectDialogOpen(false);
        setIsDetailsOpen(false);
        setAdminNotes("");
        fetchData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reject application",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [currentApplication, adminNotes, toast, fetchData]);

  // Define table columns
  const columns: ColumnDef<ATMGOApplication>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "complete_name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue("complete_name") || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "business_name",
      header: "Business Name",
      cell: ({ row }) => <div>{row.getValue("business_name") || "N/A"}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("email")}>
          {row.getValue("email") || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "cellphone",
      header: "Phone",
      cell: ({ row }) => <div>{row.getValue("cellphone") || "N/A"}</div>,
    },
    {
      accessorKey: "atm_serial_number",
      header: "ATM Serial",
      cell: ({ row }) => (
        <div
          className="max-w-[150px] truncate"
          title={row.getValue("atm_serial_number")}
        >
          {row.getValue("atm_serial_number") || "Not Assigned"}
        </div>
      ),
    },
    {
      accessorKey: "has_business_permit",
      header: "Has Permit",
      cell: ({ row }) => (
        <Badge
          variant={
            row.getValue("has_business_permit") === "YES"
              ? "default"
              : "secondary"
          }
        >
          {row.getValue("has_business_permit")}
        </Badge>
      ),
    },
    {
      accessorKey: "submitted_at",
      header: "Date Applied",
      cell: ({ row }) => {
        const date = row.getValue("submitted_at")
          ? new Date(row.getValue("submitted_at"))
          : null;
        return <div>{date ? format(date, "MMM d, yyyy") : "N/A"}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as ApplicationStatusType;
        return (
          <Badge
            variant={
              status === "Approved"
                ? "default"
                : status === "Rejected"
                ? "destructive"
                : status === "DONE"
                ? "default" // You can customize this further if needed
                : "secondary"
            }
            className={`px-2 py-1 ${
              status === "DONE" ? "bg-blue-500 hover:bg-blue-600" : ""
            }`}
          >
            {status === "Approved" && <CheckCircle className="h-3 w-3 mr-1" />}
            {status === "Rejected" && <XCircle className="h-3 w-3 mr-1" />}
            {status === "Pending" && <AlertTriangle className="h-3 w-3 mr-1" />}
            {status === "DONE" && <CheckCircle className="h-3 w-3 mr-1" />}
            {status}
          </Badge>
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
                      // Use the document's primary id to fetch details
                      handleRowClick(document.id);
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
                      handleDownload({
                        id: document.id,
                        reference_no:
                          document.reference_no || `REF-${document.id}`,
                        application_id: document.id.toString(),
                        business_name: document.business_name || "",
                        merchant_name: document.complete_name || "Unknown",
                        email: document.email || "",
                        phone: document.cellphone || "N/A",
                        status:
                          document.status === "all"
                            ? "Pending"
                            : document.status || "Pending",
                        submitted_at:
                          document.submitted_at || new Date().toISOString(),
                        processed_at: document.processed_at || null,
                        atm_serial_number: document.atm_serial_number || null,
                        business_address: document.complete_address || null,
                        business_type: document.business_industry || null,
                        has_business_permit:
                          document.has_business_permit === "YES",
                        has_extra_capital: document.has_extra_capital === "YES",
                        admin_notes: document.admin_notes || null,
                        pdf_url: null, // Assuming no PDF URL is available in ATMGOApplication
                      });
                    }}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconDownload className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download Document</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  // Initialize react-table
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: pagination.pageCount || -1,
  });

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // Format date with time for display
  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  // Get status color class
  const getStatusColorClass = (status: ApplicationStatusType): string => {
    switch (status) {
      case "Approved":
        return "bg-green-500";
      case "Rejected":
        return "bg-red-500";
      case "Pending":
        return "bg-amber-500";
      case "DONE":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // Add this function inside your component
  const handleStatusUpdate = async (
    documentId: number | string,
    status: string,
    reason: string | null = null
  ) => {
    try {
      // If the status is 'rejected' and no reason is provided, open the rejection dialog
      if (status === "rejected" && !reason) {
        setDocumentToReject(documentId);
        setIsRejectionDialogOpen(true);
        return; // Exit the function early
      }

      // Instead of immediately executing the update, show confirmation dialog
      setConfirmAction({
        id: documentId,
        status,
        reason,
      });
      setIsConfirmationDialogOpen(true);
    } catch (error) {
      console.error("Error preparing document status update:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // New function to handle the confirmed status update
  const executeStatusUpdate = async () => {
    try {
      setIsProcessing(true);

      const { id, status, reason } = confirmAction;

      const response = await updateDocumentStatus({
        documentId:
          id !== null ? (typeof id === "string" ? parseInt(id, 10) : id) : 0, // Default to 0 or handle appropriately
        status: status.toLowerCase() === "verified" ? "verified" : "rejected",
        rejectionReason: reason || undefined,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Document ${
            status === "verified" ? "verified" : "rejected"
          } successfully`,
        });

        // Update local state to reflect the change
        setApplicationDocuments((docs) =>
          docs.map((doc) =>
            doc.id === id
              ? {
                  ...doc,
                  status: status === "verified" ? "Approved" : "Rejected",
                }
              : doc
          )
        );

        // Clear the rejection reason
        setRejectionReason("");

        // Refresh the document list
        await fetchData();

        // If we're viewing a particular application, refresh its documents
        if (currentApplication) {
          const docsResult = await getDocumentsByApplicationId(
            currentApplication.id
          );
          if (docsResult.success && docsResult.data) {
            setApplicationDocuments(docsResult.data);
          }
        }
      } else {
        toast({
          title: "Error",
          description: response.error || `Failed to ${status} document`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating document status:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsConfirmationDialogOpen(false);
    }
  };

  // Function to handle the submission of the rejection dialog
  const handleRejectionSubmit = () => {
    if (documentToReject) {
      handleStatusUpdate(documentToReject, "rejected", rejectionReason);
      setIsRejectionDialogOpen(false);
      setDocumentToReject(null);
    }
  };

  const handleUpdateSerialNumber = useCallback(async () => {
    if (!currentApplication) return;

    setIsProcessing(true);

    try {
      // Update the application with the new serial number but keep the same status
      const result = await updateATMGOApplicationStatus(
        currentApplication.id,
        currentApplication.status !== "all"
          ? currentApplication.status
          : "Pending",
        currentApplication.admin_notes || "",
        serialNumber, // Pass the ATM serial number
        "1" // Replace with actual admin ID
      );

      if (result.success) {
        toast({
          title: "Success",
          description: "ATM serial number has been updated",
        });

        // Update the current application with the new serial number
        setCurrentApplication((prev) =>
          prev ? { ...prev, atm_serial_number: serialNumber } : null
        );

        // Close dialogs and refresh data
        setIsSerialNumberDialogOpen(false);
        fetchData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update ATM serial number",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating ATM serial number:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [currentApplication, serialNumber, toast, fetchData]);

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
      const response = await getATMGOApplicationById(
        parseInt(atmDocument.application_id)
      );
      clearInterval(progressInterval);
  
      if (!response.success || !response.data) {
        throw new Error("Failed to get application details");
      }
  
      const applicationDetails = response.data;
  
      // Generate PDF with image support
      const { success, url, isServerGenerated } =
        await generateATMGODocumentPDF(atmDocument, applicationDetails);
  
      setDownloadProgress(95);
  
      if (success && url) {
        const filename = atmDocument.merchant_name
          ? `${atmDocument.merchant_name}_atmgo_document.pdf`
          : `atmgo_document_${atmDocument.reference_no}.pdf`;
  
        if (isServerGenerated) {
          // Open in new tab if it's a server-generated URL
          window.open(url, "_blank");
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
  const currentDocument = documents.find(
    (doc) => doc.reference_no === selectedDocument?.reference_no
  );

  // Utility function to generate PDF with error handling
  const generateATMGODocumentPDF = async (
    document: ATMGODocument,
    applicationDetails: any
  ) => {
    try {
      // First try to use the document's pdf_url if available
      if (document.pdf_url) {
        return { success: true, url: document.pdf_url, isServerGenerated: true };
      }

       // Fetch the documents related to this application
const docsResult = await getDocumentsByApplicationId(parseInt(document.application_id));
let applicationDocuments = docsResult.success && docsResult.data ? docsResult.data : [];

// Process image documents to convert blob URLs to data URLs
applicationDocuments = await Promise.all(applicationDocuments.map(async (doc) => {
  // Only process image documents that have a document_url
  if (doc.document_url && doc.file_type && doc.file_type.includes('image')) {
    try {
      // Fetch the image data
      const response = await fetch(doc.document_url);
      const blob = await response.blob();
      
      // Convert blob to data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            ...doc,
            document_url: typeof reader.result === "string" ? reader.result : "" 
          });
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image to data URL:", error);
      return doc; // Return original doc if conversion fails
    }
  }
  return doc;
}));



      // Create the PDF document
      const pdfDocument = (
        <ATMGOApplicationPDF
          document={{
            ...document,
            document_type: document.document_type || "Unknown", // Provide a default value if missing
          }}
          applicationDetails={applicationDetails}
          application={applicationDetails}
          uploadedDocuments={applicationDocuments} // Pass the uploaded documents
        />
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
          isServerGenerated: true,
        };
      }
    } catch (error) {
      console.error("Error handling document:", error);
      return { success: false, url: null };
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Dashboard Overview */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              ATM GO Applications
            </h2>
            <p className="text-muted-foreground">
              Manage and process ATM GO merchant applications
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-2 md:mt-0">
            <Button
              variant="outline"
              onClick={fetchData}
              disabled={isRefreshing}
              className="h-10"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <IconRefresh className="mr-2 h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10">
                  <IconDownload className="mr-2 h-4 w-4" />
                  Export
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <CSVLink
                  data={applications}
                  filename="atmgo_applications.csv"
                  className="w-full"
                >
                  <DropdownMenuItem>
                    <IconFileTypeCsv className="mr-2 h-4 w-4" />
                    <span>Export as CSV</span>
                  </DropdownMenuItem>
                </CSVLink>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Export as PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50/50">
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
              <IconChartBar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {stats.totalApplications}
              </div>
              <div className="flex items-center mt-1">
                <Badge variant="outline" className="text-xs font-normal">
                  <Calendar className="h-3 w-3 mr-1" />
                  {stats.todayApplications} new today
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-amber-50/50">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {stats.pendingApplications}
              </div>
              <div className="flex items-center mt-1">
                <Progress
                  value={
                    stats.totalApplications > 0
                      ? (stats.pendingApplications / stats.totalApplications) *
                        100
                      : 0
                  }
                  className="h-2 w-full bg-amber-100"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50/50">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {stats.approvedApplications}
              </div>
              <div className="flex items-center mt-1">
                <Progress
                  value={stats.approvalRate}
                  className="h-2 w-full bg-green-100"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.approvalRate}% approval rate
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-red-50/50">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {stats.rejectedApplications}
              </div>
              <div className="flex items-center mt-1">
                <Progress
                  value={
                    stats.totalApplications > 0
                      ? (stats.rejectedApplications / stats.totalApplications) *
                        100
                      : 0
                  }
                  className="h-2 w-full bg-red-100"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Not qualified
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50/50">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {stats.DONEApplications || 0}
              </div>
              <div className="flex items-center mt-1">
                <Progress
                  value={
                    stats.totalApplications > 0
                      ? ((stats.DONEApplications || 0) /
                          stats.totalApplications) *
                        100
                      : 0
                  }
                  className="h-2 w-full bg-blue-100"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Fully processed
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, business, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={() => setSearchQuery("")}
                >
                  <XCircle className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <IconFilter className="mr-2 h-4 w-4" />
                  Filter
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <span>Has Business Permit</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Has Extra Capital</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Agrees with Target</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>Clear Filters</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Select
              defaultValue="10"
              onValueChange={(value) =>
                setPagination((prev) => ({
                  ...prev,
                  pageSize: Number.parseInt(value),
                }))
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="10 per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as ApplicationStatusType)
          }
          className="w-full"
        >
          <TabsList className="grid grid-cols-5 w-full max-w-md">
            <TabsTrigger
              value="all"
              className="flex items-center justify-center"
            >
              <span className="mr-2">All</span>
              <Badge variant="outline" className="ml-auto">
                {stats.totalApplications}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="Pending"
              className="flex items-center justify-center"
            >
              <span className="mr-2">Pending</span>
              <Badge
                variant="outline"
                className="ml-auto bg-amber-50 text-amber-700 border-amber-200"
              >
                {stats.pendingApplications}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="Approved"
              className="flex items-center justify-center"
            >
              <span className="mr-2">Approved</span>
              <Badge
                variant="outline"
                className="ml-auto bg-green-50 text-green-700 border-green-200"
              >
                {stats.approvedApplications}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="DONE"
              className="flex items-center justify-center"
            >
              <span className="mr-2">Done</span>
              <Badge
                variant="outline"
                className="ml-auto bg-blue-50 text-blue-700 border-blue-200"
              >
                {stats.DONEApplications || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="Rejected"
              className="flex items-center justify-center"
            >
              <span className="mr-2">Rejected</span>
              <Badge
                variant="outline"
                className="ml-auto bg-red-50 text-red-700 border-red-200"
              >
                {stats.rejectedApplications}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-muted/50 hover:bg-muted/50"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-center font-medium"
                    >
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
                // Loading skeletons
                [...Array(5)].map((_, rowIndex) => (
                  <TableRow key={rowIndex} className="hover:bg-muted/30">
                    {columns.map((_, cellIndex) => (
                      <TableCell key={cellIndex} className="py-3">
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => handleRowClick(row.original.id)}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-center py-3">
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
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center py-8">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-lg font-medium">No results found</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search or filter criteria
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery("");
                          setActiveTab("all");
                        }}
                        className="mt-4"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing page {pagination.pageIndex + 1} of {pagination.pageCount || 1}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || loading}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Previous page</span>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Page {pagination.pageIndex + 1} of {pagination.pageCount || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || loading}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Next page</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Application Details Dialog */}
      {currentApplication && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                Application #{currentApplication.id}
                <Badge
                  variant={
                    currentApplication.status === "Approved"
                      ? "default"
                      : currentApplication.status === "Rejected"
                      ? "destructive"
                      : "secondary"
                  }
                  className="ml-3 px-3 py-1"
                >
                  {currentApplication.status === "Approved" && (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  {currentApplication.status === "Rejected" && (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {currentApplication.status === "Pending" && (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {currentApplication.status}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Submitted on {formatDateTime(currentApplication.submitted_at)}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Application Progress */}
                <div className="w-full bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">
                      Application Progress
                    </h3>
                    <Badge variant="outline" className="font-normal">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDateTime(currentApplication.submitted_at)}
                    </Badge>
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusColorClass(
                            "Pending"
                          )} text-white`}
                        >
                          1
                        </div>
                        <span className="text-xs mt-1">Submitted</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            currentApplication.status !== "Pending"
                              ? getStatusColorClass(currentApplication.status)
                              : "bg-gray-300"
                          } text-white`}
                        >
                          2
                        </div>
                        <span className="text-xs mt-1">Reviewed</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            currentApplication.status === "Approved"
                              ? "bg-green-500"
                              : "bg-gray-300"
                          } text-white`}
                        >
                          3
                        </div>
                        <span className="text-xs mt-1">Approved</span>
                      </div>
                    </div>
                    <div className="absolute top-3 left-0 right-0 h-1 bg-gray-200 -z-10">
                      <div
                        className={`h-full ${getStatusColorClass(
                          currentApplication.status
                        )}`}
                        style={{
                          width:
                            currentApplication.status === "Pending"
                              ? "0%"
                              : currentApplication.status === "Rejected"
                              ? "50%"
                              : "100%",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Applicant Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-primary"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Applicant Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Full Name
                      </p>
                      <p className="font-medium">
                        {currentApplication.complete_name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Email
                      </p>
                      <p className="font-medium">{currentApplication.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Phone Number
                      </p>
                      <p className="font-medium">
                        {currentApplication.cellphone}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Address
                      </p>
                      <p className="font-medium">
                        {currentApplication.complete_address || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-primary"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm8 8V7l-3-3H8L5 7v6h10z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Business Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Business Name
                      </p>
                      <p className="font-medium">
                        {currentApplication.business_name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Industry
                      </p>
                      <p className="font-medium">
                        {currentApplication.business_industry || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Existing Business
                      </p>
                      <p className="font-medium">
                        {currentApplication.existing_business || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Years in Operation
                      </p>
                      <p className="font-medium">
                        {currentApplication.business_operational_years || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Branch Count
                      </p>
                      <p className="font-medium">
                        {currentApplication.branch_count || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Fare to Nearest Bank
                      </p>
                      <p className="font-medium">
                        {currentApplication.fareToNearestBankFormatted
                          ? formatCurrency(
                              currentApplication.fareToNearestBankFormatted
                            )
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Qualifications */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-primary"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Qualifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted/20 p-4 rounded-lg flex flex-col items-center">
                      <p className="text-sm font-medium text-center mb-2">
                        Business Permit
                      </p>
                      <Badge
                        variant={
                          currentApplication.has_business_permit === "YES"
                            ? "default"
                            : "secondary"
                        }
                        className="px-3 py-1"
                      >
                        {currentApplication.has_business_permit === "YES" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {currentApplication.has_business_permit}
                      </Badge>
                    </div>
                    <div className="bg-muted/20 p-4 rounded-lg flex flex-col items-center">
                      <p className="text-sm font-medium text-center mb-2">
                        Extra Capital
                      </p>
                      <Badge
                        variant={
                          currentApplication.has_extra_capital === "YES"
                            ? "default"
                            : "secondary"
                        }
                        className="px-3 py-1"
                      >
                        {currentApplication.has_extra_capital === "YES" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {currentApplication.has_extra_capital}
                      </Badge>
                    </div>
                    <div className="bg-muted/20 p-4 rounded-lg flex flex-col items-center">
                      <p className="text-sm font-medium text-center mb-2">
                        Agrees with Target
                      </p>
                      <Badge
                        variant={
                          currentApplication.agree_with_transaction_target ===
                          "YES"
                            ? "default"
                            : "secondary"
                        }
                        className="px-3 py-1"
                      >
                        {currentApplication.agree_with_transaction_target ===
                        "YES" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {currentApplication.agree_with_transaction_target}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Business Documentation */}
                {currentApplication.has_business_permit === "YES" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      {/* SVG and title */}
                      Business Permit Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                      {/* Business permit number field */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Business Permit Number
                        </p>
                        <p className="font-medium">
                          {currentApplication.business_permit_details || "N/A"}
                        </p>
                      </div>

                      {/* DTI field */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          DTI
                        </p>
                        <p className="font-medium">
                          {currentApplication.dti_details || "N/A"}
                        </p>
                      </div>

                      {/* SEC field */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          SEC
                        </p>
                        <p className="font-medium">
                          {currentApplication.sec_details || "N/A"}
                        </p>
                      </div>

                      {/* CDA field */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          CDA
                        </p>
                        <p className="font-medium">
                          {currentApplication.cda_details || "N/A"}
                        </p>
                      </div>

                      {/* FIRST NEW SECTION: Requirements Documents Submitted */}
                      <div className="col-span-2 mt-4">
                        <h4 className="text-md font-medium mb-2">
                          Requirements Documents Submitted
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Business Permit */}
                          <div className="flex items-center p-2 border rounded-md bg-white">
                            {hasDocumentType("business_permit") ? (
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            ) : currentApplication.business_permit_details ? (
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2 text-gray-300" />
                            )}
                            <span>Business Permit</span>
                          </div>

                          {/* DTI Certificate */}
                          <div className="flex items-center p-2 border rounded-md bg-white">
                            {hasDocumentType("dti_certificate") ? (
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            ) : currentApplication.dti_details ? (
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2 text-gray-300" />
                            )}
                            <span>DTI Certificate</span>
                          </div>

                          {/* SEC Registration */}
                          <div className="flex items-center p-2 border rounded-md bg-white">
                            {hasDocumentType("sec_registration") ? (
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            ) : currentApplication.sec_details ? (
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2 text-gray-300" />
                            )}
                            <span>SEC Registration</span>
                          </div>

                          {/* CDA Registration */}
                          <div className="flex items-center p-2 border rounded-md bg-white">
                            {hasDocumentType("cda_registration") ? (
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            ) : currentApplication.cda_details ? (
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2 text-gray-300" />
                            )}
                            <span>CDA Registration</span>
                          </div>
                        </div>
                      </div>

                      {/* SECOND NEW SECTION: Document Files Section */}
                      {applicationDocuments.length > 0 && (
                        <div className="col-span-2 mt-4">
                          <h4 className="text-md font-medium mb-2">
                            Uploaded Documents
                          </h4>
                          <div className="space-y-2">
                            {applicationDocuments.map((doc) => (
                              <div
                                key={doc.id}
                                className={`flex items-center p-3 border rounded-md bg-white ${
                                  doc.status === "Approved" ||
                                  doc.status === "Verified"
                                    ? "border-l-4 border-l-green-500"
                                    : doc.status === "Rejected"
                                    ? "border-l-4 border-l-red-500"
                                    : ""
                                }`}
                              >
                                <div className="mr-3">
                                  {doc.file_type.includes("image") ? (
                                    <img
                                      src="/icons/image-file-icon.svg"
                                      alt="Image"
                                      className="w-8 h-8"
                                    />
                                  ) : doc.file_type.includes("pdf") ? (
                                    <img
                                      src="/icons/pdf-file-icon.svg"
                                      alt="PDF"
                                      className="w-8 h-8"
                                    />
                                  ) : (
                                    <img
                                      src="/icons/document-file-icon.svg"
                                      alt="Document"
                                      className="w-8 h-8"
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {doc.document_type}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {doc.original_filename} (
                                    {(doc.file_size / 1024).toFixed(1)} KB)
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    doc.status === "Approved" ||
                                    doc.status === "Verified"
                                      ? "default"
                                      : doc.status === "Rejected"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="px-2 py-1"
                                >
                                  {doc.status === "Approved" ||
                                  doc.status === "Verified" ? (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  ) : doc.status === "Rejected" ? (
                                    <XCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                  )}
                                  {doc.status}
                                </Badge>
                                {doc.document_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 ml-2"
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setIsDocumentViewerOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">
                                      View document
                                    </span>
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Document Viewer Dialog */}
                      {selectedDocument && (
                        <Dialog
                          open={isDocumentViewerOpen}
                          onOpenChange={setIsDocumentViewerOpen}
                        >
                          <DialogContent className="max-w-4xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle className="text-xl flex items-center">
                                Document: {selectedDocument.document_type}
                              </DialogTitle>
                              <DialogDescription>
                                {selectedDocument.original_filename} (
                                {(selectedDocument.file_size / 1024).toFixed(1)}{" "}
                                KB)
                              </DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-col items-center justify-center overflow-hidden">
                              {selectedDocument.file_type.includes("image") ? (
                                <div className="w-full overflow-auto p-2 bg-gray-100 rounded-md">
                                  <img
                                    src={selectedDocument.document_url}
                                    alt={selectedDocument.document_type}
                                    className="max-w-full h-auto mx-auto"
                                  />
                                </div>
                              ) : selectedDocument.file_type.includes("pdf") ? (
                                <div className="w-full h-[60vh] overflow-hidden bg-gray-100 rounded-md">
                                  <iframe
                                    src={selectedDocument.document_url}
                                    title={selectedDocument.document_type}
                                    className="w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-[60vh] overflow-hidden bg-gray-100 rounded-md">
                                  <iframe
                                    src={selectedDocument.document_url}
                                    title={selectedDocument.document_type}
                                    className="w-full h-full"
                                  />
                                </div>
                              )}
                            </div>
                            {/* Rejection Reason Dialog */}
                            <Dialog
                              open={isRejectionDialogOpen}
                              onOpenChange={setIsRejectionDialogOpen}
                            >
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Rejection Reason</DialogTitle>
                                  <DialogDescription>
                                    Please provide a reason for rejecting this
                                    document.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label htmlFor="reason">Reason</Label>
                                    <Textarea
                                      id="reason"
                                      placeholder="Enter rejection reason..."
                                      value={rejectionReason}
                                      onChange={(e) =>
                                        setRejectionReason(e.target.value)
                                      }
                                      className="min-h-[100px]"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsRejectionDialogOpen(false);
                                      setDocumentToReject(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={handleRejectionSubmit}
                                    disabled={!rejectionReason.trim()}
                                  >
                                    Reject Document
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between">
                              <div className="flex space-x-2">
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    handleStatusUpdate(
                                      selectedDocument.id,
                                      "rejected"
                                    )
                                  }
                                  disabled={
                                    selectedDocument.status === "Rejected" ||
                                    isProcessing
                                  }
                                >
                                  <ThumbsDown className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  variant="default"
                                  onClick={() =>
                                    handleStatusUpdate(
                                      selectedDocument.id,
                                      "verified"
                                    )
                                  }
                                  disabled={
                                    selectedDocument.status === "Verified" ||
                                    isProcessing
                                  }
                                >
                                  <ThumbsUp className="h-4 w-4 mr-2" />
                                  Verify
                                </Button>
                              </div>
                              <div className="flex items-center space-x-2">
                                {selectedDocument.status && (
                                  <Badge
                                    variant={
                                      selectedDocument.status === "Approved" ||
                                      selectedDocument.status === "Verified"
                                        ? "default"
                                        : selectedDocument.status === "Rejected"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className="px-2 py-1"
                                  >
                                    {selectedDocument.status === "Approved" ||
                                    selectedDocument.status === "Verified" ? (
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                    ) : selectedDocument.status ===
                                      "Rejected" ? (
                                      <XCircle className="h-3 w-3 mr-1" />
                                    ) : (
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                    )}
                                    {selectedDocument.status}
                                  </Badge>
                                )}
                                <Button
                                  variant="outline"
                                  onClick={() => setIsDocumentViewerOpen(false)}
                                >
                                  Close
                                </Button>
                                <Button asChild>
                                  <a
                                    href={selectedDocument.document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Open in New Tab
                                  </a>
                                </Button>
                              </div>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      {currentApplication.status === "Approved" && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2 text-primary"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                            </svg>
                            ATM Device Information
                          </h3>
                          <div className="bg-muted/20 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                  ATM Serial Number
                                </p>
                                <p className="font-medium">
                                  {currentApplication.atm_serial_number ||
                                    "Not assigned yet"}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSerialNumber(
                                    currentApplication.atm_serial_number || ""
                                  );
                                  setIsSerialNumberDialogOpen(true);
                                }}
                                className="ml-4"
                              >
                                {currentApplication.atm_serial_number
                                  ? "Edit"
                                  : "Assign"}{" "}
                                Serial Number
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Permit Image Section (existing code) */}
                      {currentApplication.business_permit_image && (
                        <div className="col-span-2 space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Permit Image
                          </p>
                          <div className="border rounded-md p-2 max-w-md">
                            <img
                              src={
                                currentApplication.business_permit_image ||
                                "/placeholder.svg"
                              }
                              alt="Business Permit"
                              className="w-full h-auto rounded-md"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Admin Notes */}
                {currentApplication.admin_notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-primary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Admin Notes
                    </h3>
                    <div className="bg-muted/30 rounded-md p-4">
                      <p>{currentApplication.admin_notes}</p>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Processed by Admin #{currentApplication.processed_by} on{" "}
                      {formatDateTime(currentApplication.processed_at)}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="flex justify-between items-center">
              {currentApplication.status === "Pending" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="bg-green-50 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 hover:bg-green-100"
                    onClick={() => setIsApproveDialogOpen(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-red-50 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-100"
                    onClick={() => setIsRejectDialogOpen(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
              {currentApplication.status === "Approved" && (
                <div className="flex gap-2">
                  {!currentApplication.atm_serial_number && (
                    <Button
                      variant="outline"
                      className="bg-blue-50 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-100"
                      onClick={() => {
                        setSerialNumber("");
                        setIsSerialNumberDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Assign Serial Number
                    </Button>
                  )}
                  {areAllDocumentsVerified() && (
                    <Button
                      variant="default"
                      onClick={handleMarkAsDone}
                      disabled={isProcessing}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Done
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approve Dialog */}
      {currentApplication && (
        <Dialog
          open={isApproveDialogOpen}
          onOpenChange={setIsApproveDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Approve Application
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this application?
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-4">
              <div className="bg-muted/20 p-4 rounded-lg space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Application ID</p>
                  <p className="font-semibold">{currentApplication.id}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Applicant</p>
                  <p className="font-semibold">
                    {currentApplication.complete_name}
                  </p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Business</p>
                  <p className="font-semibold">
                    {currentApplication.business_name}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Admin Notes (Optional)</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this approval..."
                  className="resize-none h-24"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsApproveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Approval
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      {currentApplication && (
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <XCircle className="h-5 w-5 mr-2 text-red-500" />
                Reject Application
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this application.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-4">
              <div className="bg-muted/20 p-4 rounded-lg space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Application ID</p>
                  <p className="font-semibold">{currentApplication.id}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Applicant</p>
                  <p className="font-semibold">
                    {currentApplication.complete_name}
                  </p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Business</p>
                  <p className="font-semibold">
                    {currentApplication.business_name}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Reason for Rejection <span className="text-red-500">*</span>
                </p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Please provide a detailed reason for rejection..."
                  className="resize-none h-24 border-red-200 focus-visible:ring-red-400"
                />
                {!adminNotes.trim() && (
                  <p className="text-xs text-red-500 mt-1">
                    This field is required
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRejectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={isProcessing || !adminNotes.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Confirm Rejection
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {currentApplication && (
        <Dialog
          open={isSerialNumberDialogOpen}
          onOpenChange={setIsSerialNumberDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-blue-500" />
                ATM Serial Number
              </DialogTitle>
              <DialogDescription>
                {currentApplication.atm_serial_number
                  ? "Update the ATM serial number for this application."
                  : "Assign an ATM serial number to this application."}
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-4">
              <div className="bg-muted/20 p-4 rounded-lg space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Application ID</p>
                  <p className="font-semibold">{currentApplication.id}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Applicant</p>
                  <p className="font-semibold">
                    {currentApplication.complete_name}
                  </p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Business</p>
                  <p className="font-semibold">
                    {currentApplication.business_name}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="serialNumber">
                  ATM Serial Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Enter ATM serial number..."
                  className="resize-none"
                />
                {!serialNumber.trim() && (
                  <p className="text-xs text-red-500 mt-1">
                    This field is required
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSerialNumberDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSerialNumber}
                disabled={isProcessing || !serialNumber.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {currentApplication.atm_serial_number
                      ? "Update"
                      : "Assign"}{" "}
                    Serial Number
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ADD THE CONFIRMATION DIALOG HERE */}
      <Dialog
        open={isConfirmationDialogOpen}
        onOpenChange={setIsConfirmationDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction.status === "verified"
                ? "Verify Document"
                : "Reject Document"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              {confirmAction.status === "verified" ? "verify" : "reject"} this
              document?
              {confirmAction.status === "rejected" && confirmAction.reason && (
                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm">
                  <p className="font-medium text-red-800">
                    Reason for rejection:
                  </p>
                  <p className="text-red-700">{confirmAction.reason}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsConfirmationDialogOpen(false)}
              disabled={isProcessing}
            >
              No
            </Button>
            <Button
              variant={
                confirmAction.status === "verified" ? "default" : "destructive"
              }
              onClick={executeStatusUpdate}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Yes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Container */}
      <Toaster />
    </div>
  );
}
