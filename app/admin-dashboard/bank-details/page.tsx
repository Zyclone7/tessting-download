"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useUserContext } from "@/hooks/use-user"
import { getUserById, getAllUsers } from "@/actions/user"
import {
    updateBankDetails,
    getUserPendingUpdates,
    getUserUpdateHistory,
    processPendingUpdate,
} from "@/actions/bank-details"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    Search,
    Eye,
    EyeOff,
    Info,
    Filter,
    Star,
    StarOff,
    History,
    Save,
    ArrowUpDown,
    Users,
    User,
    Shield,
    ShieldCheck,
    Pencil,
    RotateCw,
    Check,
    ChevronRight,
    ChevronDown,
    RefreshCw,
    ListChecks,
    Ban,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Animation variants
const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
}

const slideUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
}

export default function BankDetailsPage() {
    const { user } = useUserContext()
    const { toast } = useToast()

    // User data states
    const [userData, setUserData] = useState<any>(null)
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [filteredUsers, setFilteredUsers] = useState<any[]>([])
    const [favoriteUsers, setFavoriteUsers] = useState<number[]>([])
    const [recentUsers, setRecentUsers] = useState<number[]>([])

    // UI states
    const [loading, setLoading] = useState(true)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("details")
    const [userFilterType, setUserFilterType] = useState<"all" | "favorites" | "recent">("all")
    const [showSensitiveData, setShowSensitiveData] = useState(false)
    const [sortOrder, setSortOrder] = useState<"name" | "email" | "role">("name")

    // Form states
    const [formData, setFormData] = useState({
        bank_name: "",
        bank_account_number: "",
        cf_share: 0,
        merchant_id: "",
        terminal_id: "",
    })
    const [originalData, setOriginalData] = useState({ ...formData })
    const [formLoading, setFormLoading] = useState(false)

    // Update history states
    const [pendingUpdates, setPendingUpdates] = useState<any[]>([])
    const [updateHistory, setUpdateHistory] = useState<any[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)
    const [historyTab, setHistoryTab] = useState("all")

    // Batch approval states
    const [isBatchApproveDialogOpen, setIsBatchApproveDialogOpen] = useState(false)
    const [isBatchRejectDialogOpen, setIsBatchRejectDialogOpen] = useState(false)
    const [batchRejectionReason, setBatchRejectionReason] = useState("")
    const [processingBatch, setProcessingBatch] = useState(false)
    const [expandedUpdates, setExpandedUpdates] = useState<Record<number, boolean>>({})

    // Check if user is admin
    const isAdmin = user?.role === "admin"

    // Load favorite users from localStorage
    useEffect(() => {
        try {
            const storedFavorites = localStorage.getItem("favoriteUsers")
            if (storedFavorites) {
                setFavoriteUsers(JSON.parse(storedFavorites))
            }

            const storedRecent = localStorage.getItem("recentUsers")
            if (storedRecent) {
                setRecentUsers(JSON.parse(storedRecent))
            }
        } catch (error) {
            console.error("Error loading saved users:", error)
        }
    }, [])

    // Save favorite users to localStorage
    const saveFavoriteUsers = useCallback((favorites: number[]) => {
        try {
            localStorage.setItem("favoriteUsers", JSON.stringify(favorites))
            setFavoriteUsers(favorites)
        } catch (error) {
            console.error("Error saving favorite users:", error)
        }
    }, [])

    // Save recent users to localStorage
    const saveRecentUsers = useCallback(
        (userId: number) => {
            try {
                const updatedRecent = [userId, ...recentUsers.filter((id) => id !== userId)].slice(0, 5)
                localStorage.setItem("recentUsers", JSON.stringify(updatedRecent))
                setRecentUsers(updatedRecent)
            } catch (error) {
                console.error("Error saving recent users:", error)
            }
        },
        [recentUsers],
    )

    // Toggle favorite user
    const toggleFavorite = useCallback(
        (userId: number) => {
            const isFavorite = favoriteUsers.includes(userId)
            const updatedFavorites = isFavorite ? favoriteUsers.filter((id) => id !== userId) : [...favoriteUsers, userId]

            saveFavoriteUsers(updatedFavorites)

            toast({
                title: isFavorite ? "Removed from favorites" : "Added to favorites",
                description: isFavorite ? "User removed from your favorites list" : "User added to your favorites list",
            })
        },
        [favoriteUsers, saveFavoriteUsers, toast],
    )

    // Toggle expanded update
    const toggleExpandUpdate = useCallback((updateId: number) => {
        setExpandedUpdates((prev) => ({
            ...prev,
            [updateId]: !prev[updateId],
        }))
    }, [])

    // Fetch all users for selection
    const fetchAllUsers = async () => {
        if (!user?.id) return

        try {
            setLoadingUsers(true)
            const result: any = await getAllUsers()

            if (result.success) {
                setAllUsers(result.data)
                setFilteredUsers(result.data)
            } else {
                console.error("Failed to fetch users:", result.message)
                toast({
                    title: "Error",
                    description: "Failed to load user list",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error fetching users:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred while loading users",
                variant: "destructive",
            })
        } finally {
            setLoadingUsers(false)
        }
    }

    // Fetch selected user data
    const fetchUserData = async (userId: number) => {
        try {
            setLoading(true)
            setError(null)

            const result: any = await getUserById(userId)

            if (result.success) {
                setUserData(result.data)
                setFormData({
                    bank_name: result.data.bank_name || "",
                    bank_account_number: result.data.bank_account_number || "",
                    cf_share: result.data.cf_share || 0,
                    merchant_id: result.data.merchant_id || "",
                    terminal_id: result.data.terminal_id || "",
                })
                setOriginalData({
                    bank_name: result.data.bank_name || "",
                    bank_account_number: result.data.bank_account_number || "",
                    cf_share: result.data.cf_share || 0,
                    merchant_id: result.data.merchant_id || "",
                    terminal_id: result.data.terminal_id || "",
                })

                // Add to recent users
                saveRecentUsers(userId)

                // Fetch pending updates and history
                fetchPendingUpdates(userId)
                fetchUpdateHistory(userId)
            } else {
                setError(result.message || "Failed to fetch user data")
                toast({
                    title: "Error",
                    description: result.message || "Failed to load user data",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error fetching user data:", error)
            setError("An unexpected error occurred")
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    // Fetch pending updates for this user
    const fetchPendingUpdates = async (userId: number) => {
        try {
            const result: any = await getUserPendingUpdates(userId)
            if (result.success) {
                setPendingUpdates(result.data)
            }
        } catch (error) {
            console.error("Error fetching pending updates:", error)
        }
    }

    // Fetch update history for this user
    const fetchUpdateHistory = async (userId: number) => {
        try {
            setHistoryLoading(true)
            const result: any = await getUserUpdateHistory(userId)
            if (result.success) {
                setUpdateHistory(result.data)
            }
        } catch (error) {
            console.error("Error fetching update history:", error)
        } finally {
            setHistoryLoading(false)
        }
    }

    // Process a single pending update
    const handleProcessUpdate = async (updateId: number, action: "approve" | "reject", rejectionReason?: string) => {
        if (!user?.id) return

        try {
            const result = await processPendingUpdate({
                updateId,
                action,
                adminId: user.id,
                rejectionReason: rejectionReason || undefined,
            })

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Update ${action === "approve" ? "approved" : "rejected"} successfully`,
                })

                // Refresh data
                if (userData?.ID) {
                    fetchPendingUpdates(userData.ID)
                    fetchUpdateHistory(userData.ID)
                    fetchUserData(userData.ID) // Refresh user data to show updated values
                }
            } else {
                toast({
                    title: "Error",
                    description: result.message || `Failed to ${action} update`,
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error(`Error ${action}ing update:`, error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        }
    }

    // Process all pending updates in batch
    const handleBatchProcess = async (action: "approve" | "reject") => {
        if (!user?.id || pendingUpdates.length === 0) return

        setProcessingBatch(true)
        try {
            let successCount = 0
            let failCount = 0

            // Process each update sequentially
            for (const update of pendingUpdates) {
                console.log(`Processing update ID: ${update.id}, action: ${action}`)

                const result = await processPendingUpdate({
                    updateId: update.id,
                    action,
                    adminId: user.id,
                    rejectionReason: action === "reject" ? batchRejectionReason || "Batch rejected" : undefined,
                })

                console.log("Process result:", result)

                if (result.success) {
                    successCount++
                } else {
                    failCount++
                    console.error(`Failed to process update ${update.id}:`, result.message)
                }
            }

            // Show result toast
            if (failCount === 0) {
                toast({
                    title: "Success",
                    description: `All ${pendingUpdates.length} updates were ${action === "approve" ? "approved" : "rejected"} successfully`,
                })
            } else {
                toast({
                    title: "Partial Success",
                    description: `${successCount} updates were processed successfully, ${failCount} failed`,
                    variant: "destructive",
                })
            }

            // Close dialogs and reset states
            setIsBatchApproveDialogOpen(false)
            setIsBatchRejectDialogOpen(false)
            setBatchRejectionReason("")

            // Refresh data
            if (userData?.ID) {
                fetchPendingUpdates(userData.ID)
                fetchUpdateHistory(userData.ID)
                fetchUserData(userData.ID) // Refresh user data to show updated values
            }
        } catch (error) {
            console.error(`Error batch ${action}ing updates:`, error)
            toast({
                title: "Error",
                description: "An unexpected error occurred during batch processing",
                variant: "destructive",
            })
        } finally {
            setProcessingBatch(false)
        }
    }

    // Initial setup
    useEffect(() => {
        if (user?.id) {
            setSelectedUserId(user.id)
            fetchUserData(user.id)
            fetchAllUsers()
        }
    }, [user])

    // Handle user selection change
    const handleUserChange = (userId: string) => {
        const id = Number.parseInt(userId, 10)
        setSelectedUserId(id)
        fetchUserData(id)
        setIsUserDialogOpen(false)
    }

    // Handle form input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        if (name === "cf_share") {
            // Handle numeric input
            setFormData({
                ...formData,
                [name]: value === "" ? 0 : Number.parseFloat(value),
            })
        } else {
            setFormData({
                ...formData,
                [name]: value,
            })
        }
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user || !userData) {
            toast({
                title: "Error",
                description: "User information is missing",
                variant: "destructive",
            })
            return
        }

        // Check if any fields have changed by comparing with original data
        const changedFields: Record<string, any> = {}
        let hasChanges = false

        Object.keys(formData).forEach((key) => {
            const formValue = formData[key as keyof typeof formData]
            const originalValue = originalData[key as keyof typeof originalData]

            // Check if the value has actually changed
            if (formValue !== originalValue) {
                changedFields[key] = formValue
                hasChanges = true
            }
        })

        if (!hasChanges) {
            toast({
                title: "No Changes",
                description: "No changes were made to the bank details",
            })
            return
        }

        setFormLoading(true)
        try {
            // Only submit fields that have actually changed
            const result = await updateBankDetails({
                userId: userData.ID,
                updates: changedFields,
                userRole: user.role || "",
            })

            if (result.success) {
                toast({
                    title: "Success",
                    description: isAdmin ? "Bank details updated successfully" : "Update request submitted for approval",
                })

                // If admin, update the original data
                if (isAdmin) {
                    setOriginalData({ ...formData })
                } else {
                    // Reset form to original values for non-admin users
                    setFormData({ ...originalData })
                    // Fetch updated pending requests
                    fetchPendingUpdates(userData.ID)
                }

                // Refresh update history
                fetchUpdateHistory(userData.ID)
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to update bank details",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error updating bank details:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setFormLoading(false)
        }
    }

    // Filter users based on search query and filter type
    useEffect(() => {
        let filtered = [...allUsers]

        // Apply search filter
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (user) =>
                    user.user_nicename?.toLowerCase().includes(query) ||
                    user.user_email?.toLowerCase().includes(query) ||
                    user.display_name?.toLowerCase().includes(query) ||
                    user.user_role?.toLowerCase().includes(query),
            )
        }

        // Apply user type filter
        if (userFilterType === "favorites") {
            filtered = filtered.filter((user) => favoriteUsers.includes(user.ID))
        } else if (userFilterType === "recent") {
            filtered = filtered.filter((user) => recentUsers.includes(user.ID))
        }

        // Apply sorting
        filtered.sort((a, b) => {
            if (sortOrder === "name") {
                return (a.user_nicename || a.display_name || "").localeCompare(b.user_nicename || b.display_name || "")
            } else if (sortOrder === "email") {
                return (a.user_email || "").localeCompare(b.user_email || "")
            } else if (sortOrder === "role") {
                return (a.user_role || "").localeCompare(b.user_role || "")
            }
            return 0
        })

        setFilteredUsers(filtered)
    }, [searchQuery, allUsers, userFilterType, favoriteUsers, recentUsers, sortOrder])

    // Check if a field has a pending update
    const hasPendingUpdate = useCallback(
        (fieldName: string) => {
            return pendingUpdates.some((update) => update.field_name === fieldName && update.status === "pending")
        },
        [pendingUpdates],
    )

    // Get pending update for a field
    const getPendingUpdate = useCallback(
        (fieldName: string) => {
            return pendingUpdates.find((update) => update.field_name === fieldName && update.status === "pending")
        },
        [pendingUpdates],
    )

    // Format date
    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString()
    }, [])

    // Mask sensitive data
    const maskValue = useCallback(
        (value: string) => {
            if (!showSensitiveData) {
                if (!value) return ""
                const length = value.length
                if (length <= 4) return "****"
                return "****" + value.substring(length - 4)
            }
            return value
        },
        [showSensitiveData],
    )

    // Get field display name
    const getFieldDisplayName = useCallback((fieldName: string) => {
        const fieldMap: Record<string, string> = {
            bank_name: "Bank Name",
            bank_account_number: "Bank Account Number",
            cf_share: "CF Share",
            merchant_id: "Merchant ID",
            terminal_id: "Terminal ID",
            user_pass: "Password",
        }
        return fieldMap[fieldName] || fieldName
    }, [])

    // Get status badge
    const getStatusBadge = useCallback((status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                )
            case "approved":
                return (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                    </Badge>
                )
            case "rejected":
                return (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                    </Badge>
                )
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }, [])

    // Filter history based on active tab
    const filteredHistory = useMemo(() => {
        if (historyTab === "all") return updateHistory
        return updateHistory.filter((update) => update.status.toLowerCase() === historyTab)
    }, [updateHistory, historyTab])

    // Check if form has changes
    const hasFormChanges = useMemo(() => {
        return Object.keys(formData).some(
            (key) => formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData],
        )
    }, [formData, originalData])

    // Group pending updates by field type
    const pendingUpdatesByType = useMemo(() => {
        const grouped: Record<string, any[]> = {}

        pendingUpdates.forEach((update) => {
            const type = update.field_name
            if (!grouped[type]) {
                grouped[type] = []
            }
            grouped[type].push(update)
        })

        return grouped
    }, [pendingUpdates])

    // Loading skeleton
    if (loading) {
        return (
            <motion.div className="container mx-auto py-6" initial="hidden" animate="visible" variants={fadeIn}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Bank Details</h1>
                    <Skeleton className="h-10 w-32" />
                </div>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-40 mb-2" />
                        <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-28" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-36" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Skeleton className="h-5 w-60" />
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            </motion.div>
        )
    }

    // Error state
    if (error) {
        return (
            <motion.div className="container mx-auto py-6" initial="hidden" animate="visible" variants={fadeIn}>
                <h1 className="text-2xl font-bold mb-6">Bank Details</h1>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                        <p className="text-lg font-medium">Error Loading Data</p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => {
                                if (selectedUserId) fetchUserData(selectedUserId)
                            }}
                        >
                            <RotateCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        )
    }

    return (
        <motion.div className="container mx-auto py-6" initial="hidden" animate="visible" variants={fadeIn}>
            {/* Header with user selection */}
            <motion.div
                className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6"
                variants={slideUp}
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bank Details</h1>
                    {userData && userData.ID !== user?.id && (
                        <p className="text-muted-foreground text-lg mt-1">
                            Viewing details for{" "}
                            <span className="font-medium">
                                {userData.user_nicename || userData.display_name || userData.user_email}
                            </span>
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle sensitive data */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSensitiveData(!showSensitiveData)}
                        className="hidden md:flex"
                    >
                        {showSensitiveData ? (
                            <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide Sensitive Data
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4 mr-2" />
                                Show Sensitive Data
                            </>
                        )}
                    </Button>

                    {/* User selection dialog */}
                    <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default">
                                <Users className="h-4 w-4 mr-2" />
                                Select User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
                            <DialogHeader>
                                <DialogTitle className="text-xl">Select User</DialogTitle>
                                <DialogDescription className="text-base">
                                    Choose a user to view or update their bank details
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 my-4">
                                {/* Search and filter controls */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name, email, or role..."
                                            className="pl-8 text-base"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Select value={userFilterType} onValueChange={(value) => setUserFilterType(value as any)}>
                                            <SelectTrigger className="w-[130px]">
                                                <Filter className="h-4 w-4 mr-2" />
                                                <SelectValue placeholder="Filter" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Users</SelectItem>
                                                <SelectItem value="favorites">Favorites</SelectItem>
                                                <SelectItem value="recent">Recent</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="icon">
                                                    <ArrowUpDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setSortOrder("name")}>
                                                    {sortOrder === "name" && <Check className="h-4 w-4 mr-2" />}
                                                    Name
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setSortOrder("email")}>
                                                    {sortOrder === "email" && <Check className="h-4 w-4 mr-2" />}
                                                    Email
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setSortOrder("role")}>
                                                    {sortOrder === "role" && <Check className="h-4 w-4 mr-2" />}
                                                    Role
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* User list */}
                                <ScrollArea className="h-[400px]">
                                    <AnimatePresence>
                                        {loadingUsers ? (
                                            <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="visible">
                                                {[1, 2, 3, 4, 5].map((i) => (
                                                    <motion.div key={i} className="p-2 animate-pulse" variants={slideUp}>
                                                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
                                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        ) : filteredUsers.length === 0 ? (
                                            <motion.div className="text-center py-8 text-muted-foreground" variants={fadeIn}>
                                                {userFilterType === "favorites" ? (
                                                    <>
                                                        <StarOff className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                                        <p className="text-lg">No favorite users found</p>
                                                        <p className="text-base">Add users to your favorites for quick access</p>
                                                    </>
                                                ) : userFilterType === "recent" ? (
                                                    <>
                                                        <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                                        <p className="text-lg">No recently viewed users</p>
                                                        <p className="text-base">Users you view will appear here</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                                        <p className="text-lg">No users found matching your search</p>
                                                        <p className="text-base">Try a different search term</p>
                                                    </>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="visible">
                                                {filteredUsers.map((user) => (
                                                    <motion.div key={user.ID} variants={slideUp}>
                                                        <div className="flex items-center">
                                                            <Button
                                                                variant={selectedUserId === user.ID ? "secondary" : "ghost"}
                                                                className="w-full justify-start text-left rounded-r-none py-3 h-auto"
                                                                onClick={() => handleUserChange(user.ID.toString())}
                                                            >
                                                                <div className="mr-3">
                                                                    {user.user_role === "admin" ? (
                                                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                                                    ) : user.user_role === "manager" || user.user_role === "editor" ? (
                                                                        <Shield className="h-5 w-5 text-blue-500" />
                                                                    ) : (
                                                                        <User className="h-5 w-5 text-muted-foreground" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-base flex items-center">
                                                                        {user.user_nicename || user.display_name || "User"}
                                                                        {favoriteUsers.includes(user.ID) && (
                                                                            <Star className="h-3 w-3 ml-1 text-yellow-500 fill-yellow-500" />
                                                                        )}
                                                                    </p>
                                                                    <div className="flex items-center text-sm text-muted-foreground">
                                                                        <span className="truncate max-w-[180px]">{user.user_email}</span>
                                                                        {user.user_role && (
                                                                            <Badge variant="outline" className="ml-2 text-[10px] h-4">
                                                                                {user.user_role}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="rounded-l-none border-l h-full"
                                                                onClick={() => toggleFavorite(user.ID)}
                                                            >
                                                                {favoriteUsers.includes(user.ID) ? (
                                                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                                ) : (
                                                                    <StarOff className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </ScrollArea>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Favorite button for current user */}
                    {userData && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => userData && toggleFavorite(userData.ID)}>
                                        {favoriteUsers.includes(userData?.ID) ? (
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                        ) : (
                                            <StarOff className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {favoriteUsers.includes(userData?.ID) ? "Remove from favorites" : "Add to favorites"}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </motion.div>

            {/* Mobile sensitive data toggle */}
            <div className="md:hidden mb-4">
                <Button variant="outline" size="sm" onClick={() => setShowSensitiveData(!showSensitiveData)} className="w-full">
                    {showSensitiveData ? (
                        <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide Sensitive Data
                        </>
                    ) : (
                        <>
                            <Eye className="h-4 w-4 mr-2" />
                            Show Sensitive Data
                        </>
                    )}
                </Button>
            </div>

            {/* Main content tabs */}
            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                    <TabsTrigger value="details" className="flex items-center text-base py-2 px-4">
                        <Pencil className="h-4 w-4 mr-2" />
                        Bank Details
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center text-base py-2 px-4">
                        <History className="h-4 w-4 mr-2" />
                        Update History
                        {pendingUpdates.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {pendingUpdates.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Bank Details Tab */}
                <TabsContent value="details">
                    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                        <Card className="shadow-md">
                            <CardHeader className="bg-slate-50 border-b">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl">Bank Details</CardTitle>
                                        <CardDescription className="text-base mt-1">
                                            {isAdmin ? "Manage bank and payment details" : "Updates to these details require admin approval"}
                                        </CardDescription>
                                    </div>
                                    {pendingUpdates.length > 0 && (
                                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-sm py-1">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {pendingUpdates.length} Pending Update{pendingUpdates.length > 1 ? "s" : ""}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {pendingUpdates.length > 0 && (
                                    <Alert className="mb-6 bg-yellow-50 text-yellow-800 border-yellow-200">
                                        <AlertCircle className="h-5 w-5" />
                                        <AlertTitle className="text-base font-medium">Pending Updates</AlertTitle>
                                        <AlertDescription className="text-base">
                                            This user has pending update requests that need admin approval.
                                            {!isAdmin && " Your changes won't be visible until approved."}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Bank Name Field */}
                                    <motion.div className="space-y-2" variants={slideUp}>
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="bank_name" className="text-base font-medium">
                                                Bank Name
                                            </Label>
                                            {hasPendingUpdate("bank_name") && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                Pending
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Requested value: {getPendingUpdate("bank_name")?.requested_value}</p>
                                                            <p>Requested at: {formatDate(getPendingUpdate("bank_name")?.requested_at)}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                        <Input
                                            id="bank_name"
                                            name="bank_name"
                                            value={formData.bank_name}
                                            onChange={handleInputChange}
                                            disabled={formLoading || hasPendingUpdate("bank_name")}
                                            placeholder="Enter bank name"
                                            className={`text-base h-11 ${hasPendingUpdate("bank_name") ? "border-yellow-300 bg-yellow-50" : ""}`}
                                        />
                                    </motion.div>

                                    {/* Bank Account Number Field */}
                                    <motion.div className="space-y-2" variants={slideUp}>
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="bank_account_number" className="text-base font-medium">
                                                Bank Account Number
                                            </Label>
                                            {hasPendingUpdate("bank_account_number") && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                Pending
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                Requested value: {maskValue(getPendingUpdate("bank_account_number")?.requested_value)}
                                                            </p>
                                                            <p>Requested at: {formatDate(getPendingUpdate("bank_account_number")?.requested_at)}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="bank_account_number"
                                                name="bank_account_number"
                                                value={formData.bank_account_number}
                                                onChange={handleInputChange}
                                                disabled={formLoading || hasPendingUpdate("bank_account_number")}
                                                placeholder="Enter bank account number"
                                                type={showSensitiveData ? "text" : "password"}
                                                className={`text-base h-11 ${hasPendingUpdate("bank_account_number") ? "border-yellow-300 bg-yellow-50 pr-10" : "pr-10"
                                                    }`}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3"
                                                onClick={() => setShowSensitiveData(!showSensitiveData)}
                                            >
                                                {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </motion.div>

                                    {/* CF Share Field */}
                                    <motion.div className="space-y-2" variants={slideUp}>
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="cf_share" className="text-base font-medium">
                                                CF Share (Fixed)
                                            </Label>
                                            {hasPendingUpdate("cf_share") && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                Pending
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Requested value: {getPendingUpdate("cf_share")?.requested_value}%</p>
                                                            <p>Requested at: {formatDate(getPendingUpdate("cf_share")?.requested_at)}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                        <Input
                                            id="cf_share"
                                            name="cf_share"
                                            type="number"
                                            step="0.01"
                                            value={formData.cf_share}
                                            onChange={handleInputChange}
                                            disabled={formLoading || hasPendingUpdate("cf_share")}
                                            placeholder="Enter CF share percentage"
                                            className={`text-base h-11 ${hasPendingUpdate("cf_share") ? "border-yellow-300 bg-yellow-50" : ""}`}
                                        />
                                    </motion.div>

                                    {/* Merchant ID Field */}
                                    <motion.div className="space-y-2" variants={slideUp}>
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="merchant_id" className="text-base font-medium">
                                                Merchant ID
                                            </Label>
                                            {hasPendingUpdate("merchant_id") && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                Pending
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Requested value: {getPendingUpdate("merchant_id")?.requested_value}</p>
                                                            <p>Requested at: {formatDate(getPendingUpdate("merchant_id")?.requested_at)}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                        <Input
                                            id="merchant_id"
                                            name="merchant_id"
                                            value={formData.merchant_id}
                                            onChange={handleInputChange}
                                            disabled={formLoading || hasPendingUpdate("merchant_id")}
                                            placeholder="Enter merchant ID"
                                            className={`text-base h-11 ${hasPendingUpdate("merchant_id") ? "border-yellow-300 bg-yellow-50" : ""}`}
                                        />
                                    </motion.div>

                                    {/* Terminal ID Field */}
                                    <motion.div className="space-y-2" variants={slideUp}>
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="terminal_id" className="text-base font-medium">
                                                Terminal ID
                                            </Label>
                                            {hasPendingUpdate("terminal_id") && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                Pending
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Requested value: {getPendingUpdate("terminal_id")?.requested_value}</p>
                                                            <p>Requested at: {formatDate(getPendingUpdate("terminal_id")?.requested_at)}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                        <Input
                                            id="terminal_id"
                                            name="terminal_id"
                                            value={formData.terminal_id}
                                            onChange={handleInputChange}
                                            disabled={formLoading || hasPendingUpdate("terminal_id")}
                                            placeholder="Enter terminal ID"
                                            className={`text-base h-11 ${hasPendingUpdate("terminal_id") ? "border-yellow-300 bg-yellow-50" : ""}`}
                                        />
                                    </motion.div>
                                </form>
                            </CardContent>
                            <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 bg-slate-50 border-t mt-4">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Info className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="text-base">
                                        {isAdmin
                                            ? "As an admin, your changes will be applied immediately"
                                            : "Your changes will require admin approval"}
                                    </span>
                                </div>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={formLoading || !hasFormChanges}
                                    className="sm:w-auto w-full text-base py-5"
                                    size="lg"
                                >
                                    {formLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-5 w-5 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </TabsContent>

                {/* Update History Tab */}
                <TabsContent value="history">
                    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                        <Card className="shadow-md">
                            <CardHeader className="bg-slate-50 border-b">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl">Update History</CardTitle>
                                        <CardDescription className="text-base mt-1">History of bank detail update requests</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setShowSensitiveData(!showSensitiveData)}>
                                            {showSensitiveData ? (
                                                <>
                                                    <EyeOff className="h-4 w-4 mr-2" />
                                                    Hide Sensitive
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Show Sensitive
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (userData?.ID) {
                                                    fetchUpdateHistory(userData.ID)
                                                    fetchPendingUpdates(userData.ID)
                                                }
                                            }}
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Refresh
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Tabs defaultValue="all" value={historyTab} onValueChange={setHistoryTab}>
                                    <TabsList className="mb-4">
                                        <TabsTrigger value="all" className="text-base py-2 px-4">
                                            All Updates
                                        </TabsTrigger>
                                        <TabsTrigger value="pending" className="text-base py-2 px-4">
                                            Pending
                                            {pendingUpdates.length > 0 && (
                                                <Badge variant="secondary" className="ml-2">
                                                    {pendingUpdates.length}
                                                </Badge>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="approved" className="text-base py-2 px-4">
                                            Approved
                                        </TabsTrigger>
                                        <TabsTrigger value="rejected" className="text-base py-2 px-4">
                                            Rejected
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value={historyTab}>
                                        {/* Batch Actions for Pending Updates */}
                                        {historyTab === "pending" && pendingUpdates.length > 0 && isAdmin && (
                                            <motion.div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg" variants={slideUp}>
                                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-blue-800">Batch Actions</h3>
                                                        <p className="text-blue-700">Process all {pendingUpdates.length} pending updates at once</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            className="border-red-300 text-red-700 hover:bg-red-50"
                                                            onClick={() => setIsBatchRejectDialogOpen(true)}
                                                        >
                                                            <Ban className="h-4 w-4 mr-2" />
                                                            Reject All
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="border-green-300 text-green-700 hover:bg-green-50"
                                                            onClick={() => setIsBatchApproveDialogOpen(true)}
                                                        >
                                                            <ListChecks className="h-4 w-4 mr-2" />
                                                            Approve All
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {historyLoading ? (
                                            <div className="flex justify-center items-center py-8">
                                                <div className="animate-pulse space-y-4 w-full">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="bg-gray-200 h-24 rounded-md w-full"></div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : filteredHistory.length === 0 ? (
                                            <motion.div
                                                className="flex flex-col items-center justify-center py-12 text-center"
                                                variants={fadeIn}
                                            >
                                                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                                                <p className="text-xl font-medium">No update history found</p>
                                                <p className="text-base text-muted-foreground mt-2">
                                                    {historyTab === "all"
                                                        ? "No bank detail updates have been requested"
                                                        : `No ${historyTab} updates found`}
                                                </p>
                                            </motion.div>
                                        ) : (
                                            <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
                                                {filteredHistory.map((update) => (
                                                    <motion.div
                                                        key={update.id}
                                                        className={`border rounded-lg p-5 shadow-sm ${update.status === "pending"
                                                            ? "border-l-4 border-l-yellow-400"
                                                            : update.status === "approved"
                                                                ? "border-l-4 border-l-green-400"
                                                                : update.status === "rejected"
                                                                    ? "border-l-4 border-l-red-400"
                                                                    : ""
                                                            }`}
                                                        variants={slideUp}
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h3 className="text-lg font-medium">{getFieldDisplayName(update.field_name)}</h3>
                                                                <p className="text-base text-muted-foreground">
                                                                    Requested on {formatDate(update.requested_at)}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {getStatusBadge(update.status)}
                                                                {update.status === "pending" && isAdmin && (
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                            onClick={() => {
                                                                                // Open a dialog to reject this specific update
                                                                                // For simplicity, we'll just reject directly
                                                                                handleProcessUpdate(update.id, "reject", "Rejected by admin")
                                                                            }}
                                                                        >
                                                                            <XCircle className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                            onClick={() => handleProcessUpdate(update.id, "approve")}
                                                                        >
                                                                            <CheckCircle className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                                <Button variant="ghost" size="sm" onClick={() => toggleExpandUpdate(update.id)}>
                                                                    {expandedUpdates[update.id] ? (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                            <div>
                                                                <p className="text-base font-medium">Current Value</p>
                                                                <p className="text-base font-mono bg-muted p-2 rounded mt-1">
                                                                    {maskValue(update.current_value || "Not set")}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-base font-medium">Requested Value</p>
                                                                <p className="text-base font-mono bg-muted p-2 rounded mt-1">
                                                                    {maskValue(update.requested_value)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Expanded details */}
                                                        {expandedUpdates[update.id] && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="mt-4"
                                                            >
                                                                <Separator className="my-3" />
                                                                {update.status !== "pending" ? (
                                                                    <div className="mt-3">
                                                                        <p className="text-base font-medium">Processed Information</p>
                                                                        <div className="mt-2 space-y-2">
                                                                            <p className="text-base">
                                                                                <span className="font-medium">Processed on:</span>{" "}
                                                                                {formatDate(update.processed_at)}
                                                                            </p>
                                                                            <p className="text-base">
                                                                                <span className="font-medium">Processed by:</span>{" "}
                                                                                {update.pt_users_pt_pending_updates_processed_by_idTopt_users?.user_nicename ||
                                                                                    "System"}
                                                                            </p>
                                                                            {update.status === "rejected" && update.rejection_reason && (
                                                                                <div className="mt-3">
                                                                                    <p className="text-base font-medium">Rejection Reason:</p>
                                                                                    <p className="text-base bg-red-50 text-red-800 p-3 rounded-md mt-1">
                                                                                        {update.rejection_reason}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : isAdmin ? (
                                                                    <div className="mt-3 flex flex-col sm:flex-row gap-3 justify-end">
                                                                        <Button
                                                                            variant="outline"
                                                                            className="border-red-300 text-red-700 hover:bg-red-50"
                                                                            onClick={() => {
                                                                                // Open a dialog to reject this specific update
                                                                                // For simplicity, we'll just reject directly
                                                                                handleProcessUpdate(update.id, "reject", "Rejected by admin")
                                                                            }}
                                                                        >
                                                                            <XCircle className="h-4 w-4 mr-2" />
                                                                            Reject
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            className="border-green-300 text-green-700 hover:bg-green-50"
                                                                            onClick={() => handleProcessUpdate(update.id, "approve")}
                                                                        >
                                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                                            Approve
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="mt-3">
                                                                        <p className="text-base text-muted-foreground italic">
                                                                            This update is pending admin approval
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>
            </Tabs>

            {/* Batch Approve Dialog */}
            <AlertDialog open={isBatchApproveDialogOpen} onOpenChange={setIsBatchApproveDialogOpen}>
                <AlertDialogContent className="max-w-[600px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">Approve All Pending Updates</AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            You are about to approve all {pendingUpdates.length} pending updates for this user. This will update their
                            bank details with all requested values.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4 max-h-[50vh] overflow-y-auto pr-2">
                        <div className="space-y-4">
                            <p className="font-medium text-lg">Updates to approve:</p>
                            {pendingUpdates.map((update) => (
                                <div key={update.id} className="bg-gray-50 p-3 rounded-md border">
                                    <div className="flex justify-between">
                                        <p className="font-medium">{getFieldDisplayName(update.field_name)}</p>
                                        {getStatusBadge(update.status)}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Current Value:</p>
                                            <p className="text-sm font-mono bg-white p-1 rounded border border-gray-100">
                                                {maskValue(update.current_value || "Not set")}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">New Value:</p>
                                            <p className="text-sm font-mono bg-white p-1 rounded border border-gray-100">
                                                {maskValue(update.requested_value)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processingBatch}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleBatchProcess("approve")}
                            disabled={processingBatch}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {processingBatch ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve All Updates
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Batch Reject Dialog */}
            <AlertDialog open={isBatchRejectDialogOpen} onOpenChange={setIsBatchRejectDialogOpen}>
                <AlertDialogContent className="max-w-[600px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">Reject All Pending Updates</AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            You are about to reject all {pendingUpdates.length} pending updates for this user. Please provide a reason
                            for rejection.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4">
                        <div className="max-h-[30vh] overflow-y-auto pr-2 space-y-4">
                            <p className="font-medium text-lg">Updates to reject:</p>
                            {pendingUpdates.map((update) => (
                                <div key={update.id} className="bg-gray-50 p-3 rounded-md border">
                                    <p className="font-medium">{getFieldDisplayName(update.field_name)}</p>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Current Value:</p>
                                            <p className="text-sm font-mono bg-white p-1 rounded border border-gray-100">
                                                {maskValue(update.current_value || "Not set")}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">New Value:</p>
                                            <p className="text-sm font-mono bg-white p-1 rounded border border-gray-100">
                                                {maskValue(update.requested_value)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 mt-6">
                            <Label htmlFor="batch-rejection-reason" className="text-base font-medium">
                                Rejection Reason
                            </Label>
                            <Textarea
                                id="batch-rejection-reason"
                                placeholder="Please provide a reason for rejecting these updates"
                                value={batchRejectionReason}
                                onChange={(e) => setBatchRejectionReason(e.target.value)}
                                rows={4}
                                className="resize-none"
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processingBatch}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleBatchProcess("reject")}
                            disabled={processingBatch || !batchRejectionReason.trim()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {processingBatch ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject All Updates
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    )
}
