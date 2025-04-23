"use client"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Edit, Loader2, Save, Trash2, X, Tag, Percent, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { Voucher } from "./tv-table"

// Define available roles and their display names
const AVAILABLE_ROLES = [
  { value: "Elite_Plus_Distributor_Package", label: "Elite Plus Distributor" },
  { value: "Elite_Distributor_Package", label: "Elite Distributor" },
  { value: "Basic_Merchant_Package", label: "Basic Merchant" },
  { value: "Premium_Merchant_Package", label: "Premium Merchant" },
]

// Helper function to get display name for a role
const getRoleDisplayName = (role: string): string => {
  const foundRole = AVAILABLE_ROLES.find((r) => r.value === role)
  return foundRole ? foundRole.label : role.replace(/_/g, " ")
}

interface TvVoucherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  voucher: Voucher | null
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
  editedVoucher: Partial<Voucher>
  onSave: () => void
  onDelete: (tv_voucher_id: number) => Promise<void>
  onInputChange: (field: keyof Voucher, value: any) => void
  isSaving: boolean
}

export function TvVoucherDialog({
  open,
  onOpenChange,
  voucher,
  isEditing,
  setIsEditing,
  editedVoucher,
  onSave,
  onDelete,
  onInputChange,
  isSaving,
}: TvVoucherDialogProps) {
  const initialSetup = useRef(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    if (isEditing && voucher && !initialSetup.current) {
      onInputChange("card_number", voucher.card_number)
      onInputChange("product_name", voucher.product_name)
      onInputChange("voucher_code", voucher.voucher_code)
      onInputChange("account", voucher.account)
      onInputChange("amount", voucher.amount)
      onInputChange("discount", voucher.discount)
      onInputChange("updated_at", voucher.updated_at)
      onInputChange("owned_by", voucher.owned_by)
      onInputChange("status", voucher.status)

      if (voucher.created_at) {
        setSelectedDate(new Date(voucher.created_at))
      }
    }

    if (!open) {
      initialSetup.current = false
    }
  }, [isEditing, open, voucher, onInputChange])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      if (voucher?.tv_voucher_id !== undefined && voucher?.tv_voucher_id !== null) {
        await onDelete(voucher.tv_voucher_id)
      }
      setDeleteConfirmOpen(false)
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting voucher:", error)
      alert("Failed to delete voucher")
    } finally {
      setIsDeleting(false)
    }
  }

  // Get pricing details from voucher
  const pricingDetails = voucher
    ? {
      basePrice: voucher.base_price || 0,
      discountedPrice: voucher.role_price || 0,
      discount: voucher.role_discount || 0,
      discountPercentage: voucher.role_discount_percentage || 0,
      userRole: voucher.user_role || null,
    }
    : null

  const DeleteConfirmationDialog = () => (
    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>Are you sure you want to delete this voucher?</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <>
      <DeleteConfirmationDialog />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary/5 border-b">
            <DialogTitle className="text-xl font-bold text-primary flex items-center">
              <span className="mr-2">TV Voucher Details</span>
              {voucher && (
                <Badge
                  className={cn(
                    voucher.status === "used" && "bg-green-500",
                    voucher.status === "expired" && "bg-red-500",
                    voucher.status === "null" && "bg-yellow-500",
                  )}
                >
                  {(voucher.status as string) === "null"
                    ? "Unused"
                    : (voucher.status as string)?.charAt(0).toUpperCase() + (voucher.status as string)?.slice(1) ||
                    "N/A"}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col md:flex-row gap-6 p-6">
            {/* Left Card - Voucher Information */}
            <div className="w-full md:w-1/2">
              <Card className="border-2 border-primary/10 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-primary">Voucher Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Card Number</Label>
                      {isEditing ? (
                        <Input
                          value={editedVoucher.card_number || voucher?.card_number || ""}
                          onChange={(e) => onInputChange("card_number", e.target.value)}
                          className="mt-1 border-primary/20 focus:border-primary"
                        />
                      ) : (
                        <div className="font-medium mt-1 bg-muted/30 p-2 rounded-md">
                          {voucher?.card_number || "N/A"}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Product Name</Label>
                      {isEditing ? (
                        <Input
                          value={editedVoucher.product_name || voucher?.product_name || ""}
                          onChange={(e) => onInputChange("product_name", e.target.value)}
                          className="mt-1 border-primary/20 focus:border-primary"
                        />
                      ) : (
                        <div className="font-medium mt-1 bg-muted/30 p-2 rounded-md">
                          {voucher?.product_name || "N/A"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs">Password / Recharge Code</Label>
                    {isEditing ? (
                      <Input
                        value={editedVoucher.voucher_code || voucher?.voucher_code || ""}
                        onChange={(e) => onInputChange("voucher_code", e.target.value)}
                        className="mt-1 border-primary/20 focus:border-primary"
                      />
                    ) : (
                      <div className="font-medium mt-1 bg-muted/30 p-2 rounded-md">
                        {voucher?.voucher_code || "N/A"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs">Account</Label>
                    {isEditing ? (
                      <Input
                        value={editedVoucher.account || voucher?.account || ""}
                        onChange={(e) => onInputChange("account", e.target.value)}
                        className="mt-1 border-primary/20 focus:border-primary"
                      />
                    ) : (
                      <div className="font-medium mt-1 bg-muted/30 p-2 rounded-md">{voucher?.account || "N/A"}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs">Status</Label>
                    {isEditing ? (
                      <Select
                        value={editedVoucher.status || voucher?.status || "null"}
                        onValueChange={(value) => onInputChange("status", value)}
                      >
                        <SelectTrigger className="mt-1 border-primary/20">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Unused</SelectItem>
                          <SelectItem value="used">Used</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="font-medium mt-1">
                        <Badge
                          className={cn(
                            "mt-2",
                            voucher?.status === "used" && "bg-green-500",
                            voucher?.status === "expired" && "bg-red-500",
                            voucher?.status === "null" && "bg-yellow-500",
                          )}
                        >
                          {(voucher?.status as string) === "null"
                            ? "Unused"
                            : (voucher?.status as string)?.charAt(0).toUpperCase() +
                            (voucher?.status as string)?.slice(1) || "N/A"}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs">Owned By</Label>
                    <div className="font-medium mt-1 bg-muted/30 p-2 rounded-md flex items-center">
                      {voucher?.owned_by || "N/A"}
                      {pricingDetails?.userRole && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "ml-2 text-xs",
                            pricingDetails.userRole === "Elite_Plus_Distributor_Package" && "bg-blue-100 text-blue-800",
                            pricingDetails.userRole === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                            pricingDetails.userRole === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                            pricingDetails.userRole === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
                          )}
                        >
                          {getRoleDisplayName(pricingDetails.userRole)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Created At</Label>
                      <div className="font-medium mt-1 bg-muted/30 p-2 rounded-md">
                        {voucher?.created_at ? format(new Date(voucher.created_at), "MMM d, yyyy") : "N/A"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Updated At</Label>
                      <div className="font-medium mt-1 bg-muted/30 p-2 rounded-md">
                        {voucher?.updated_at ? format(new Date(voucher.updated_at), "MMM d, yyyy") : "N/A"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Card - Pricing Details */}
            <div className="w-full md:w-1/2">
              <Card className="border-2 border-primary/10 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-primary">Pricing Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pricingDetails ? (
                    <>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                            Base Price:
                          </span>
                          <span className="text-lg font-bold">₱{pricingDetails.basePrice.toFixed(2)}</span>
                        </div>

                        {pricingDetails.userRole && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium flex items-center">
                              <Tag className="h-4 w-4 mr-1 text-muted-foreground" />
                              Role Price:
                              <Badge
                                variant="outline"
                                className={cn(
                                  "ml-2 text-xs",
                                  pricingDetails.userRole === "Elite_Plus_Distributor_Package" &&
                                  "bg-blue-100 text-blue-800",
                                  pricingDetails.userRole === "Elite_Distributor_Package" &&
                                  "bg-indigo-100 text-indigo-800",
                                  pricingDetails.userRole === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                                  pricingDetails.userRole === "Premium_Merchant_Package" &&
                                  "bg-purple-100 text-purple-800",
                                )}
                              >
                                {getRoleDisplayName(pricingDetails.userRole)}
                              </Badge>
                            </span>
                            <span className="text-lg font-bold">₱{pricingDetails.discountedPrice.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium flex items-center">
                            <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                            Discount:
                          </span>
                          <div className="text-right">
                            <span className="text-lg font-bold">₱{pricingDetails.discount.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground block">
                              ({pricingDetails.discountPercentage.toFixed(2)}%)
                            </span>
                          </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Final Price:</span>
                          <span className="text-lg font-bold text-primary">
                            ₱{pricingDetails.discountedPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">All Role Prices</h4>
                        <div className="space-y-2">
                          {AVAILABLE_ROLES.map((role) => {
                            // Calculate pricing for each role
                            const basePrice = pricingDetails.basePrice
                            const discountRates: Record<string, number> = {
                              Elite_Plus_Distributor_Package: 0.25,
                              Elite_Distributor_Package: 0.2,
                              Basic_Merchant_Package: 0.1,
                              Premium_Merchant_Package: 0.15,
                            }

                            const discountRate = discountRates[role.value] || 0
                            const rolePriceValue = basePrice * (1 - discountRate)
                            const roleDiscount = basePrice - rolePriceValue
                            const roleDiscountPercentage = discountRate * 100

                            return (
                              <div
                                key={role.value}
                                className={cn(
                                  "flex justify-between items-center p-2 rounded-md",
                                  pricingDetails.userRole === role.value && "bg-muted",
                                )}
                              >
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    role.value === "Elite_Plus_Distributor_Package" && "bg-blue-100 text-blue-800",
                                    role.value === "Elite_Distributor_Package" && "bg-indigo-100 text-indigo-800",
                                    role.value === "Basic_Merchant_Package" && "bg-green-100 text-green-800",
                                    role.value === "Premium_Merchant_Package" && "bg-purple-100 text-purple-800",
                                  )}
                                >
                                  {role.label}
                                </Badge>
                                <div className="text-right">
                                  <span className="font-medium">₱{rolePriceValue.toFixed(2)}</span>
                                  {roleDiscount > 0 && (
                                    <span className="text-xs text-muted-foreground block">
                                      (-{roleDiscountPercentage.toFixed(1)}%)
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">No pricing details available</div>
                  )}

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Amount & Discount</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">Amount</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editedVoucher.amount || voucher?.amount || 0}
                            onChange={(e) => onInputChange("amount", Number.parseFloat(e.target.value))}
                            className="mt-1 border-primary/20 focus:border-primary"
                          />
                        ) : (
                          <div className="font-medium mt-1 bg-muted/30 p-2 rounded-md">
                            ₱{voucher?.amount?.toFixed(2) || "0.00"}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Discount</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editedVoucher.discount || voucher?.discount || 0}
                            onChange={(e) => onInputChange("discount", Number.parseFloat(e.target.value))}
                            className="mt-1 border-primary/20 focus:border-primary"
                          />
                        ) : (
                          <div className="font-medium mt-1 bg-muted/30 p-2 rounded-md">
                            ₱{voucher?.discount?.toFixed(2) || "0.00"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter className="flex justify-end space-x-2 p-6 pt-0 border-t mt-4">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="border-red-300 hover:bg-red-50 text-red-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 hover:bg-red-50 text-red-600"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

