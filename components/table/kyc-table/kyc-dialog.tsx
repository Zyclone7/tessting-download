"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Globe,
  CreditCard,
  MapPin,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface KYCDialogProps {
  kyc: any
  userDetails: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onKYCUpdate: (updatedKYC: any) => void
}

export function KYCDialog({ kyc, userDetails, open, onOpenChange, onKYCUpdate }: KYCDialogProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null)

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await onKYCUpdate({
        ...kyc,
        status: "APPROVED",
        reason_of_reject: null,
      })
      setConfirmAction(null)
    } catch (error) {
      console.error("Error approving KYC:", error)
    }
    setIsSubmitting(false)
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onKYCUpdate({
        ...kyc,
        status: "REJECTED",
        reason_of_reject: rejectionReason,
      })
      setConfirmAction(null)
    } catch (error) {
      console.error("Error rejecting KYC:", error)
    }
    setIsSubmitting(false)
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase()

    if (statusLower === "approved") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </Badge>
      )
    }

    if (statusLower === "rejected") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">KYC Verification {getStatusBadge(kyc.status)}</DialogTitle>
          <DialogDescription>
            Submitted on{" "}
            {kyc.date_submitted ? format(new Date(kyc.date_submitted), "MMMM d, yyyy 'at' h:mm a") : "Unknown date"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">User Details</TabsTrigger>
            <TabsTrigger value="documents">Verification Documents</TabsTrigger>
            <TabsTrigger value="decision">Decision</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" /> Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border">
                      <AvatarImage
                        src={userDetails?.profile_pic_url || "/placeholder.svg"}
                        alt={userDetails?.display_name || "User"}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-lg">
                        {userDetails?.user_nicename?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{userDetails?.user_nicename || "Unknown User"}</h3>
                      <p className="text-sm text-muted-foreground">User ID: #{kyc.user_id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm">{userDetails?.user_email || "No email provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Contact Number</p>
                        <p className="text-sm">{userDetails?.user_contact_number || "No contact number provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Registered On</p>
                        <p className="text-sm">
                          {userDetails?.user_registered
                            ? format(new Date(userDetails.user_registered), "MMMM d, yyyy")
                            : "Unknown date"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Business Name</p>
                        <p className="text-sm">{userDetails?.business_name || "No business name provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Business Address</p>
                        <p className="text-sm">{userDetails?.business_address || "No business address provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Merchant ID</p>
                        <p className="text-sm">{userDetails?.merchant_id || "No merchant ID provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Social Media / Website</p>
                        <p className="text-sm">{userDetails?.social_media_page || "No social media provided"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Valid ID</CardTitle>
                  <CardDescription>Government-issued identification document</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="relative w-full h-full rounded-md overflow-hidden border">
                    <img
                      src={kyc.valid_id_url || "/placeholder.svg"}
                      alt="Valid ID"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=300&width=400"
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button variant="outline" onClick={() => window.open(kyc.valid_id_url, "_blank")}>
                    View Full Size
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Selfie Photo</CardTitle>
                  <CardDescription>Self-portrait for identity verification</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="relative w-full h-full rounded-md overflow-hidden border">
                    <img
                      src={kyc.selfie_pic_url || "/placeholder.svg"}
                      alt="Selfie"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=300&width=400"
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button variant="outline" onClick={() => window.open(kyc.selfie_pic_url, "_blank")}>
                    View Full Size
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="decision" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Current status: {getStatusBadge(kyc.status)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {kyc.status?.toLowerCase() === "pending" ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-700">Verification Required</h4>
                        <p className="text-sm text-amber-700">
                          Please review the submitted documents and make a decision to approve or reject this KYC
                          verification.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rejection-reason">Rejection Reason (required if rejecting)</Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Provide a detailed reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                ) : kyc.status?.toLowerCase() === "approved" ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-700">Verification Approved</h4>
                        <p className="text-sm text-green-700">
                          This KYC verification was approved on{" "}
                          {kyc.date_approve_denied
                            ? format(new Date(kyc.date_approve_denied), "MMMM d, yyyy")
                            : "Unknown date"}
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                ) : kyc.status?.toLowerCase() === "rejected" ? (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-700">Verification Rejected</h4>
                        <p className="text-sm text-red-700">
                          This KYC verification was rejected on{" "}
                          {kyc.date_approve_denied
                            ? format(new Date(kyc.date_approve_denied), "MMMM d, yyyy")
                            : "Unknown date"}
                          .
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Rejection Reason</Label>
                      <div className="p-3 bg-muted rounded-md text-sm">
                        {kyc.reason_of_reject ? (
                          kyc.reason_of_reject
                        ) : (
                          <span className="text-muted-foreground">No reason provided</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                {kyc.status?.toLowerCase() === "pending" && (
                  <>
                    <Button variant="outline" onClick={() => setConfirmAction("reject")} disabled={isSubmitting}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button onClick={() => setConfirmAction("approve")} disabled={isSubmitting}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>

            {/* Confirmation Dialogs */}
            <AnimatePresence>
              {confirmAction === "approve" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 bg-white shadow-md"
                >
                  <h3 className="text-lg font-medium mb-2">Confirm Approval</h3>
                  <p className="text-muted-foreground mb-4">
                    Are you sure you want to approve this KYC verification? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button onClick={handleApprove} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirm Approval
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {confirmAction === "reject" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 bg-white shadow-md"
                >
                  <h3 className="text-lg font-medium mb-2">Confirm Rejection</h3>
                  <p className="text-muted-foreground mb-4">
                    Are you sure you want to reject this KYC verification? This action cannot be undone.
                  </p>
                  {!rejectionReason.trim() && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-700">
                      Please provide a reason for rejection.
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isSubmitting || !rejectionReason.trim()}
                    >
                      {isSubmitting ? (
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}