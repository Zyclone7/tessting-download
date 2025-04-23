"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUserContext } from "@/hooks/use-user"
import { updateBankDetails, getUserPendingUpdates } from "@/actions/bank-details"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Clock, AlertCircle, Eye, EyeOff, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BankDetailsFormProps {
    userData: any
    readOnly?: boolean
    isCurrentUser?: boolean
}

export function BankDetailsForm({ userData, readOnly = false, isCurrentUser = true }: BankDetailsFormProps) {
    const { user } = useUserContext()
    const { toast } = useToast()
    const [formData, setFormData] = useState({
        bank_name: userData?.bank_name || "",
        bank_account_number: userData?.bank_account_number || "",
        cf_share: userData?.cf_share || 0,
        merchant_id: userData?.merchant_id || "",
        terminal_id: userData?.terminal_id || "",
    })
    const [originalData, setOriginalData] = useState({ ...formData })
    const [loading, setLoading] = useState(false)
    const [pendingUpdates, setPendingUpdates] = useState<any[]>([])
    const [showPassword, setShowPassword] = useState(false)
    const isAdmin = user?.role === "admin"

    // Fetch pending updates for this user
    const fetchPendingUpdates = async () => {
        if (!userData?.ID) return

        try {
            const result: any = await getUserPendingUpdates(userData.ID)
            if (result.success) {
                setPendingUpdates(result.data)
            }
        } catch (error) {
            console.error("Error fetching pending updates:", error)
        }
    }

    useEffect(() => {
        if (userData) {
            setFormData({
                bank_name: userData.bank_name || "",
                bank_account_number: userData.bank_account_number || "",
                cf_share: userData.cf_share || 0,
                merchant_id: userData.merchant_id || "",
                terminal_id: userData.terminal_id || "",
            })
            setOriginalData({
                bank_name: userData.bank_name || "",
                bank_account_number: userData.bank_account_number || "",
                cf_share: userData.cf_share || 0,
                merchant_id: userData.merchant_id || "",
                terminal_id: userData.terminal_id || "",
            })
            fetchPendingUpdates()
        }
    }, [userData])

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

        // Check if any fields have changed
        const hasChanges = Object.keys(formData).some(
            (key) => formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData],
        )

        if (!hasChanges) {
            toast({
                title: "No Changes",
                description: "No changes were made to the bank details",
            })
            return
        }

        setLoading(true)
        try {
            const result = await updateBankDetails({
                userId: userData.ID,
                updates: formData,
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
                    fetchPendingUpdates()
                }
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
            setLoading(false)
        }
    }

    // Check if a field has a pending update
    const hasPendingUpdate = (fieldName: string) => {
        return pendingUpdates.some((update) => update.field_name === fieldName && update.status === "pending")
    }

    // Get pending update for a field
    const getPendingUpdate = (fieldName: string) => {
        return pendingUpdates.find((update) => update.field_name === fieldName && update.status === "pending")
    }

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString()
    }

    // Mask sensitive data
    const maskValue = (value: string) => {
        if (!showPassword) {
            if (!value) return ""
            const length = value.length
            if (length <= 4) return "****"
            return "****" + value.substring(length - 4)
        }
        return value
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Bank Details</CardTitle>
                        <CardDescription>
                            {isAdmin ? "Manage bank and payment details" : "Updates to these details require admin approval"}
                        </CardDescription>
                    </div>
                    {pendingUpdates.length > 0 && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            <Clock className="h-3 w-3 mr-1" />
                            {pendingUpdates.length} Pending Update{pendingUpdates.length > 1 ? "s" : ""}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {pendingUpdates.length > 0 && (
                    <Alert className="mb-6 bg-yellow-50 text-yellow-800 border-yellow-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Pending Updates</AlertTitle>
                        <AlertDescription>
                            This user has pending update requests that need admin approval.
                            {!isAdmin && " Your changes won't be visible until approved."}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="bank_name">Bank Name</Label>
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
                            disabled={readOnly || loading || hasPendingUpdate("bank_name")}
                            placeholder="Enter bank name"
                            className={hasPendingUpdate("bank_name") ? "border-yellow-300 bg-yellow-50" : ""}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="bank_account_number">Bank Account Number</Label>
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
                                            <p>Requested value: {maskValue(getPendingUpdate("bank_account_number")?.requested_value)}</p>
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
                                disabled={readOnly || loading || hasPendingUpdate("bank_account_number")}
                                placeholder="Enter bank account number"
                                type={showPassword ? "text" : "password"}
                                className={hasPendingUpdate("bank_account_number") ? "border-yellow-300 bg-yellow-50 pr-10" : "pr-10"}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="cf_share">CF Share (%)</Label>
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
                            disabled={readOnly || loading || hasPendingUpdate("cf_share")}
                            placeholder="Enter CF share percentage"
                            className={hasPendingUpdate("cf_share") ? "border-yellow-300 bg-yellow-50" : ""}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="merchant_id">Merchant ID</Label>
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
                            disabled={readOnly || loading || hasPendingUpdate("merchant_id")}
                            placeholder="Enter merchant ID"
                            className={hasPendingUpdate("merchant_id") ? "border-yellow-300 bg-yellow-50" : ""}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="terminal_id">Terminal ID</Label>
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
                            disabled={readOnly || loading || hasPendingUpdate("terminal_id")}
                            placeholder="Enter terminal ID"
                            className={hasPendingUpdate("terminal_id") ? "border-yellow-300 bg-yellow-50" : ""}
                        />
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mr-1" />
                    {isAdmin
                        ? "As an admin, your changes will be applied immediately"
                        : "Your changes will require admin approval"}
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={
                        readOnly ||
                        loading ||
                        Object.keys(formData).every(
                            (key) => formData[key as keyof typeof formData] === originalData[key as keyof typeof originalData],
                        )
                    }
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
