"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart3,
  ArrowUpDown,
  RefreshCcw,
  Download,
  Users,
  CreditCard,
  TrendingUp,
  Calendar,
  Wallet,
  ArrowRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  Info,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Import server actions from the dedicated file
import {
  getRetailers,
  createRetailer,
  updateRetailer,
  deleteRetailer,
  addCredits,
  getMerchantPackage,
  getRetailerCount,
  getRetailersById,
} from "@/actions/retailers"
import { useUserContext } from "@/hooks/use-user"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatNumber } from "@/lib/utils"
import { deleteUser, getRetailerCountById, getUserProfile } from "@/actions/user"

// Client Component
export default function RetailerManagement() {
  const { toast } = useToast()
  const router = useRouter()
  const chartRef = useRef(null)

  // State variables
  const [retailers, setRetailers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRetailers, setTotalRetailers] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("user_registered")
  const [sortOrder, setSortOrder] = useState("desc")
  const [selectedRetailer, setSelectedRetailer] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isTransferCreditsDialogOpen, setIsTransferCreditsDialogOpen] = useState(false)
  const [creditsAmount, setCreditsAmount] = useState("")
  const [transferReason, setTransferReason] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [refreshingCredit, setRefreshingCredit] = useState(false)
  const [error, setError] = useState<any>(null)
  const [userCredit, setUserCredit] = useState(0)
  const [analyticsData, setAnalyticsData] = useState({
    totalCredits: 0,
    activeRetailers: 0,
    inactiveRetailers: 0,
    averageCredits: 0,
    recentTransactions: [],
    creditDistribution: {
      high: 0,
      medium: 0,
      low: 0,
    },
    monthlyGrowth: [
      { month: "Jan", retailers: 5 },
      { month: "Feb", retailers: 8 },
      { month: "Mar", retailers: 12 },
      { month: "Apr", retailers: 15 },
      { month: "May", retailers: 20 },
      { month: "Jun", retailers: 22 },
    ],
  })
  const { user } = useUserContext()
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [packageInfo, setPackageInfo] = useState<any>(null)
  const [retailerCount, setRetailerCount] = useState(0)
  const [loadingPackageInfo, setLoadingPackageInfo] = useState(true)
  const [ownRetailerCount, setOwnRetailerCount] = useState<number | null | undefined>(0)
  // Form state with explicit defaults
  const initialFormData = {
    password: "",
    email: "",
    contactNumber: "",
    firstName: "",
    lastName: "",
    businessName: "",
    businessAddress: "",
    status: "1",
    uplineId: user?.id || 1,
  }
  const [formData, setFormData] = useState<any>(initialFormData)

  // Load retailers on component mount and when dependencies change
  useEffect(() => {
    fetchOwnRetailerCount()
    fetchRetailers()
  }, [currentPage, searchQuery, sortBy, sortOrder, activeTab])

  useEffect(() => {
    fetchUserCredit()
    fetchPackageInfo()
  }, [])

  // Calculate analytics data
  useEffect(() => {
    if (retailers.length > 0) {
      const active = retailers.filter((r: any) => r.user_status === 1).length
      const inactive = retailers.filter((r: any) => r.user_status === 0).length
      const totalCredits = retailers.reduce((sum, r: any) => sum + (r.user_credits || 0), 0)
      const avgCredits = totalCredits / retailers.length

      const highCredits = retailers.filter((r: any) => r.user_credits > 100).length
      const mediumCredits = retailers.filter((r: any) => r.user_credits >= 50 && r.user_credits <= 100).length
      const lowCredits = retailers.filter((r: any) => r.user_credits < 50).length

      setAnalyticsData({
        ...analyticsData,
        totalCredits,
        activeRetailers: active,
        inactiveRetailers: inactive,
        averageCredits: avgCredits,
        creditDistribution: {
          high: highCredits,
          medium: mediumCredits,
          low: lowCredits,
        },
      })
    }
  }, [retailers])

  // Fetch retailers from the server
  const fetchRetailers = async () => {
    setLoading(true)
    try {
      let statusFilter = ""
      if (activeTab === "active") statusFilter = "1"
      if (activeTab === "inactive") statusFilter = "0"

      const result: any = await getRetailersById(currentPage, 10, searchQuery, sortBy, sortOrder, statusFilter, user?.id || 0)

      setRetailers((prev: any) => prev.map((r: any) => ({ ...r, fadeOut: true })))
      setTimeout(() => {
        setRetailers(result.retailers || [])
        setTotalPages(result.totalPages || 1)
        setTotalRetailers(result.totalRetailers || 0)
        setLoading(false)
      }, 300)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch retailers",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const fetchOwnRetailerCount = async () => {
    try {
      if (!user?.id) return

      const retailerResult: any = await getRetailerCountById(user?.id || 0)
      setOwnRetailerCount(retailerResult.data)
      console.log("Own Retailer Count:", retailerResult.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch retailer count",
        variant: "destructive"
      })
    }
  }

  // Fetch package info and retailer count
  const fetchPackageInfo = async () => {
    setLoadingPackageInfo(true)
    try {
      if (!user?.id) return

      // Fetch merchant package info
      const packageResult: any = await getMerchantPackage(user.id)
      setPackageInfo(packageResult.packageInfo)

      // Fetch current retailer count
      const countResult = await getRetailerCount(user.id)
      setRetailerCount(countResult.count)
    } catch (error) {
      console.error("Failed to fetch package info:", error)
      toast({
        title: "Error",
        description: "Failed to fetch package information",
        variant: "destructive",
      })
    } finally {
      setLoadingPackageInfo(false)
    }
  }

  // Handle form input changes
  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value ?? "" }))
  }

  // Handle retailer creation
  const handleCreateRetailer = async (e: any) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Check if retailer limit has been reached
      if (packageInfo && retailerCount >= packageInfo.retailer_count) {
        toast({
          title: "Limit Reached",
          description: `You can only create a maximum of ${packageInfo.retailer_count} retailers with your current package.`,
          variant: "destructive",
        });
        setIsCreating(false);
        return;
      }

      const result = await createRetailer(formData);
      if (result.success) {
        toast({
          title: "Success",
          description: "Retailer created successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData(initialFormData); // Reset to initial state
        fetchRetailers();
        fetchPackageInfo(); // Refresh retailer count
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create retailer",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create retailer",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle retailer update
  const handleUpdateRetailer = async (e: any) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const result: any = await updateRetailer(selectedRetailer?.ID, formData)
      if (result.success) {
        toast({
          title: "Success",
          description: "Retailer updated successfully",
        })
        setIsEditDialogOpen(false)
        fetchRetailers()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update retailer",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle retailer deletion
  const handleDeleteRetailer = async () => {
    setIsDeleting(true)
    try {
      console.log(selectedRetailer?.ID)
      const result = await deleteUser(selectedRetailer?.ID)
      if (result.success) {
        toast({
          title: "Success",
          description: "Retailer deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        fetchRetailers()
        fetchPackageInfo() // Refresh retailer count
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete retailer",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle transferring credits
  const handleTransferCredits = async (e: any) => {
    e.preventDefault()
    setIsTransferring(true)
    try {
      const result = await addCredits(selectedRetailer?.ID, creditsAmount, transferReason, user?.id)
      if (result.success) {
        toast({
          title: "Success",
          description: `₱${creditsAmount} credits transferred successfully`,
        })
        setIsTransferCreditsDialogOpen(false)
        setCreditsAmount("")
        setTransferReason("")
        fetchRetailers()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to transfer credits",
        variant: "destructive",
      })
    } finally {
      setIsTransferring(false)
      fetchUserCredit()
    }
  }

  // Open edit dialog and populate form
  const openEditDialog = (retailer: any) => {
    if (!retailer) {
      toast({
        title: "Error",
        description: "No retailer selected",
        variant: "destructive",
      })
      return
    }
    setSelectedRetailer(retailer)
    setFormData({
      email: retailer.user_email ?? "",
      contactNumber: retailer.user_contact_number ?? "",
      firstName: retailer.first_name ?? "",
      lastName: retailer.last_name ?? "",
      businessName: retailer.business_name ?? "",
      businessAddress: retailer.business_address ?? "",
      status: retailer.user_status?.toString() ?? "1",
    })
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (retailer: any) => {
    if (!retailer) return
    setSelectedRetailer(retailer)
    setIsDeleteDialogOpen(true)
  }

  // Open view dialog
  const openViewDialog = (retailer: any) => {
    if (!retailer) return
    setSelectedRetailer(retailer)
    setIsViewDialogOpen(true)
  }

  // Open transfer credits dialog
  const openTransferCreditsDialog = (retailer: any) => {
    if (!retailer) return
    setSelectedRetailer(retailer)
    setIsTransferCreditsDialogOpen(true)
  }

  // Handle search
  const handleSearch = (e: any) => {
    e.preventDefault()
    setIsSearching(true)
    setCurrentPage(1)
    fetchRetailers().finally(() => {
      setTimeout(() => setIsSearching(false), 600)
    })
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    setCurrentPage(1)
  }

  // Handle pagination
  const goToPage = (page: any) => {
    setCurrentPage(page)
  }

  // Get status badge
  const getStatusBadge = (status: any) => {
    switch (status) {
      case 1:
        return <Badge className="bg-[#3D89D6]">Active</Badge>
      case 0:
        return <Badge className="bg-red-500">Inactive</Badge>
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>
    }
  }

  // Format date
  const formatDate = (dateString: any) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Format currency
  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Export retailers data
  const exportRetailersData = () => {
    setIsExporting(true)
    setTimeout(() => {
      setIsExporting(false)
      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully",
      })
    }, 1500)
  }

  // Refresh data
  const refreshData = () => {
    setIsRefreshing(true)
    Promise.all([fetchRetailers(), fetchPackageInfo()]).finally(() => {
      setTimeout(() => {
        setIsRefreshing(false)
        toast({
          title: "Data Refreshed",
          description: "Retailer data has been refreshed",
        })
      }, 600)
    })
  }

  const fetchUserCredit = useCallback(async () => {
    if (!user?.id) return

    setRefreshingCredit(true)
    setError(null)

    try {
      const response: any = await getUserProfile(user.id.toString())
      if (response.success) {
        setUserCredit(response.data?.user_credits || 0)
      } else {
        setError(response.message || "Failed to fetch user credit.")
        toast({
          title: "Error",
          description: response.message || "Failed to fetch user credit.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError("An unexpected error occurred. Please try again later.")
      toast({
        title: "Error",
        description: "Failed to fetch user credit. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshingCredit(false)
    }
  }, [user])

  // Table skeleton loader
  const TableSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[180px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[60px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-[70px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[90px]" />
          </TableCell>
          <TableCell>
            <div className="flex justify-end gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )

  // Calculate retailer limit status
  const getRetailerLimitStatus = () => {
    if (!packageInfo) return { color: "gray", text: "Loading package info..." }

    const maxRetailers = ownRetailerCount || packageInfo.retailer_count
    const percentage = (retailerCount / maxRetailers) * 100

    if (percentage >= 90) {
      return {
        color: "red",
        text: `Warning: You've used ${retailerCount} of ${maxRetailers} retailer slots (${Math.round(percentage)}%)`,
      }
    } else if (percentage >= 75) {
      return {
        color: "orange",
        text: `You've used ${retailerCount} of ${maxRetailers} retailer slots (${Math.round(percentage)}%)`,
      }
    } else {
      return {
        color: "green",
        text: `You've used ${retailerCount} of ${maxRetailers} retailer slots (${Math.round(percentage)}%)`,
      }
    }
  }

  const limitStatus = getRetailerLimitStatus()

  return (
    <div className="m-0 py-8 px-4 w-full max-w-[100vw]">
      <Tabs defaultValue="retailers" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList className="bg-[#f0f7ff]">
            <TabsTrigger value="retailers" className="data-[state=active]:bg-[#3D89D6] data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Retailers
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#3D89D6] data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="outline" size="sm" onClick={exportRetailersData} disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {isExporting ? "Exporting..." : "Export"}
            </Button>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 bg-muted p-2 px-4 rounded-lg shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <Wallet className="w-5 min-w-screen h-5 text-primary" />
              <div className="flex items-center">
                <span className="font-medium mr-1">Credit Balance:</span>
                {loading ? (
                  <Skeleton className="h-6 w-20" />
                ) : refreshingCredit ? (
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-1 animate-spin text-primary" />
                    <span className="font-bold text-primary">Refreshing...</span>
                  </div>
                ) : (
                  <motion.span
                    className="font-bold text-primary"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    ₱{formatNumber(userCredit)}
                  </motion.span>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1"
                        onClick={fetchUserCredit}
                        disabled={refreshingCredit}
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshingCredit ? "animate-spin" : ""}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh credit balance</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </motion.div>
          </div>
        </div>

        <TabsContent value="retailers" className="space-y-6 mt-0">
          <Card className="border shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white rounded-t-lg p-6 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10"
                initial={{ x: -200 }}
                animate={{ x: 500 }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", ease: "linear" }}
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                  <CardTitle className="text-2xl font-bold">Retailer Management</CardTitle>
                  <CardDescription className="text-blue-100">
                    Manage your retailers, transfer credits, and track performance
                  </CardDescription>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-white text-[#1A5EA2] hover:bg-blue-50 transition-all duration-300"
                    disabled={packageInfo && retailerCount >= packageInfo.retailer_count}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Retailer
                  </Button>
                </motion.div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Retailer Limit Alert */}
              {packageInfo && (
                <Alert
                  className={`mb-6 ${limitStatus.color === "red"
                    ? "bg-red-50 border-red-200"
                    : limitStatus.color === "orange"
                      ? "bg-orange-50 border-orange-200"
                      : "bg-green-50 border-green-200"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {limitStatus.color === "red" ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : limitStatus.color === "orange" ? (
                      <Info className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Info className="h-4 w-4 text-green-500" />
                    )}
                    <AlertTitle
                      className={`text-${limitStatus.color === "red" ? "red" : limitStatus.color === "orange" ? "orange" : "green"
                        }-500`}
                    >
                      Retailer Limit
                    </AlertTitle>
                  </div>
                  <AlertDescription className="mt-1">{limitStatus.text}</AlertDescription>
                  <div className="mt-2">
                    <Progress
                      value={(retailerCount / packageInfo.retailer_count) * 100}
                      className={`h-2 ${limitStatus.color === "red"
                        ? "bg-red-100"
                        : limitStatus.color === "orange"
                          ? "bg-orange-100"
                          : "bg-green-100"
                        }`}
                    // indicatorClassName={`${
                    //   limitStatus.color === "red"
                    //     ? "bg-red-500"
                    //     : limitStatus.color === "orange"
                    //       ? "bg-orange-500"
                    //       : "bg-green-500"
                    // }`}
                    />
                  </div>
                </Alert>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Button
                  variant={activeTab === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("all")}
                  className={activeTab === "all" ? "bg-[#3D89D6] hover:bg-[#1A5EA2]" : ""}
                >
                  All Retailers
                </Button>
                <Button
                  variant={activeTab === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("active")}
                  className={activeTab === "active" ? "bg-[#3D89D6] hover:bg-[#1A5EA2]" : ""}
                >
                  Active
                </Button>
                <Button
                  variant={activeTab === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("inactive")}
                  className={activeTab === "inactive" ? "bg-[#3D89D6] hover:bg-[#1A5EA2]" : ""}
                >
                  Inactive
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="w-full sm:w-auto flex-1">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search retailers..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={clearSearch}
                          className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Button type="submit" className="bg-[#3D89D6] hover:bg-[#1A5EA2]" disabled={isSearching}>
                      {isSearching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        "Search"
                      )}
                    </Button>
                  </form>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user_registered">Registration Date</SelectItem>
                      <SelectItem value="first_name">Name</SelectItem>
                      <SelectItem value="user_credits">Credits</SelectItem>
                      <SelectItem value="business_name">Business Name</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="transition-all duration-300"
                  >
                    <ArrowUpDown
                      className={`h-4 w-4 transition-transform duration-300 ${sortOrder === "asc" ? "rotate-0" : "rotate-180"}`}
                    />
                  </Button>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#f0f7ff]">
                    <TableRow>
                      <TableHead>Retailer</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableSkeleton />
                    ) : retailers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-muted-foreground">No retailers found</div>
                          {searchQuery && (
                            <Button variant="link" onClick={clearSearch} className="mt-2 text-[#3D89D6]">
                              Clear search
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      <AnimatePresence>
                        {retailers.map((retailer: any, index) => (
                          <motion.tr
                            key={retailer.ID}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="border-b hover:bg-[#f8fbff] transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={retailer.profile_pic_url || ""} />
                                  <AvatarFallback className="bg-[#e6f0fa] text-[#1A5EA2]">
                                    {(retailer.user_nicename || "").substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {`${retailer.user_nicename || ""} ${retailer.last_name || ""}`.trim() || "N/A"}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    <Badge className="bg-green-500">Retailer</Badge>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{retailer.business_name || "N/A"}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                                {retailer.business_address || "No address"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>{retailer.user_email || "N/A"}</div>
                              <div className="text-sm text-muted-foreground">
                                {retailer.user_contact_number || "No phone"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-[#1A5EA2]">
                                {retailer.user_credits?.toFixed(2) || "0.00"}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(retailer.user_status)}</TableCell>
                            <TableCell>{formatDate(retailer.user_registered)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => openViewDialog(retailer)}
                                    title="View Details"
                                    className="border-[#e6f0fa] hover:border-[#3D89D6] hover:bg-[#f0f7ff] transition-all duration-300 hover:shadow-md"
                                  >
                                    <Eye className="h-4 w-4 text-[#3D89D6]" />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => openEditDialog(retailer)}
                                    title="Edit"
                                    className="border-[#e6f0fa] hover:border-[#3D89D6] hover:bg-[#f0f7ff] transition-all duration-300 hover:shadow-md"
                                  >
                                    <Pencil className="h-4 w-4 text-[#3D89D6]" />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="border-[#e6f0fa] hover:border-[#3D89D6] hover:bg-[#f0f7ff] transition-all duration-300 hover:shadow-md"
                                    onClick={() => openTransferCreditsDialog(retailer)}
                                    title="Transfer Credits"
                                  >
                                    <Wallet className="h-4 w-4 text-[#3D89D6]" />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="border-[#e6f0fa] hover:border-red-300 hover:bg-red-50 transition-all duration-300 hover:shadow-md"
                                    onClick={() => openDeleteDialog(retailer)}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </motion.div>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {retailers.length} of {totalRetailers} retailers
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => goToPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="hover:bg-[#f0f7ff] hover:border-[#3D89D6]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => goToPage(page)}
                        className={
                          currentPage === page
                            ? "bg-[#3D89D6] hover:bg-[#1A5EA2]"
                            : "hover:bg-[#f0f7ff] hover:border-[#3D89D6]"
                        }
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="hover:bg-[#f0f7ff] hover:border-[#3D89D6]"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-0">
          <Card className="border shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white rounded-t-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-bold">Retailer Analytics</CardTitle>
                  <CardDescription className="text-blue-100">
                    Performance metrics and insights for your retailer network
                  </CardDescription>
                </div>
                <Select defaultValue="thisMonth">
                  <SelectTrigger className="w-[180px] bg-white text-[#1A5EA2] border-none">
                    <SelectValue placeholder="Time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="thisYear">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="border shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-muted-foreground">Total Retailers</div>
                      <Users className="h-4 w-4 text-[#3D89D6]" />
                    </div>
                    <div className="text-2xl font-bold">{totalRetailers}</div>
                    <div className="flex items-center mt-2 text-sm text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>+12% from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-muted-foreground">Active Retailers</div>
                      <Users className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">{analyticsData.activeRetailers}</div>
                    <div className="flex items-center mt-2 text-sm">
                      <span className="text-muted-foreground">
                        {analyticsData.activeRetailers > 0 && totalRetailers > 0
                          ? Math.round((analyticsData.activeRetailers / totalRetailers) * 100)
                          : 0}
                        % of total
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-muted-foreground">Total Credits</div>
                      <CreditCard className="h-4 w-4 text-[#3D89D6]" />
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalCredits)}</div>
                    <div className="flex items-center mt-2 text-sm text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>+8% from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-muted-foreground">Avg. Credits</div>
                      <BarChart3 className="h-4 w-4 text-[#3D89D6]" />
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(analyticsData.averageCredits || 0)}</div>
                    <div className="flex items-center mt-2 text-sm text-red-500">
                      <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                      <span>-3% from last month</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="border shadow-sm col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Credit Distribution</CardTitle>
                    <CardDescription>Retailers by credit balance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>High ({">"}₱100)</span>
                          <span className="font-medium">{analyticsData.creditDistribution.high} retailers</span>
                        </div>
                        <Progress
                          value={(analyticsData.creditDistribution.high / totalRetailers) * 100}
                          className="h-2 bg-gray-100"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Medium (₱50-₱100)</span>
                          <span className="font-medium">{analyticsData.creditDistribution.medium} retailers</span>
                        </div>
                        <Progress
                          value={(analyticsData.creditDistribution.medium / totalRetailers) * 100}
                          className="h-2 bg-gray-100"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Low ({"<"}₱50)</span>
                          <span className="font-medium">{analyticsData.creditDistribution.low} retailers</span>
                        </div>
                        <Progress
                          value={(analyticsData.creditDistribution.low / totalRetailers) * 100}
                          className="h-2 bg-gray-100"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Retailer Growth</CardTitle>
                    <CardDescription>New retailers over time</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[200px] w-full">
                      <div className="flex h-full items-end gap-2 pt-6">
                        {analyticsData.monthlyGrowth.map((item, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div
                              className="w-full bg-[#3D89D6] rounded-t-sm transition-all duration-500"
                              style={{
                                height: `${(item.retailers / Math.max(...analyticsData.monthlyGrowth.map((d) => d.retailers))) * 100}%`,
                                opacity: 0.6 + (i / analyticsData.monthlyGrowth.length) * 0.4,
                              }}
                            />
                            <span className="text-xs text-muted-foreground">{item.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Recent Credit Transfers</CardTitle>
                  <CardDescription>Latest credit transfer activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-3 w-[180px]" />
                          </div>
                          <Skeleton className="h-4 w-[80px]" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-[#e6f0fa] text-[#1A5EA2]">JD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">Credits transferred to John Doe</div>
                          <div className="text-sm text-muted-foreground">Today at 10:30 AM</div>
                        </div>
                        <div className="font-medium text-[#1A5EA2]">+₱50.00</div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-[#e6f0fa] text-[#1A5EA2]">JS</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">Credits transferred to Jane Smith</div>
                          <div className="text-sm text-muted-foreground">Yesterday at 3:45 PM</div>
                        </div>
                        <div className="font-medium text-[#1A5EA2]">+₱100.00</div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-[#e6f0fa] text-[#1A5EA2]">RJ</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">Credits transferred to Robert Johnson</div>
                          <div className="text-sm text-muted-foreground">Apr 10, 2023 at 9:15 AM</div>
                        </div>
                        <div className="font-medium text-[#1A5EA2]">+₱75.00</div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-center">
                  <Button variant="link" className="text-[#3D89D6]">
                    View all transactions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Retailer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] bg-clip-text text-transparent">
                Add New Retailer
              </DialogTitle>
              <DialogDescription className="text-base">
                Create a new retailer account. They will be linked to your merchant account.
              </DialogDescription>
            </DialogHeader>

            {packageInfo && retailerCount >= packageInfo.retailer_count ? (
              <motion.div
                className="py-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertTitle className="text-red-500 font-semibold">Retailer Limit Reached</AlertTitle>
                  <AlertDescription className="mt-2">
                    You have reached the maximum number of retailers ({packageInfo.retailer_count}) allowed for your
                    package ({packageInfo.name}). Please upgrade your package to add more retailers.
                  </AlertDescription>
                </Alert>
                <motion.div
                  className="mt-4 flex justify-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button onClick={() => setIsCreateDialogOpen(false)}>Close</Button>
                </motion.div>
              </motion.div>
            ) : (
              <form onSubmit={handleCreateRetailer}>
                <motion.div
                  className="grid gap-6 py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {/* Personal Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#3D89D6] mb-2">
                      <Users className="h-5 w-5" />
                      <h3 className="font-semibold">Personal Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div
                        className="space-y-2"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Label htmlFor="firstName" className="text-sm font-medium">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName.toUpperCase()}
                          onChange={handleInputChange}
                          className="transition-all duration-200 focus:ring-2 focus:ring-[#3D89D6] focus:ring-opacity-50"
                          required
                        />
                      </motion.div>
                      <motion.div
                        className="space-y-2"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Label htmlFor="lastName" className="text-sm font-medium">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName.toUpperCase()}
                          onChange={handleInputChange}
                          className="transition-all duration-200 focus:ring-2 focus:ring-[#3D89D6] focus:ring-opacity-50"
                          required
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Account Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#3D89D6] mb-2">
                      <CreditCard className="h-5 w-5" />
                      <h3 className="font-semibold">Account Information</h3>
                    </div>
                    <motion.div
                      className="grid grid-cols-2 gap-4"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="transition-all duration-200 focus:ring-2 focus:ring-[#3D89D6] focus:ring-opacity-50"
                          required
                        />
                      </div>
                        <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                          id="password"
                          name="password"
                          type={formData.showPassword ? "password" :  "text"}
                          value={formData.password}
                          onChange={handleInputChange}
                          className="transition-all duration-200 focus:ring-2 focus:ring-[#3D89D6] focus:ring-opacity-50"
                          required
                          />
                          <button
                          type="button"
                          onClick={() =>
                            setFormData((prev: any) => ({
                            ...prev,
                            showPassword: !prev.showPassword,
                            }))
                          }
                          className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                          >
                          {formData.showPassword ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4 line-through" />
                          )}
                          </button>
                          <div className="absolute right-10 top-2.5 text-xs text-muted-foreground">
                          {formData.password && (
                            <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`px-2 py-1 rounded ${
                              formData.password.length >= 8
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                            }`}
                            >
                            {formData.password.length >= 8 ? "Strong" : "Weak"}
                            </motion.div>
                          )}
                          </div>
                        </div>
                        </div>
                    </motion.div>
                  </div>

                  {/* Business Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#3D89D6] mb-2">
                      <Building2 className="h-5 w-5" />
                      <h3 className="font-semibold">Business Information</h3>
                    </div>
                    <motion.div
                      className="space-y-4"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="businessName" className="text-sm font-medium">
                          Business Name
                        </Label>
                        <Input
                          id="businessName"
                          name="businessName"
                          value={formData.businessName.toUpperCase()}
                          onChange={handleInputChange}
                          className="transition-all duration-200 focus:ring-2 focus:ring-[#3D89D6] focus:ring-opacity-50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessAddress" className="text-sm font-medium">
                          Business Address
                        </Label>
                        <Textarea
                          id="businessAddress"
                          name="businessAddress"
                          value={formData.businessAddress.toUpperCase()}
                          onChange={handleInputChange}
                          className="min-h-[80px] transition-all duration-200 focus:ring-2 focus:ring-[#3D89D6] focus:ring-opacity-50"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactNumber" className="text-sm font-medium">
                          Contact Number
                        </Label>
                        <Input
                          id="contactNumber"
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleInputChange}
                          className="transition-all duration-200 focus:ring-2 focus:ring-[#3D89D6] focus:ring-opacity-50"
                          required
                        />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div
                  className="border-t pt-4 mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={isCreating}
                      className="transition-all duration-200 hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] text-white transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <motion.div
                          className="flex items-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </motion.div>
                      ) : (
                        <motion.div
                          className="flex items-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create Retailer
                        </motion.div>
                      )}
                    </Button>
                  </DialogFooter>
                </motion.div>
              </form>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Edit Retailer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Retailer</DialogTitle>
            <DialogDescription>Update retailer information and status.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateRetailer}>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress">Business Address</Label>
                <Textarea
                  id="businessAddress"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev: any) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#3D89D6] hover:bg-[#1A5EA2]" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Retailer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Retailer Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this retailer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedRetailer && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-100">
                <Avatar>
                  <AvatarFallback className="bg-red-100 text-red-700">
                    {(selectedRetailer.user_nicename || selectedRetailer.user_login || "").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {`${selectedRetailer.first_name || ""} ${selectedRetailer.last_name || ""}`.trim()}
                  </div>
                  <div className="text-sm text-muted-foreground">{selectedRetailer.user_email}</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteRetailer} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Retailer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Retailer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Retailer Details</DialogTitle>
            <DialogDescription>Comprehensive information about this retailer.</DialogDescription>
          </DialogHeader>

          {selectedRetailer && (
            <div className="py-4">
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:bg-[#3D89D6] data-[state=active]:text-white"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="business"
                    className="data-[state=active]:bg-[#3D89D6] data-[state=active]:text-white"
                  >
                    Business
                  </TabsTrigger>
                  <TabsTrigger
                    value="activity"
                    className="data-[state=active]:bg-[#3D89D6] data-[state=active]:text-white"
                  >
                    Activity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center gap-3">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={selectedRetailer.profile_pic_url || ""} />
                        <AvatarFallback className="text-3xl bg-[#e6f0fa] text-[#1A5EA2]">
                          {(selectedRetailer.user_nicename || selectedRetailer.user_login || "")
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <div className="font-bold text-lg">
                          {`${selectedRetailer.first_name || ""} ${selectedRetailer.last_name || ""}`.trim()}
                        </div>
                        <div className="text-muted-foreground">@{selectedRetailer.user_login}</div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {getStatusBadge(selectedRetailer.user_status)}
                        <Badge className="bg-[#3D89D6]">Retailer</Badge>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Email</div>
                          <div>{selectedRetailer.user_email || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Contact Number</div>
                          <div>{selectedRetailer.user_contact_number || "N/A"}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Referral Code</div>
                        <div className="font-mono bg-[#f0f7ff] p-1 rounded text-sm inline-block">
                          {selectedRetailer.user_referral_code || "N/A"}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Registration Date</div>
                          <div>{formatDate(selectedRetailer.user_registered)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Credits Balance</div>
                          <div className="font-bold text-[#1A5EA2]">
                            {selectedRetailer.user_credits?.toFixed(2) || "0.00"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="business" className="mt-4 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Business Name</div>
                    <div className="font-medium text-lg">{selectedRetailer.business_name || "N/A"}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Business Address</div>
                    <div className="p-3 bg-[#f0f7ff] rounded-md">
                      {selectedRetailer.business_address || "No address provided"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Bank Name</div>
                      <div>{selectedRetailer.bank_name || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Bank Account Number</div>
                      <div>{selectedRetailer.bank_account_number || "N/A"}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Social Media Page</div>
                    <div>{selectedRetailer.social_media_page || "N/A"}</div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-9 w-9 rounded-full bg-[#f0f7ff] flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-[#3D89D6]" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">Credits transferred</div>
                            <div className="text-sm text-muted-foreground">Today at 10:30 AM</div>
                          </div>
                          <div className="font-medium text-[#1A5EA2]">+₱50.00</div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="h-9 w-9 rounded-full bg-[#f0f7ff] flex items-center justify-center">
                            <RefreshCcw className="h-4 w-4 text-[#3D89D6]" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">Account updated</div>
                            <div className="text-sm text-muted-foreground">Yesterday at 3:45 PM</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="h-9 w-9 rounded-full bg-[#f0f7ff] flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-[#3D89D6]" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">Account created</div>
                            <div className="text-sm text-muted-foreground">Apr 10, 2023 at 9:15 AM</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              className="bg-[#3D89D6] hover:bg-[#1A5EA2]"
              onClick={() => {
                setIsViewDialogOpen(false)
                openEditDialog(selectedRetailer)
              }}
            >
              Edit Retailer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Credits Dialog */}
      <Dialog open={isTransferCreditsDialogOpen} onOpenChange={setIsTransferCreditsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transfer Credits</DialogTitle>
            <DialogDescription>Transfer credits to this retailer's account.</DialogDescription>
          </DialogHeader>

          {selectedRetailer && (
            <form onSubmit={handleTransferCredits}>
              <div className="py-4 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-md bg-[#f0f7ff] border border-[#d1e6fa]">
                  <Avatar>
                    <AvatarFallback className="bg-[#e6f0fa] text-[#1A5EA2]">
                      {(selectedRetailer.first_name || selectedRetailer.user_login || "").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {`${selectedRetailer.first_name || ""} ${selectedRetailer.last_name || ""}`.trim()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Current Balance:{" "}
                      <span className="font-medium text-[#1A5EA2]">
                        {selectedRetailer.user_credits?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditsAmount">Amount to Transfer</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">₱</span>
                    <Input
                      id="creditsAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="pl-7"
                      value={creditsAmount}
                      onChange={(e) => setCreditsAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transferReason">Reason for Transfer (Optional)</Label>
                  <Textarea
                    id="transferReason"
                    placeholder="Enter reason for this credit transfer..."
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTransferCreditsDialogOpen(false)}
                  disabled={isTransferring}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#3D89D6] hover:bg-[#1A5EA2]"
                  disabled={!creditsAmount || Number.parseFloat(creditsAmount) <= 0 || isTransferring}
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Transferring...
                    </>
                  ) : (
                    "Transfer Credits"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
