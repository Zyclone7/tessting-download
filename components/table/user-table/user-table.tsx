"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
} from "@tanstack/react-table"
import { columns } from "./columns"
import { UserDialog } from "./user-dialog"
import { AdvancedFilters } from "./advanced-filters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  Search,
  Plus,
  Trash2,
  Edit,
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  LineChart,
  Download,
  MoreHorizontal,
  Mail,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings,
  Loader2,
  Eye,
  LayoutGrid,
  LayoutList,
  Sparkles,
  Info,
  Store,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUsers, updateUser, deleteUser, createUser, updatePassword, bulkUpdateUserRetailerCount, bulkUpdateUserCredits } from "@/actions/user";
import { sendWelcomeEmail } from "@/lib/email"
import { BulkUploadDialog } from "./bulk-upload-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserAnalytics } from "./user-analytics"
import { generateRandomPassword } from "@/lib/utils"

// Format number with commas
const formatNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === "") return "0.00"
  const numValue = typeof num === "string" ? Number.parseFloat(num) : num
  return numValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Format date
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

// Get time period for analytics
const getTimePeriod = (days: number): { start: Date; end: Date } => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  return { start, end }
}

const defaultEmailTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to PHILTECH BUSINESS GROUP</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #e0e0e0;
    }
    .logo-container {
      text-align: center;
      padding: 25px;
      background-color: #f8f8f8;
      border-bottom: 1px solid #e0e0e0;
    }
    .logo {
      max-width: 250px;
      height: auto;
    }
    .header {
      background-color: #3f87d6;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background-color: #f9f9f9;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }
    .details-table th, .details-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .details-table th {
      background-color: #addaf7;
      font-weight: 600;
      width: 30%;
      color: #333;
    }
    .button {
      display: inline-block;
      background-color: #3f87d6;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: background-color 0.3s ease;
      font-size: 16px;
      letter-spacing: 0.5px;
    }
    .button:hover {
      background-color: #3678c0;
    }
    .warning {
      background-color: #fff8f8;
      border-left: 4px solid #ff5252;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    .footer {
      background-color: #addaf7;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #333;
    }
    .highlight {
      background-color: #addaf7;
      padding: 2px 4px;
      border-radius: 2px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo-container">
      <img src="https://philtechbusiness.ph/wp-content/uploads/2023/06/20000-X-5000-TRANSPARENT13.png" alt="PHILTECH BUSINESS GROUP Logo" class="logo">
    </div>
    <div class="header">
      <h1>Welcome to PHILTECH BUSINESS GROUP!</h1>
    </div>
    <div class="content">
      <p class="greeting">Good day Mr/Ms {{userName}},</p>
      <p>We are excited to inform you that your account has been <span class="highlight">successfully created</span>! Below are your login credentials:</p>
      <table class="details-table">
        <tr><th>Email</th><td>{{email}}</td></tr>
        <tr><th>Password</th><td>{{password}}</td></tr>
      </table>
      <div class="warning">
        <p style="margin: 0;"><strong>IMPORTANT:</strong> Please ensure that you enter your login credentials exactly as shown above to avoid any errors.
        For your security, we strongly recommend that you change your password immediately after logging in.</p>
      </div>
      <div class="button-container">
        <a href="https://app.philtechbusiness.ph/login" class="button">Log In & Change Password</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{year}} PHILTECH BUSINESS GROUP. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`

// Main UserTable component
export function UserTable() {
  const [allData, setAllData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const { toast } = useToast()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isBulkUploading, setIsBulkUploading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState("")
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: any }>({})
  const [pageSize, setPageSize] = useState(10)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "analytics" | "grid">("table")
  const [bulkActionUsers, setBulkActionUsers] = useState<number[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false)
  const [userDetailData, setUserDetailData] = useState<any | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const [animateTable, setAnimateTable] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isEmailTemplateDialogOpen, setIsEmailTemplateDialogOpen] = useState(false)
  const [emailTemplate, setEmailTemplate] = useState(defaultEmailTemplate)
  const [isEmailSending, setIsEmailSending] = useState(false)
  const [emailProgress, setEmailProgress] = useState(0)
  const [emailCurrentBatch, setEmailCurrentBatch] = useState({ current: 0, total: 0 })
  const [emailResults, setEmailResults] = useState<{ success: any[]; failed: any[]; total: number } | null>(null)
  const [antiSpamFeatures, setAntiSpamFeatures] = useState({
    dkim: true,
    spf: true,
    personalizedSubject: true,
    unsubscribeLink: true,
    plainTextAlternative: true,
  })
  const [bulkCredits, setBulkCredits] = useState<number | null>(null);
  const [isRetailerDialogOpen, setIsRetailerDialogOpen] = useState(false);
  const [retailerCountSettings, setRetailerCountSettings] = useState({
    Basic_Merchant_Package: 3,
    Premium_Merchant_Package: 6,
    Elite_Distributor_Package: 10,
    Elite_Plus_Distributor_Package: 15,
  });
  const [customRetailerCount, setCustomRetailerCount] = useState<number | null>(null);
  const [retailerCountLoading, setRetailerCountLoading] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{
    total: number;
    completed: number;
    failed: number[];
    isUpdating: boolean;
  }>({ total: 0, completed: 0, failed: [], isUpdating: false });
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);

  // Enable animations after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateTable(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const table = useReactTable({
    data: allData,
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
    onGlobalFilterChange: setGlobalFilter,
  })

  // Set initial page size
  useEffect(() => {
    table.setPageSize(pageSize)
  }, [pageSize, table])

  const fetchData = async (filters: any = {}, sorting: SortingState = []) => {
    setLoading(true)
    setRefreshLoading(true)
    try {
      // Add role filter based on active tab
      const filtersWithTab = { ...filters }
      if (activeTab !== "all") {
        filtersWithTab.role = activeTab
      }

      const users: any = await getUsers(filtersWithTab, sorting)
      console.log(users)
      if (users.success) {
        // Filter users to only include those with the specified package types
        const filteredUsers = users.data.filter((user: any) => {
          return [
            "Basic_Merchant_Package",
            "Premium_Merchant_Package",
            "Elite_Distributor_Package",
            "Elite_Plus_Distributor_Package",
          ].includes(user.user_role)
        })
        setAllData(filteredUsers)
      } else {
        throw new Error(users.message)
      }
      table.setPageIndex(0) // Reset to the first page when new data is loaded
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshLoading(false)
    }
  }

  useEffect(() => {
    fetchData(activeFilters, sorting)
  }, [sorting, activeTab])

  const handleRefresh = () => {
    fetchData(activeFilters, sorting)
  }

  const handleRowClick = (user: any) => {
    if (viewMode === "grid") {
      setUserDetailData(user)
      setIsUserDetailOpen(true)
    } else {
      setSelectedUser(user)
    }
  }

  const handleCreateUser = () => {
    setIsCreating(true)
    setCreateLoading(true)
  }

  const handleBulkUpload = () => {
    setIsBulkUploading(true)
  }

  // Improve error handling for user operations
  const handleUserUpdate = async (updatedUser: any) => {
    try {
      const result = await updateUser(updatedUser)

      if (result.success) {
        // Update the user in the allData array
        setAllData((prevData) => prevData.map((user) => (user.ID === updatedUser.ID ? result.data : user)))
        // Update the selected user
        setSelectedUser(result.data)
        toast({
          title: "Success",
          description: "User updated successfully.",
        })
      } else {
        throw new Error(result.message || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user. Please try again.",
        variant: "destructive",
      })
    } finally {
      if (isUserDetailOpen) {
        setIsUserDetailOpen(false)
      }
    }
  }

  const handleUserCreate = async (newUser: any) => {
    try {
      setCreateLoading(true)
      const result = await createUser(newUser)

      if (result.success) {
        // Add the new user to the allData array
        setAllData((prevData) => [result.data, ...prevData])
        setIsCreating(false)
        toast({
          title: "Success",
          description: "User created successfully.",
        })
      } else {
        throw new Error(result.message || "Failed to create user")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setUserToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setDeleteLoading(userToDelete)
      const result = await deleteUser(userToDelete)
      if (result.success) {
        // Remove the user from the allData array
        setAllData((prevData) => prevData.filter((user) => user.ID !== userToDelete))

        // If the deleted user is currently selected, clear the selection
        if (selectedUser && selectedUser.ID === userToDelete) {
          setSelectedUser(null)
        }

        toast({
          title: "Success",
          description: "User deleted successfully.",
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setDeleteLoading(null)
      setUserToDelete(null)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (bulkActionUsers.length === 0) return

    try {
      setBulkDeleteLoading(true)
      let successCount = 0
      let failCount = 0

      // Process each user deletion sequentially
      for (const userId of bulkActionUsers) {
        try {
          const result = await deleteUser(userId)
          if (result.success) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          failCount++
        }
      }

      // Update the data
      if (successCount > 0) {
        setAllData((prevData) => prevData.filter((user) => !bulkActionUsers.includes(user.ID)))

        toast({
          title: "Bulk Delete Complete",
          description: `Successfully deleted ${successCount} users${failCount > 0 ? `, failed to delete ${failCount} users` : ""}.`,
        })
      } else {
        toast({
          title: "Bulk Delete Failed",
          description: "Failed to delete any users. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in bulk delete:", error)
      toast({
        title: "Error",
        description: "An error occurred during bulk delete operation.",
        variant: "destructive",
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      setBulkDeleteLoading(false)
      setBulkActionUsers([])
      setRowSelection({})
    }
  }

  // const handleConfirmCredits = async () => {
  //   setRetailerCountLoading(true);
  //   try {
  //     const selectedRows = table.getFilteredSelectedRowModel().rows;
  //     const updates = selectedRows.map((row) => ({
  //       ID: row.original.ID,
  //       user_credits: bulkCredits || 0,
  //     }));

  //     const result = await bulkUpdateUserCredits(updates);
  //     if (result.success) {
  //       setAllData((prevData) =>
  //         prevData.map((user) => {
  //           const updatedUser = updates.find((u) => u.ID === user.ID);
  //           return updatedUser ? { ...user, user_credits: updatedUser.user_credits } : user;
  //         })
  //       );
  //       toast({
  //         title: "Success",
  //         description: `Updated credits for ${updates.length} users.`,
  //       });
  //     } else {
  //       throw new Error(result.message || "Failed to update credits");
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to update credits. Please try again.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsCreditsDialogOpen(false);
  //     setBulkCredits(null);
  //     setBulkActionUsers([]);
  //     setRowSelection({});
  //     setRetailerCountLoading(false);
  //   }
  // }; 
  const handleBulkEmail = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedUserIds = selectedRows.map((row) => row.original.ID)

    if (selectedUserIds.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select at least one user to send an email.",
        variant: "destructive",
      })
      return
    }

    setBulkActionUsers(selectedUserIds)
    setIsEmailTemplateDialogOpen(true)
  }

  const handleSendBulkEmail = async () => {
    try {
      setIsEmailSending(true);
      setEmailProgress(0);

      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const selectedUsers = selectedRows.map((row) => row.original);

      const totalBatches = Math.ceil(selectedUsers.length / 5);
      setEmailCurrentBatch({ current: 0, total: totalBatches });

      const results: {
        success: any[];
        failed: { user: any; error: string }[];
        total: number;
      } = {
        success: [],
        failed: [],
        total: selectedUsers.length,
      };

      // Process users in batches for UI updates
      for (let i = 0; i < selectedUsers.length; i += 5) {
        const batch = selectedUsers.slice(i, i + 5);
        const batchNumber = Math.floor(i / 5) + 1;
        setEmailCurrentBatch({ current: batchNumber, total: totalBatches });

        // Process each user in the batch sequentially
        for (let j = 0; j < batch.length; j++) {
          const user = batch[j];
          const overallIndex = i + j;
          const progressPercent = Math.min(
            Math.round((overallIndex / selectedUsers.length) * 100),
            95
          );
          setEmailProgress(progressPercent);

          try {
            // Generate a temporary password
            const password = generateRandomPassword();

            // Update user password in DB
            const passwordResult = await updatePassword({
              ID: user.ID,
              password,
            });

            if (!passwordResult.success) {
              results.failed.push({
                user,
                error: passwordResult.message || "Failed to update password",
              });
              continue;
            }

            // Assign plain password for email use
            user.user_pass = password;

            // Send welcome email with the password
            const result = await sendWelcomeEmail(
              user.user_email,
              user,
              password,
              emailTemplate,
              antiSpamFeatures
            );

            if (result.success) {
              results.success.push(user);
            } else {
              results.failed.push({
                user,
                error: result.error || "Failed to send email",
              });
            }
          } catch (error) {
            results.failed.push({
              user,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }

          // Small delay to prevent UI freezing
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      setEmailProgress(100);
      setEmailResults(results);

      if (results.success.length > 0) {
        toast({
          title: "Emails Sent Successfully",
          description: `Successfully sent emails to ${results.success.length} out of ${results.total} users`,
        });
      } else {
        toast({
          title: "Email Sending Failed",
          description: "Failed to send any emails. Please try again.",
          variant: "destructive",
        });
      }

      setTimeout(() => {
        setIsEmailTemplateDialogOpen(false);
        setIsEmailSending(false);
        setEmailResults(null);
        setBulkActionUsers([]);
        setRowSelection({});
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send emails. Please try again.",
        variant: "destructive",
      });
      setIsEmailSending(false);
    }
  };


  const handleExportCSV = () => {
    setExportLoading(true)
    try {
      // Get the current filtered data
      const data = table.getFilteredRowModel().rows.map((row) => row.original)

      // Convert to CSV
      const headers = [
        "ID",
        "Name",
        "Email",
        "Contact Number",
        "Role",
        "Level",
        "Credits",
        "Merchant ID",
        "Business Name",
        "Business Address",
        "Date Registered",
        "Status",
      ]

      const csvContent = [
        headers.join(","),
        ...data.map((row) => {
          return [
            row.ID || "",
            row.user_nicename || "",
            row.user_email || "",
            row.user_contact_number || "",
            row.user_role || "",
            row.user_level || "",
            row.user_credits || "",
            row.merchant_id || "",
            row.business_name || "",
            row.business_address || "",
            row.user_registered ? new Date(row.user_registered).toISOString() : "",
            row.user_status ? "Active" : "Inactive",
          ]
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(",")
        }),
      ].join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `users_export_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: "User data has been exported to CSV.",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export user data.",
        variant: "destructive",
      })
    } finally {
      setExportLoading(false)
    }
  }

  const handleBulkRetailerCount = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedUserIds = selectedRows.map((row) => row.original.ID);
    if (selectedUserIds.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select at least one user to update retailer count.",
        variant: "destructive",
      });
      return;
    }
    setBulkActionUsers(selectedUserIds);
    setIsRetailerDialogOpen(true);
  };

  const handleConfirmRetailerCount = async () => {
    setRetailerCountLoading(true);
    setUpdateProgress({ total: 0, completed: 0, failed: [], isUpdating: true });

    try {
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const updates = selectedRows.map((row) => {
        const user = row.original;
        if (customRetailerCount !== null) {
          return { ID: user.ID, retailer_count: customRetailerCount };
        }
        return {
          ID: user.ID,
          retailer_count: retailerCountSettings[user.user_role as keyof typeof retailerCountSettings] || 0,
        };
      });

      setUpdateProgress((prev) => ({ ...prev, total: updates.length }));

      // Process updates one by one
      let successCount = 0;
      const failedUpdates: number[] = [];

      for (const update of updates) {
        const result = await bulkUpdateUserRetailerCount(update);
        if (result.success && result.data) {
          setAllData((prevData) =>
            prevData.map((user) =>
              user.ID === result.data.ID
                ? { ...user, retailer_count: result.data.retailer_count }
                : user
            )
          );
          successCount++;
          setUpdateProgress((prev) => ({
            ...prev,
            completed: prev.completed + 1,
          }));
        } else {
          failedUpdates.push(update.ID);
          setUpdateProgress((prev) => ({
            ...prev,
            failed: [...prev.failed, update.ID],
          }));
        }
      }

      if (successCount === updates.length) {
        toast({
          title: "Success",
          description: `Updated retailer count for ${successCount} users.`,
        });
      } else {
        toast({
          title: "Partial Success",
          description: `Updated ${successCount} users. Failed for user IDs: ${failedUpdates.join(", ") || "none"}.`,
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update retailer counts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRetailerDialogOpen(false);
      setCustomRetailerCount(null);
      setBulkActionUsers([]);
      setRowSelection({});
      setRetailerCountLoading(false);
      setUpdateProgress({ total: 0, completed: 0, failed: [], isUpdating: false });
    }
  };

  const handleBulkAction = async (action: string) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to perform a bulk action.",
        variant: "destructive",
      });
      return;
    }

    const selectedUserIds = selectedRows.map((row) => row.original.ID);
    setBulkActionUsers(selectedUserIds);
    setBulkAction(action);

    if (action === "credits") {
      setIsCreditsDialogOpen(true);
    } else if (action === "retailer_count") {
      setIsRetailerDialogOpen(true);
    }
  };

  // Generate and download CSV template
  const handleDownloadTemplate = () => {
    try {
      // Define the CSV template headers
      const headers = [
        "ACCOUNT TYPE",
        "MID",
        "TID",
        "STORE NAME",
        "ADDRESS",
        "NAME",
        "CONTACT NUMBER",
        "EMAIL ADDRESS",
        "DATE JOINED",
        "REMARKS",
      ]

      // Create sample data row
      const sampleRow = [
        "BASIC MERCHANT ACCOUNT",
        "M12345",
        "T67890",
        "Sample Store",
        "123 Main St, City",
        "John Doe",
        "1234567890",
        "email@example.com",
        "2023-01-01",
        "Sample remarks",
      ]

      // Create CSV content
      const csvContent = [headers.join(","), sampleRow.map((value) => `"${value}"`).join(",")].join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `user_upload_template.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Template Downloaded",
        description: "CSV template has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error downloading template:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download CSV template.",
        variant: "destructive",
      })
    }
  }

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters)
    fetchData(filters, sorting)
  }

  const getFilterBadgeCount = () => {
    return Object.keys(activeFilters).filter(
      (key) =>
        activeFilters[key] !== undefined &&
        activeFilters[key] !== "" &&
        activeFilters[key] !== "all" &&
        (!Array.isArray(activeFilters[key]) || activeFilters[key].length > 0) &&
        !(key === "dateRange" && !activeFilters[key].from && !activeFilters[key].to),
    ).length
  }

  // Render skeleton loading state
  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell className="w-[40px] p-2">
          <Skeleton className="h-4 w-4" />
        </TableCell>
        {Array.from({ length: columns.length }).map((_, cellIndex) => (
          <TableCell key={`skeleton-cell-${index}-${cellIndex}`} className="whitespace-nowrap">
            <Skeleton className="h-6 w-full" />
          </TableCell>
        ))}
        <TableCell className="w-[100px]">
          <Skeleton className="h-8 w-20" />
        </TableCell>
      </TableRow>
    ))
  }

  // Render grid view skeleton
  const renderGridSkeleton = () => {
    return Array.from({ length: 8 }).map((_, index) => (
      <motion.div
        key={`grid-skeleton-${index}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card className="h-full">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex justify-between mt-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ))
  }

  // Render grid view
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          renderGridSkeleton()
        ) : (
          <AnimatePresence>
            {table.getRowModel().rows.map((row, index) => {
              const user = row.original
              return (
                <motion.div
                  key={user.ID}
                  initial={animateTable ? { opacity: 0, y: 20 } : false}
                  animate={animateTable ? { opacity: 1, y: 0 } : false}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  onClick={() => handleRowClick(user)}
                >
                  <Card className="h-full cursor-pointer hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{user.user_nicename || "Unnamed User"}</CardTitle>
                          <CardDescription className="text-xs">{user.user_email}</CardDescription>
                        </div>
                        <Badge
                          variant={user.user_status === 1 ? "default" : "secondary"}
                          className={`${user.user_status === 1 ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}`}
                        >
                          {user.user_status === 1 ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-normal">
                          {user.user_role?.replace(/_/g, " ") || "No Role"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formatNumber(user.user_credits || 0)}</span>
                      </div>
                      {user.merchant_id && (
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>ID: {user.merchant_id}</span>
                        </div>
                      )}
                      {user.user_registered && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Joined: {formatDate(user.user_registered)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(user)
                          }}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          onClick={(e) => handleDeleteClick(user.ID, e)}
                        >
                          {deleteLoading === user.ID ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    )
  }

  // Get selected row count
  const selectedRowCount = Object.keys(rowSelection).length

  // Hugging Face API integration
  const generateSummary = async (users: any[]) => {
    const fullPrompt = `Summarize the following user data for today:\n\n${JSON.stringify(users)}`
    try {
      const response = await fetch("https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-alpha", {
        method: "POST",
        headers: {
          Authorization: `Bearer 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`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.2,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to generate summary")

      const data = await response.json()
      return data.generated_text
    } catch (error) {
      console.error("Error generating summary:", error)
      throw error
    }
  }

  // Fetch today's user data and generate summary
  const handleGenerateReport = async () => {
    setLoading(true)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayUsers = allData.filter((user) => {
        const registeredDate = new Date(user.user_registered)
        return registeredDate >= today
      })

      if (todayUsers.length === 0) {
        toast({
          title: "No Users Found",
          description: "No users registered today.",
          variant: "destructive",
        })
        return
      }

      const summary = await generateSummary(todayUsers)
      toast({
        title: "Summary Generated",
        description: summary,
        variant: "default",
        duration: 10000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">User Management</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshLoading}>
                    {refreshLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh user data</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    disabled={exportLoading || allData.length === 0}
                  >
                    {exportLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export users to CSV</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" disabled={createLoading}>
                        {createLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Add User
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Add new users</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCreateUser}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Single User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadTemplate}>
                  <FileText className="h-4 w-4 mr-2" />
                  Download CSV Template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleGenerateReport} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Generate Report
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Generate today's user summary</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search
              className={`absolute left-2 top-2.5 h-4 w-4 ${searchFocused ? "text-primary" : "text-muted-foreground"} transition-colors`}
            />
            <Input
              placeholder="Search by name, email, merchant ID..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className={`pl-8 w-full transition-all duration-200 ${searchFocused ? "border-primary ring-1 ring-primary" : ""}`}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              ref={searchInputRef}
            />
            {globalFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7"
                onClick={() => {
                  setGlobalFilter("")
                  searchInputRef.current?.focus()
                }}
              >
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>

          <div className="flex gap-2 ml-auto">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "table" | "analytics" | "grid")}>
              <TabsList className="h-9">
                <TabsTrigger value="table" className="text-xs px-3">
                  <LayoutList className="h-4 w-4 mr-1" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="grid" className="text-xs px-3">
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs px-3">
                  <LineChart className="h-4 w-4 mr-1" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  Filters
                  {getFilterBadgeCount() > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 px-1.5 py-0 h-5 min-w-5 flex items-center justify-center"
                    >
                      {getFilterBadgeCount()}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetTitle>Advanced Filters</SheetTitle>
                <AdvancedFilters onFilterChange={handleFilterChange} initialFilters={activeFilters} />
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Table Settings</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowColumnSettings(!showColumnSettings)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Column Visibility
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Rows per page</DropdownMenuLabel>
                {[10, 20, 50, 100].map((size) => (
                  <DropdownMenuItem key={size} onClick={() => setPageSize(size)}>
                    {pageSize === size && <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />}
                    {pageSize !== size && <div className="w-4 h-4 mr-2" />}
                    {size} rows
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {showColumnSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/50 p-4 rounded-lg mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Column Visibility</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowColumnSettings(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Switch
                        id={`column-${column.id}`}
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(value)}
                      />
                      <Label htmlFor={`column-${column.id}`} className="text-sm">
                        {column.id.charAt(0).toUpperCase() +
                          column.id
                            .slice(1)
                            .replace(/([A-Z])/g, " $1")
                            .trim()}
                      </Label>
                    </div>
                  )
                })}
            </div>
          </motion.div>
        )}

        <TabsList className="mb-4">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="Basic_Merchant_Package">Basic Package</TabsTrigger>
          <TabsTrigger value="Premium_Merchant_Package">Premium Package</TabsTrigger>
          <TabsTrigger value="Elite_Distributor_Package">Elite Package</TabsTrigger>
          <TabsTrigger value="Elite_Plus_Distributor_Package">Elite Plus Package</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {viewMode === "analytics" ? (
            <UserAnalytics data={allData} />
          ) : (
            <>
              {selectedRowCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-muted/50 p-2 rounded-lg mb-4 flex items-center justify-between"
                >
                  <div className="text-sm">
                    <span className="font-medium">{selectedRowCount}</span> user(s) selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkRetailerCount}
                    >
                      <Store className="h-4 w-4 mr-2" />
                      Set Retailer Count
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkEmail}
                      disabled={emailLoading || isEmailSending}
                    >
                      {emailLoading || isEmailSending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Email Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const selectedRows = table.getFilteredSelectedRowModel().rows
                        const selectedUserIds = selectedRows.map((row) => row.original.ID)
                        setBulkActionUsers(selectedUserIds)
                        setIsBulkDeleteDialogOpen(true)
                      }}
                      disabled={bulkDeleteLoading}
                    >
                      {bulkDeleteLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete Selected
                    </Button>
                  </div>
                </motion.div>
              )}

              {viewMode === "grid" ? (
                renderGridView()
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="rounded-md border-0">
                      <Table>
                        <TableHeader>
                          {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                              <TableHead className="w-[40px] p-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300"
                                  checked={table.getFilteredRowModel().rows.length > 0 && table.getIsAllRowsSelected()}
                                  onChange={table.getToggleAllRowsSelectedHandler()}
                                />
                              </TableHead>
                              {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="whitespace-nowrap">
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                              ))}
                              <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                          ))}
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            renderSkeletonRows()
                          ) : table.getRowModel().rows?.length ? (
                            <AnimatePresence>
                              {table.getRowModel().rows.map((row) => (
                                <motion.tr
                                  key={row.id}
                                  initial={animateTable ? { opacity: 0, y: 5 } : false}
                                  animate={animateTable ? { opacity: 1, y: 0 } : false}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className={`${row.getIsSelected() ? "bg-muted" : ""} cursor-pointer hover:bg-muted/50 data-[state=selected]:bg-muted`}
                                  onClick={() => handleRowClick(row.original)}
                                >
                                  <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300"
                                      checked={row.getIsSelected()}
                                      onChange={row.getToggleSelectedHandler()}
                                    />
                                  </TableCell>
                                  {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="whitespace-nowrap">
                                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                  ))}
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRowClick(row.original)
                                          }}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            // Simulate sending an email
                                            toast({
                                              title: "Email Sent",
                                              description: `Email sent to ${row.original.user_email}`,
                                            })
                                          }}
                                        >
                                          <Mail className="h-4 w-4 mr-2" />
                                          Send Email
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteClick(row.original.ID, e)
                                          }}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          {deleteLoading === row.original.ID ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-4 w-4 mr-2" />
                                          )}
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={columns.length + 2} className="h-24 text-center">
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                  <AlertCircle className="h-8 w-8 mb-2" />
                                  <p>No users found.</p>
                                  <p className="text-sm">Try adjusting your filters or search terms.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                      {table.getFilteredRowModel().rows.length} user(s) found
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                          value={`${table.getState().pagination.pageSize}`}
                          onValueChange={(value) => {
                            table.setPageSize(Number(value))
                          }}
                        >
                          <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
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
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          className="hidden h-8 w-8 p-0 lg:flex"
                          onClick={() => table.setPageIndex(0)}
                          disabled={!table.getCanPreviousPage()}
                        >
                          <span className="sr-only">Go to first page</span>
                          <ChevronLeft className="h-4 w-4" />
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => table.previousPage()}
                          disabled={!table.getCanPreviousPage()}
                        >
                          <span className="sr-only">Go to previous page</span>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => table.nextPage()}
                          disabled={!table.getCanNextPage()}
                        >
                          <span className="sr-only">Go to next page</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="hidden h-8 w-8 p-0 lg:flex"
                          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                          disabled={!table.getCanNextPage()}
                        >
                          <span className="sr-only">Go to last page</span>
                          <ChevronRight className="h-4 w-4" />
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Role-specific tabs */}
        {[
          "Basic_Merchant_Package",
          "Premium_Merchant_Package",
          "Elite_Distributor_Package",
          "Elite_Plus_Distributor_Package",
        ].map((role) => (
          <TabsContent key={role} value={role} className="mt-0">
            {viewMode === "analytics" ? (
              <UserAnalytics data={allData.filter((user) => user.user_role === role)} />
            ) : viewMode === "grid" ? (
              renderGridView()
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="rounded-md border-0">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            <TableHead className="w-[40px] p-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={table.getFilteredRowModel().rows.length > 0 && table.getIsAllRowsSelected()}
                                onChange={table.getToggleAllRowsSelectedHandler()}
                              />
                            </TableHead>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id} className="whitespace-nowrap">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            ))}
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          renderSkeletonRows()
                        ) : table.getRowModel().rows?.length ? (
                          <AnimatePresence>
                            {table.getRowModel().rows.map((row) => (
                              <motion.tr
                                key={row.id}
                                initial={animateTable ? { opacity: 0, y: 5 } : false}
                                animate={animateTable ? { opacity: 1, y: 0 } : false}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`${row.getIsSelected() ? "bg-muted" : ""} cursor-pointer hover:bg-muted/50`}
                                onClick={() => handleRowClick(row.original)}
                              >
                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300"
                                    checked={row.getIsSelected()}
                                    onChange={row.getToggleSelectedHandler()}
                                  />
                                </TableCell>
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id} className="whitespace-nowrap">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleRowClick(row.original)
                                        }}
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          // Simulate sending an email
                                          toast({
                                            title: "Email Sent",
                                            description: `Email sent to ${row.original.user_email}`,
                                          })
                                        }}
                                      >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Email
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteClick(row.original.ID, e)
                                        }}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        {deleteLoading === row.original.ID ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4 mr-2" />
                                        )}
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={columns.length + 2} className="h-24 text-center">
                              <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <AlertCircle className="h-8 w-8 mb-2" />
                                <p>No users found with this role.</p>
                                <p className="text-sm">Try adjusting your filters or search terms.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* User Dialog for editing */}
      {selectedUser && (
        <UserDialog
          user={selectedUser}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          onUserUpdate={handleUserUpdate}
          mode="edit"
        />
      )}

      {/* User Dialog for creating */}
      {isCreating && (
        <UserDialog
          user={null}
          open={isCreating}
          onOpenChange={(open) => !open && setIsCreating(false)}
          onUserCreate={handleUserCreate}
          mode="create"
        />
      )}

      {/* User Detail Dialog for grid view */}
      {isUserDetailOpen && userDetailData && (
        <Sheet open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <SheetTitle>User Details</SheetTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(userDetailData)
                      setIsUserDetailOpen(false)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setUserToDelete(userDetailData.ID)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{userDetailData.user_nicename || "Unnamed User"}</h3>
                  <Badge
                    variant={userDetailData.user_status === 1 ? "default" : "secondary"}
                    className={`${userDetailData.user_status === 1 ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}`}
                  >
                    {userDetailData.user_status === 1 ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="grid gap-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Email</span>
                    <span className="text-sm">{userDetailData.user_email}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Role</span>
                    <Badge variant="outline">{userDetailData.user_role?.replace(/_/g, " ") || "No Role"}</Badge>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Credits</span>
                    <span className="text-sm">{formatNumber(userDetailData.user_credits || 0)}</span>
                  </div>

                  {userDetailData.merchant_id && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">Merchant ID</span>
                      <span className="text-sm">{userDetailData.merchant_id}</span>
                    </div>
                  )}

                  {userDetailData.business_name && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">Business Name</span>
                      <span className="text-sm">{userDetailData.business_name}</span>
                    </div>
                  )}

                  {userDetailData.business_address && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">Business Address</span>
                      <span className="text-sm">{userDetailData.business_address}</span>
                    </div>
                  )}

                  {userDetailData.user_registered && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">Date Registered</span>
                      <span className="text-sm">{formatDate(userDetailData.user_registered)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Bulk Upload Dialog */}
      {isBulkUploading && (
        <BulkUploadDialog
          open={isBulkUploading}
          onOpenChange={(open) => !open && setIsBulkUploading(false)}
          onSuccess={(newUsers) => {
            setAllData((prevData) => [...newUsers, ...prevData])
            setIsBulkUploading(false)
            toast({
              title: "Bulk Upload Successful",
              description: `Successfully uploaded ${newUsers.length} users.`,
            })
            handleRefresh() // Refresh the data to ensure we have the latest
          }}
          allUsers={allData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLoading !== null}
            >
              {deleteLoading !== null ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {bulkActionUsers.length} users?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected users and all their associated
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteLoading}
            >
              {bulkDeleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Email Dialog */}
      <AlertDialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Email {bulkActionUsers.length} users</AlertDialogTitle>
            <AlertDialogDescription>
              This would send an email to all selected users. This feature is not implemented in this demo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={emailLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendBulkEmail} disabled={emailLoading}>
              {emailLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Emails"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Template Dialog */}
      <Dialog open={isEmailTemplateDialogOpen} onOpenChange={setIsEmailTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Send Emails to Selected Users
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {!isEmailSending && !emailResults && (
              <>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Selected Recipients</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bulkActionUsers.length > 0 &&
                      table
                        .getFilteredRowModel()
                        .rows.filter((row) => bulkActionUsers.includes(row.original.ID))
                        .map((row) => (
                          <Badge key={row.original.ID} variant="outline" className="bg-primary/10 text-primary">
                            {row.original.user_nicename || row.original.user_email}
                          </Badge>
                        ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {bulkActionUsers.length} user(s) selected to receive this email
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Email Template Editor</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEmailTemplate(defaultEmailTemplate)}
                      className="text-xs h-7"
                    >
                      Reset to Default
                    </Button>
                  </div>
                  <div className="border rounded-md h-[300px] overflow-hidden">
                    <textarea
                      value={emailTemplate}
                      onChange={(e) => setEmailTemplate(e.target.value)}
                      className="w-full h-full p-4 font-mono text-sm resize-none"
                    />
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <p>You can use the following placeholders in your template:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                        <li>
                          <code>{"{{userName}}"}</code> - User's name
                        </li>
                        <li>
                          <code>{"{{email}}"}</code> - User's email address
                        </li>
                        <li>
                          <code>{"{{password}}"}</code> - Password placeholder (for security, actual passwords are not
                          sent)
                        </li>
                        <li>
                          <code>{"{{year}}"}</code> - Current year
                        </li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-primary" />
                    Anti-Spam Measures
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Enable these features to help prevent your emails from being marked as spam by email providers.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="dkim">DKIM Authentication</Label>
                        <p className="text-xs text-muted-foreground">
                          Digitally signs emails to verify sender identity
                        </p>
                      </div>
                      <Switch
                        id="dkim"
                        checked={antiSpamFeatures.dkim}
                        onCheckedChange={(checked) => setAntiSpamFeatures({ ...antiSpamFeatures, dkim: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="spf">SPF Records</Label>
                        <p className="text-xs text-muted-foreground">Verifies sending server is authorized</p>
                      </div>
                      <Switch
                        id="spf"
                        checked={antiSpamFeatures.spf}
                        onCheckedChange={(checked) => setAntiSpamFeatures({ ...antiSpamFeatures, spf: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="personalized">Personalized Subject</Label>
                        <p className="text-xs text-muted-foreground">Includes recipient's name in email subject</p>
                      </div>
                      <Switch
                        id="personalized"
                        checked={antiSpamFeatures.personalizedSubject}
                        onCheckedChange={(checked) =>
                          setAntiSpamFeatures({ ...antiSpamFeatures, personalizedSubject: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="unsubscribe">Unsubscribe Link</Label>
                        <p className="text-xs text-muted-foreground">Adds unsubscribe option in email footer</p>
                      </div>
                      <Switch
                        id="unsubscribe"
                        checked={antiSpamFeatures.unsubscribeLink}
                        onCheckedChange={(checked) =>
                          setAntiSpamFeatures({ ...antiSpamFeatures, unsubscribeLink: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="plaintext">Plain Text Alternative</Label>
                        <p className="text-xs text-muted-foreground">Includes plain text version alongside HTML</p>
                      </div>
                      <Switch
                        id="plaintext"
                        checked={antiSpamFeatures.plainTextAlternative}
                        onCheckedChange={(checked) =>
                          setAntiSpamFeatures({ ...antiSpamFeatures, plainTextAlternative: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {isEmailSending && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sending Progress</span>
                    <span>{emailProgress}%</span>
                  </div>
                  <Progress value={emailProgress} className="h-2" />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    <span className="text-sm font-medium">Email Sending Details</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Total Recipients:</span>
                      <span>{bulkActionUsers.length}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Current Batch:</span>
                      <span>
                        {emailCurrentBatch.current} of {emailCurrentBatch.total}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Processed:</span>
                      <span>
                        {emailResults ? emailResults.success.length + emailResults.failed.length : 0} of{" "}
                        {bulkActionUsers.length}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Successful:</span>
                      <span>{emailResults ? emailResults.success.length : 0}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Failed:</span>
                      <span>{emailResults ? emailResults.failed.length : 0}</span>
                    </li>
                  </ul>
                </div>

                {emailProgress === 100 && (
                  <Alert className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>Email sending completed! The dialog will close automatically.</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {!isEmailSending && !emailResults && (
              <>
                <Button variant="outline" onClick={() => setIsEmailTemplateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendBulkEmail} disabled={bulkActionUsers.length === 0}>
                  Send Emails to {bulkActionUsers.length} Users
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRetailerDialogOpen} onOpenChange={setIsRetailerDialogOpen}>
        <DialogContent className="max-w-md">
          {updateProgress.isUpdating && (
            <div className="flex items-center justify-center z-50">
              <div className="max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Updating Retailer Counts</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Progress:</span>
                    <span>
                      {updateProgress.completed}/{updateProgress.total} users
                    </span>
                  </div>
                  <Progress
                    value={(updateProgress.completed / updateProgress.total) * 100 || 0}
                    className="w-full"
                  />
                  <div className="text-sm">
                    <p>
                      {updateProgress.completed} of {updateProgress.total} users updated successfully
                    </p>
                    {updateProgress.failed.length > 0 && (
                      <p className="text-red-500">
                        Failed for user IDs: {updateProgress.failed.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Set Retailer Count for {bulkActionUsers.length} Users
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Default Retailer Counts</h3>
              {Object.entries(retailerCountSettings).map(([packageType, count]) => (
                <div key={packageType} className="flex items-center gap-2 mb-2">
                  <Label className="w-40 text-sm">{packageType.replace(/_/g, " ")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={count}
                    onChange={(e) =>
                      setRetailerCountSettings({
                        ...retailerCountSettings,
                        [packageType]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-24"
                  />
                </div>
              ))}
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-2">Custom Retailer Count</h3>
              <Input
                type="number"
                min="0"
                placeholder="Enter custom count (optional)"
                value={customRetailerCount ?? ""}
                onChange={(e) => setCustomRetailerCount(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {customRetailerCount !== null
                  ? "Custom count will override default settings for all selected users"
                  : "Leave blank to use default counts based on package type"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRetailerDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRetailerCount}
              disabled={bulkActionUsers.length === 0 || retailerCountLoading}
            >
              {retailerCountLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                `Apply to ${bulkActionUsers.length} Users`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  )
}
