"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createBooking } from "@/actions/booking"
import { useUserContext } from "@/hooks/use-user"

const calculateSellingPrice = (role: string): number => { // static function to calculate selling price based on role
  const rolePrices = {
    Basic_Merchant_Package: 50,
    Premium_Merchant_Package: 40,
    Elite_Distributor_Package: 30,
    Elite_Plus_Distributor_Package: 25,
  }

  const price = rolePrices[role as keyof typeof rolePrices]

  if (price === undefined) {
    throw new Error(`Invalid role: ${role}`)
  }

  return price
}

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  bookingDetails: any
  onBookingSuccess: () => void
  userCredit: number;
}

export function PaymentDialog({ open, onClose, bookingDetails, onBookingSuccess, userCredit }: PaymentDialogProps) {
  // const router = useRouter()
  const { user } = useUserContext()
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = React.useState("creadits")
  const [isLoading, setIsLoading] = React.useState(false)
  const [showConfirmation, setShowConfirmation] = React.useState(false)
  const [proofOfPayment, setProofOfPayment] = React.useState<File | null>(null)

  const handlePayment = async () => {
    setIsLoading(true)
    try {

      if (paymentMethod === "MAYA" && !proofOfPayment) {
        throw new Error("Please upload proof of payment for MAYA transactions.")
      }

      if (paymentMethod === "credits" && userCredit < calculateSellingPrice(user?.role || "")) {
        throw new Error("Insufficient credits. Please choose another payment method.")
      }

      let proofOfPaymentUrl = ""


      if (paymentMethod === "credits") {

      }

      // Upload proof of payment if payment method is MAYA
      if (paymentMethod === "MAYA" && proofOfPayment) {
        const blobFormData = new FormData()
        blobFormData.append("file", proofOfPayment)

        const blobUploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: blobFormData,
        })

        const blobResult = await blobUploadResponse.json()

        if (blobUploadResponse.ok && blobResult.url) {
          proofOfPaymentUrl = blobResult.url
          console.log("Proof of Payment URL:", proofOfPaymentUrl)
        } else {
          console.error("Blob Upload Failed:", blobResult.error || "Unknown error")
          throw new Error(blobResult.error || "Failed to upload proof of payment.")
        }
      }

      // Prepare the form data with all fields
      const amountPaid = user?.role ? calculateSellingPrice(user.role) : 0
      const referenceNo = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase()


      const formData = new FormData()
      formData.append("uid", user?.id?.toString() || "")
      formData.append("reference_no", referenceNo)
      formData.append("proof_of_payment_url", proofOfPaymentUrl)
      formData.append("amount_paid", amountPaid.toString())
      formData.append("type_of_travel", bookingDetails.typeOfTravel)

      // Add other booking details
      Object.entries(bookingDetails).forEach(([key, value]) => {
        if (value !== null && value !== undefined && !formData.has(key)) {
          formData.append(key, value.toString())
        }
      })

      formData.append("payment_method", paymentMethod)
      formData.append("date_booked_request", new Date().toISOString())


      // Log FormData content
      formData.forEach((value, key) => {
        console.log(`FormData - ${key}:`, value)
      })

      // Send the booking request
      const result = await createBooking(formData)

      if (result.success) {
        toast({
          title: "Booking Details Sent Successfully",
          description: `Your booking has been successfully sent and is being prepared for the final itinerary! Reference No: ${referenceNo}`,
          duration: 5000,
        })
        onBookingSuccess() // Call this new function
      } else {
        throw new Error(result.error || "Booking failed. Please try again.")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "An error occurred during payment. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
      setShowConfirmation(false)
      onClose()
    }
  }



  const handleConfirmPayment = () => {
    if (paymentMethod === "MAYA" && !proofOfPayment) {
      toast({
        title: "Proof of Payment Required",
        description: "Please upload proof of payment for MAYA transactions.",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    if (paymentMethod === "credits" && userCredit < calculateSellingPrice(user?.role || "")) {
      toast({
        title: "Insufficient Credits",
        description: "You don't have enough credits for this booking. Please choose another payment method.",
        variant: "destructive",
        duration: 5000,
      })
      return
    }
    setShowConfirmation(true)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        setProofOfPayment(file)
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image or PDF file.",
          variant: "destructive",
          duration: 5000,
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Payment Details
          </DialogTitle>
          <DialogDescription className="text-center">
            Please review your booking details and confirm payment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <div>
                <Label className="text-sm font-medium text-gray-500">Mode of Payment</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isLoading} defaultValue="credits">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>

                    {(user?.user_kyc?.toString() === '1' || user?.status?.toString() === '1') && (
                      <SelectItem value="credits">Credits</SelectItem>
                    )}
                    <SelectItem value="MAYA">MAYA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentMethod === "credits" && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-500">Available Credits</Label>
                  <Input value={`${userCredit}`} readOnly className="mt-2" />
                  <p className="mt-2 text-sm text-gray-500">
                    You need at least {user?.role ? calculateSellingPrice(user.role) : "0"} credits for this transaction.
                  </p>
                </div>
              )}
              {paymentMethod === "MAYA" && (
                <div className="mt-4">
                  <div className="mt-4 border-2 rounded-lg p-4">
                    <Label className="text-sm font-bold text-black">MAYA ACCOUNT DETAILS:</Label>
                    <div className="mt-2">
                      <Label className="text-sm font-bold text-black">ARNOLD A.</Label>
                    </div>
                    <div className="mt-2">
                      <Label className="text-sm font-bold text-black">09199908108</Label>
                    </div>
                  </div>
                  <Label htmlFor="proofOfPayment" className="text-sm font-medium text-gray-500">
                    Proof of Payment (Image or PDF)
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="proofOfPayment"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                  </div>
                  {proofOfPayment && (
                    <p className="mt-2 text-sm text-green-600">File uploaded: {proofOfPayment.name}</p>
                  )}
                </div>
              )}
              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-500">Total Transaction Amount</Label>
                <Input
                  value={paymentMethod === "credits" ? user?.role ? calculateSellingPrice(user.role) : "0" : `₱${user?.role ? calculateSellingPrice(user.role) : "0"}`}
                  readOnly
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button className="w-full sm:w-auto" onClick={handleConfirmPayment} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              "Confirm Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {showConfirmation && (
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
              <DialogDescription>
                Are you sure you want to proceed with the payment of ₱
                {user?.role ? calculateSellingPrice(user.role) : "0"}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
