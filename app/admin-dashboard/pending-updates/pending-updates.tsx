"use client"

import { useState, useEffect, useCallback } from "react"
import { getPendingUpdates, processPendingUpdate } from "@/actions/bank-details"
import { useUserContext } from "@/hooks/use-user"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Search,
    RefreshCw,
    Eye,
    EyeOff,
    Filter,
    ArrowUpDown,
    Check,
} from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { formatUserRole } from "@/lib/utils"

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

export default function PendingUpdatesPage() {
    const { user } = useUserContext()
    const { toast } = useToast()
    const [pendingUpdates, setPendingUpdates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filteredUpdates, setFilteredUpdates] = useState<any[]>([])
    const [showSensitiveData, setShowSensitiveData] = useState(false)
    const [sortOrder, setSortOrder] = useState<"date" | "user" | "field">("date")
    const [filterStatus, setFilterStatus] = useState<"all" | "pending">("pending")
    const [groupedUpdates, setGroupedUpdates] = useState<Record<number, any[]>>({})
    const [processingBatch, setProcessingBatch] = useState(false)

    // Fetch pending updates
    const fetchPendingUpdates = async () => {
        setLoading(true)
        try {
            const result: any = await getPendingUpdates(currentPage, 50) // Increased limit to get more updates at once
            if (result.success) {
                setPendingUpdates(result.data)
                setFilteredUpdates(result.data)
                setTotalPages(result.pagination.pages)

                // Group updates by user
                const grouped: Record<number, any[]> = {}
                result.data.forEach((update: any) => {
                    const userId = update.user_id
                    if (!grouped[userId]) {
                        grouped[userId] = []
                    }
                    grouped[userId].push(update)
                })
                setGroupedUpdates(grouped)
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to fetch pending updates",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error fetching pending updates:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    // Initial fetch
    useEffect(() => {
        fetchPendingUpdates()
    }, [currentPage])

    // Filter updates when search query changes
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredUpdates(pendingUpdates)
        } else {
            const query = searchQuery.toLowerCase()
            const filtered = pendingUpdates.filter(
                (update) =>
                    update.pt_users_pt_pending_updates_user_idTopt_users.user_nicename?.toLowerCase().includes(query) ||
                    update.pt_users_pt_pending_updates_user_idTopt_users.user_email?.toLowerCase().includes(query) ||
                    update.field_name.toLowerCase().includes(query) ||
                    update.requested_value.toLowerCase().includes(query),
            )
            setFilteredUpdates(filtered)
        }
    }, [searchQuery, pendingUpdates])

    // Sort updates
    useEffect(() => {
        const sortedUpdates = [...filteredUpdates]

        if (sortOrder === "date") {
            sortedUpdates.sort((a, b) => new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime())
        } else if (sortOrder === "user") {
            sortedUpdates.sort((a, b) => {
                const nameA = a.pt_users_pt_pending_updates_user_idTopt_users.user_nicename || ""
                const nameB = b.pt_users_pt_pending_updates_user_idTopt_users.user_nicename || ""
                return nameA.localeCompare(nameB)
            })
        } else if (sortOrder === "field") {
            sortedUpdates.sort((a, b) => a.field_name.localeCompare(b.field_name))
        }

        setFilteredUpdates(sortedUpdates)
    }, [sortOrder])

    // Process all updates for a user
    const processBatchUpdates = async (userId: number, action: "approve" | "reject") => {
        if (!user) return

        setProcessingBatch(true)
        const userUpdates = groupedUpdates[userId] || []

        try {
            let successCount = 0
            let failCount = 0

            // Process each update one by one
            for (const update of userUpdates) {
                console.log(`Processing update ID: ${update.id}, action: ${action}`)

                const result = await processPendingUpdate({
                    updateId: update.id,
                    action: action,
                    adminId: user.id,
                    rejectionReason: action === "reject" ? rejectionReason : undefined,
                })

                console.log("Process result:", result)

                if (result.success) {
                    successCount++
                } else {
                    failCount++
                    console.error(`Failed to process update ${update.id}:`, result.message)
                }
            }

            toast({
                title: failCount === 0 ? "Success" : "Partial Success",
                description:
                    failCount === 0
                        ? `All updates were ${action === "approve" ? "approved" : "rejected"} successfully`
                        : `${successCount} updates were processed successfully, ${failCount} failed`,
                variant: failCount === 0 ? "default" : "destructive",
            })

            // Refresh the data
            fetchPendingUpdates()
        } catch (error) {
            console.error(`Error ${action}ing updates:`, error)
            toast({
                title: "Error",
                description: `Failed to ${action} some updates`,
                variant: "destructive",
            })
        } finally {
            setProcessingBatch(false)
            setIsApproveDialogOpen(false)
            setIsRejectDialogOpen(false)
            setRejectionReason("")
            setSelectedUser(null)
        }
    }

    // Handle approve action for a single update
    const handleApprove = async () => {
        if (!selectedUser || !user) return

        setProcessingBatch(true)
        try {
            await processBatchUpdates(selectedUser.userId, "approve")
        } finally {
            setProcessingBatch(false)
        }
    }

    // Handle reject action for a single update
    const handleReject = async () => {
        if (!selectedUser || !user) return

        setProcessingBatch(true)
        try {
            await processBatchUpdates(selectedUser.userId, "reject")
        } finally {
            setProcessingBatch(false)
        }
    }

    // Format date
    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString()
    }, [])

    // Mask sensitive data
    const maskValue = useCallback(
        (value: string, fieldName: string) => {
            if (!showSensitiveData && (fieldName === "bank_account_number" || fieldName === "user_pass")) {
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

    return (
        <motion.div className="container mx-auto py-6 space-y-6" initial="hidden" animate="visible" variants={fadeIn}>
            <motion.div
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                variants={slideUp}
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pending Bank Detail Updates</h1>
                    <p className="text-muted-foreground mt-1">Review and manage bank detail update requests from users</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={() => setShowSensitiveData(!showSensitiveData)}>
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
                    <Button variant="outline" size="sm" onClick={fetchPendingUpdates} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Refresh
                    </Button>
                </div>
            </motion.div>

            <motion.div className="flex flex-col md:flex-row items-center gap-4 mb-6" variants={slideUp}>
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by user, field, or value..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                        <SelectTrigger className="w-[130px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending Only</SelectItem>
                        </SelectContent>
                    </Select>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowUpDown className="h-4 w-4" />
                                Sort
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSortOrder("date")}>
                                {sortOrder === "date" && <Check className="h-4 w-4 mr-2" />}
                                Date (Oldest First)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOrder("user")}>
                                {sortOrder === "user" && <Check className="h-4 w-4 mr-2" />}
                                User Name
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOrder("field")}>
                                {sortOrder === "field" && <Check className="h-4 w-4 mr-2" />}
                                Field Name
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </motion.div>

            {loading ? (
                <motion.div className="grid grid-cols-1 gap-6" variants={staggerContainer}>
                    {[1, 2, 3].map((i) => (
                        <motion.div key={i} variants={slideUp}>
                            <Card className="animate-pulse">
                                <CardHeader className="pb-2">
                                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {[1, 2, 3].map((j) => (
                                                <div key={j} className="h-24 bg-gray-200 rounded"></div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end">
                                    <div className="h-9 bg-gray-200 rounded w-32"></div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            ) : Object.keys(groupedUpdates).length === 0 ? (
                <motion.div variants={fadeIn}>
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <AlertCircle className="h-16 w-16 text-muted-foreground mb-6 opacity-20" />
                            <p className="text-xl font-medium text-center">No pending updates found</p>
                            <p className="text-muted-foreground text-center mt-2">
                                All bank detail update requests have been processed
                            </p>
                            <Button variant="outline" className="mt-6" onClick={fetchPendingUpdates}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Check Again
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
                    {Object.entries(groupedUpdates).map(([userId, updates]) => {
                        // Get the first update to access user information
                        const firstUpdate = updates[0]
                        const user = firstUpdate.pt_users_pt_pending_updates_user_idTopt_users

                        return (
                            <motion.div key={userId} variants={slideUp}>
                                <Card className="overflow-hidden border-l-4 border-l-yellow-400">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg flex items-center">
                                                    {user.user_nicename || "User"}
                                                    <Badge variant="secondary" className="ml-2">
                                                        {updates.length} {updates.length === 1 ? "update" : "updates"}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription className="text-base font-medium">{user.user_email}</CardDescription>
                                            </div>
                                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                                {formatUserRole(user.user_role) || "User"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {updates.map((update: any) => (
                                                    <div
                                                        key={update.id}
                                                        className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="font-medium text-sm">{getFieldDisplayName(update.field_name)}</p>
                                                            {getStatusBadge(update.status)}
                                                        </div>
                                                        <div className="space-y-2 mt-2">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Current Value:</p>
                                                                <p className="text-sm font-mono bg-white p-1 rounded border border-gray-100">
                                                                    {maskValue(update.current_value || "Not set", update.field_name)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Requested Value:</p>
                                                                <p className="text-sm font-mono bg-white p-1 rounded border border-gray-100">
                                                                    {maskValue(update.requested_value, update.field_name)}
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Requested: {formatDate(update.requested_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between bg-gray-50 border-t">
                                        <p className="text-sm text-muted-foreground">
                                            <Clock className="h-3 w-3 inline mr-1" />
                                            Oldest request: {formatDate(updates[0].requested_at)}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="destructive"
                                                onClick={() => {
                                                    setSelectedUser({ userId: Number.parseInt(userId), name: user.user_nicename, updates })
                                                    setIsRejectDialogOpen(true)
                                                }}
                                                disabled={processingBatch}
                                            >
                                                {processingBatch ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                )}
                                                Reject All
                                            </Button>
                                            <Button
                                                variant="default"
                                                onClick={() => {
                                                    setSelectedUser({ userId: Number.parseInt(userId), name: user.user_nicename, updates })
                                                    setIsApproveDialogOpen(true)
                                                }}
                                                disabled={processingBatch}
                                            >
                                                {processingBatch ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                )}
                                                Approve All
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        )
                    })}
                </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || loading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || loading}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Approve Dialog */}
            <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <AlertDialogContent className="max-w-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">Approve All Updates for {selectedUser?.name}</AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            You are about to approve all pending bank detail updates for this user. This will update their account
                            with all requested values.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {selectedUser && (
                        <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">User</p>
                                    <p>{selectedUser.name}</p>
                                </div>
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    {selectedUser.updates.length} {selectedUser.updates.length === 1 ? "update" : "updates"}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <p className="font-medium">Updates to approve:</p>
                                {selectedUser.updates.map((update: any) => (
                                    <div key={update.id} className="bg-gray-50 p-3 rounded-md border">
                                        <div className="flex justify-between">
                                            <p className="font-medium">{getFieldDisplayName(update.field_name)}</p>
                                            {getStatusBadge(update.status)}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Current Value:</p>
                                                <p className="text-sm font-mono bg-white p-1 rounded border border-gray-100">
                                                    {maskValue(update.current_value || "Not set", update.field_name)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">New Value:</p>
                                                <p className="text-sm font-mono bg-white p-1 rounded border border-gray-100">
                                                    {maskValue(update.requested_value, update.field_name)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processingBatch}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleApprove}
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

            {/* Reject Dialog */}
            <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <AlertDialogContent className="max-w-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">Reject All Updates for {selectedUser?.name}</AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            You are about to reject all pending bank detail updates for this user. Please provide a reason for
                            rejection.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {selectedUser && (
                        <div className="space-y-4 my-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">User</p>
                                    <p>{selectedUser.name}</p>
                                </div>
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    {selectedUser.updates.length} {selectedUser.updates.length === 1 ? "update" : "updates"}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="max-h-[30vh] overflow-y-auto pr-2 space-y-2">
                                <p className="font-medium">Updates to reject:</p>
                                {selectedUser.updates.map((update: any) => (
                                    <div key={update.id} className="bg-gray-50 p-2 rounded-md border">
                                        <p className="font-medium">{getFieldDisplayName(update.field_name)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Changing from {maskValue(update.current_value || "Not set", update.field_name)} to{" "}
                                            {maskValue(update.requested_value, update.field_name)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 mt-4">
                                <Label htmlFor="rejection-reason" className="text-base">
                                    Rejection Reason
                                </Label>
                                <Textarea
                                    id="rejection-reason"
                                    placeholder="Please provide a reason for rejecting these updates"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processingBatch}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReject}
                            disabled={processingBatch || !rejectionReason.trim()}
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
