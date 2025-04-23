"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader, Wallet, Check, AlertCircle, Info, Tag, Percent, CreditCard } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { getUserProfile } from "@/actions/user"
import { useUserContext } from "@/hooks/use-user"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

// Updated TypeScript interface to include pricing information
interface BookingDetails {
  typeOfVoucher: "GSAT" | "WIFI" | "TV"
  product_code?: string
  duration?: string
  email: string
  phoneNumber: string
  quantity: number
  serviceFee: number
  pricing?: {
    basePrice: number
    productPrice: number
    subtotal: number
    total: number
    discountPercentage: number
    userRole: string
  }
}

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  bookingDetails: BookingDetails
  onBookingSuccess: (paymentMethod: string, proofOfPaymentUrl?: string) => void
  userCredit: number
}

// Format user role for display
const formatUserRole = (role: string) => {
  if (!role) return "N/A"
  return role
    .split("_")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .replace("Package", "")
}

// Get role badge style based on role
const getRoleBadgeStyle = (role: string) => {
  const baseStyle = "text-white px-2 py-1 text-sm font-semibold rounded-2xl"
  switch (role) {
    case "Premium_Merchant_Package":
      return `${baseStyle} bg-[linear-gradient(to_right,_#1D6DBB,_#145998,_#0B4674,_#023251)]`
    case "Basic_Merchant_Package":
      return `${baseStyle} bg-[linear-gradient(to_right,_#020024,_#6de7f7,_#00d4ff)]`
    case "Elite_Distributor_Package":
      return `${baseStyle} bg-[linear-gradient(to_right,_#1D6DBB,_#145998,_#0B4674,_#023251)]`
    case "Elite_Plus_Distributor_Package":
      return `${baseStyle} bg-[linear-gradient(to_right,_#3D89D6,_#1A5EA2,_#0B4674,_#023251)]`
    case "Admin":
      return `${baseStyle} bg-gradient-to-r from-red-400 to-red-600`
    default:
      return `${baseStyle} bg-gradient-to-r from-gray-400 to-gray-600`
  }
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

// Role Badge with loading state
const RoleBadge = ({ role, isLoading }: { role: string; isLoading: boolean }) => {
  if (isLoading) {
    return <Skeleton className="h-7 w-32 rounded-2xl" />
  }

  return <div className={getRoleBadgeStyle(role)}>{formatUserRole(role)}</div>
}

export const PaymentDialog = ({ open, onClose, bookingDetails, onBookingSuccess, userCredit }: PaymentDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [kycStatus, setKycStatus] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUserContext()

  // Get pricing information from bookingDetails or use defaults
  const pricing = bookingDetails?.pricing || {
    basePrice: 0,
    productPrice: 0,
    subtotal: 0,
    total: 0,
    discountPercentage: 0,
    userRole: "",
  }

  // Calculate amounts based on booking details
  const voucherAmount = pricing.subtotal
  const serviceFee = bookingDetails?.serviceFee || 0
  const totalAmount = pricing.total
  const hasEnoughCredits = userCredit >= voucherAmount

  // Fetch user KYC status and role
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && user.id) {
        setIsLoading(true)
        try {
          const response = await getUserProfile(user.id.toString())
          if (response.success && response.data) {
            setKycStatus(Number.parseInt(response.data.user_kyc?.toString() || "0"))
            if (response.data.user_role) {
              setUserRole(response.data.user_role)
            }
          }
        } catch (err) {
          console.error("Error fetching user profile:", err)
        } finally {
          // Add a small delay to ensure smooth transition
          setTimeout(() => {
            setIsLoading(false)
          }, 300)
        }
      }
    }

    if (open) {
      fetchUserProfile()
    }
  }, [user, open])

  // Use the role from pricing if available, otherwise use the fetched role
  const displayRole = pricing.userRole || userRole

  const handleSubmit = async () => {
    setIsProcessing(true)

    try {
      if (!hasEnoughCredits) {
        toast({
          title: "Insufficient Credits",
          description: "You don't have enough credits for this purchase.",
          variant: "destructive",
        })
        return
      }

      // Process credit payment
      onBookingSuccess("credits")
      toast({
        title: "Payment Successful",
        description: `₱${voucherAmount.toFixed(2)} has been deducted from your credits.`,
      })
    } catch (error) {
      console.error("Payment processing error:", error)
      toast({
        title: "Payment Failed",
        description: "An error occurred while processing your payment.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Only disable payment if KYC is confirmed to be 0 or credits are insufficient
  const isPaymentDisabled = (kycStatus === 0 || !hasEnoughCredits) && !isLoading

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] max-h-[100vh] overflow-y-auto">
        <motion.div initial="hidden" animate="visible" exit="exit" variants={fadeIn}>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Confirm Purchase
            </DialogTitle>
            <DialogDescription>Please confirm your voucher purchase using your credits.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Order Summary - Fixed height to prevent layout shifts */}
            <div className="mb-4 p-4 bg-muted rounded-md border border-border/50 shadow-sm min-h-[280px]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                <RoleBadge role={displayRole} isLoading={isLoading} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <span>Type:</span>
                  </div>
                  <span className="font-medium">
                    {bookingDetails?.typeOfVoucher === "TV"
                      ? "TV Subscription"
                      : `${bookingDetails?.typeOfVoucher} Voucher`}
                  </span>
                </div>

                {bookingDetails?.typeOfVoucher === "GSAT" && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <span>Product:</span>
                    </div>
                    <span className="font-medium">{bookingDetails?.product_code}</span>
                  </div>
                )}

                {bookingDetails?.typeOfVoucher === "WIFI" && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <span>Duration:</span>
                    </div>
                    <span className="font-medium">{bookingDetails?.duration}</span>
                  </div>
                )}

                {bookingDetails?.typeOfVoucher === "TV" && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <span>Package:</span>
                    </div>
                    <span className="font-medium">{bookingDetails?.product_code}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span>Quantity:</span>
                  </div>
                  <span className="font-medium">{bookingDetails?.quantity}</span>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Base Price:</span>
                  {isLoading ? <Skeleton className="h-4 w-16" /> : <span>₱{pricing.basePrice.toFixed(2)}</span>}
                </div>

                <div className="flex justify-between items-center">
                  <span>Your Price:</span>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">₱{pricing.productPrice.toFixed(2)}</span>
                      {pricing.discountPercentage > 0 && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {pricing.discountPercentage.toFixed(1)}% off
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span>Subtotal ({bookingDetails.quantity} items):</span>
                  {isLoading ? <Skeleton className="h-4 w-16" /> : <span>₱{voucherAmount.toFixed(2)}</span>}
                </div>

                <div className="flex justify-between items-center">
                  <span>Service Fee:</span>
                  <span>₱{serviceFee.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total Amount:</span>
                {isLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <span className="text-primary">₱{totalAmount.toFixed(2)}</span>
                )}
              </div>

              <div className="mt-3 text-sm text-amber-600 bg-amber-50 p-2 rounded-md flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Only ₱{isLoading ? "..." : voucherAmount.toFixed(2)} will be deducted from your credits</span>
              </div>
            </div>

            {/* Credit Balance Display - Fixed height to prevent layout shifts */}
            <div className="mb-4 p-4 rounded-md border bg-card min-h-[80px]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <span className="font-medium">Your Credit Balance:</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <span
                    className={`font-bold text-lg ${userCredit < voucherAmount ? "text-red-500" : "text-green-500"}`}
                  >
                    ₱{userCredit.toFixed(2)}
                  </span>
                )}
              </div>

              {!isLoading && (
                <>
                  {userCredit < voucherAmount && (
                    <div className="mt-2 flex items-center gap-2 text-red-500 bg-red-50 p-2 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Insufficient credits for this purchase</span>
                    </div>
                  )}

                  {userCredit >= voucherAmount && (
                    <div className="mt-2 flex items-center gap-2 text-green-500 bg-green-50 p-2 rounded-md">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">You have sufficient credits for this purchase</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* KYC Status Display - Only show when loaded and KYC is 0 */}
            {!isLoading && kycStatus === 0 && (
              <div className="mb-4 p-4 rounded-md border bg-red-50 min-h-[80px]">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">KYC Verification Required</span>
                </div>
                <p className="mt-2 text-sm text-red-600">
                  You need to complete KYC verification before you can use your credits for purchases.
                </p>
              </div>
            )}

            {/* Loading placeholder for KYC status */}
            {isLoading && (
              <div className="mb-4 p-4 rounded-md border min-h-[80px]">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose} disabled={isProcessing} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || isPaymentDisabled}
              className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isProcessing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Confirm Purchase"
              )}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

