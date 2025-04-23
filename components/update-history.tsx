"use client"

import { useState, useEffect } from "react"
import { getUserUpdateHistory } from "@/actions/bank-details"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UpdateHistoryProps {
    userId: number
}

export function UpdateHistory({ userId }: UpdateHistoryProps) {
    const { toast } = useToast()
    const [updateHistory, setUpdateHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("all")
    const [showSensitiveData, setShowSensitiveData] = useState(false)

    // Fetch update history
    const fetchUpdateHistory = async () => {
        setLoading(true)
        try {
            const result: any = await getUserUpdateHistory(userId)
            if (result.success) {
                setUpdateHistory(result.data)
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to fetch update history",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error fetching update history:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (userId) {
            fetchUpdateHistory()
        }
    }, [userId])

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString()
    }

    // Get field display name
    const getFieldDisplayName = (fieldName: string) => {
        const fieldMap: Record<string, string> = {
            bank_name: "Bank Name",
            bank_account_number: "Bank Account Number",
            cf_share: "CF Share",
            merchant_id: "Merchant ID",
            terminal_id: "Terminal ID",
            user_pass: "Password",
        }
        return fieldMap[fieldName] || fieldName
    }

    // Get status badge
    const getStatusBadge = (status: string) => {
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
    }

    // Mask sensitive data
    const maskValue = (value: string, fieldName: string) => {
        if (!showSensitiveData && (fieldName === "bank_account_number" || fieldName === "user_pass")) {
            if (!value) return ""
            const length = value.length
            if (length <= 4) return "****"
            return "****" + value.substring(length - 4)
        }
        return value
    }

    // Filter updates based on active tab
    const filteredUpdates = updateHistory.filter((update) => {
        if (activeTab === "all") return true
        return update.status.toLowerCase() === activeTab
    })

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Update History</CardTitle>
                        <CardDescription>History of bank detail update requests</CardDescription>
                    </div>
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
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="all">All Updates</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab}>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-pulse space-y-4 w-full">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-gray-200 h-24 rounded-md w-full"></div>
                                    ))}
                                </div>
                            </div>
                        ) : filteredUpdates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                                <p className="text-lg font-medium">No update history found</p>
                                <p className="text-sm text-muted-foreground">
                                    {activeTab === "all" ? "No bank detail updates have been requested" : `No ${activeTab} updates found`}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredUpdates.map((update) => (
                                    <div
                                        key={update.id}
                                        className={`border rounded-lg p-4 ${update.status === "pending"
                                            ? "border-l-4 border-l-yellow-400"
                                            : update.status === "approved"
                                                ? "border-l-4 border-l-green-400"
                                                : update.status === "rejected"
                                                    ? "border-l-4 border-l-red-400"
                                                    : ""
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-medium">{getFieldDisplayName(update.field_name)}</h3>
                                                <p className="text-sm text-muted-foreground">Requested on {formatDate(update.requested_at)}</p>
                                            </div>
                                            {getStatusBadge(update.status)}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <p className="text-sm font-medium">Current Value</p>
                                                <p className="text-sm font-mono bg-muted p-1 rounded mt-1">
                                                    {maskValue(update.current_value || "Not set", update.field_name)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Requested Value</p>
                                                <p className="text-sm font-mono bg-muted p-1 rounded mt-1">
                                                    {maskValue(update.requested_value, update.field_name)}
                                                </p>
                                            </div>
                                        </div>

                                        {update.status !== "pending" && (
                                            <>
                                                <Separator className="my-3" />
                                                <div className="mt-2">
                                                    <p className="text-sm font-medium">Processed Information</p>
                                                    <div className="mt-1">
                                                        <p className="text-sm">
                                                            <span className="font-medium">Processed on:</span> {formatDate(update.processed_at)}
                                                        </p>
                                                        <p className="text-sm">
                                                            <span className="font-medium">Processed by:</span>{" "}
                                                            {update.pt_users_pt_pending_updates_processed_by_idTopt_users?.user_nicename || "System"}
                                                        </p>
                                                        {update.status === "rejected" && update.rejection_reason && (
                                                            <div className="mt-2">
                                                                <p className="text-sm font-medium">Rejection Reason:</p>
                                                                <p className="text-sm bg-red-50 text-red-800 p-2 rounded">{update.rejection_reason}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
