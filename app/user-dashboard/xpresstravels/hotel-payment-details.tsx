import React, { useState } from "react"
import { Loader2 } from "lucide-react"
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
import { createHotelBooking } from "@/actions/hotel-booking"
import { useUserContext } from "@/hooks/use-user"

const calculateSellingPrice = (role: string): number => {
    const rolePrices = {
        Basic_Merchant_Package: 50,
        Premium_Merchant_Package: 40,
        Elite_Distributor_Package: 30,
        Elite_Plus_Distributor_Package: 25,
    }

    const price = rolePrices[role as keyof typeof rolePrices]

    if (price === undefined) {
        return 50; // Default to highest price if role not found
    }

    return price
}

interface HotelPaymentDialogProps {
    open: boolean
    onClose: () => void
    bookingDetails: any
    onBookingSuccess: () => void
    userCredit: number
}

export function HotelPaymentDialog({
    open,
    onClose,
    bookingDetails,
    onBookingSuccess,
    userCredit
}: HotelPaymentDialogProps) {
    const { user } = useUserContext()
    const { toast } = useToast()
    const [paymentMethod, setPaymentMethod] = useState("MAYA")
    const [isLoading, setIsLoading] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [proofOfPayment, setProofOfPayment] = useState<File | null>(null)

    const handlePayment = async () => {
        setIsLoading(true)
        try {
            // Validate booking details
            if (!bookingDetails) {
                throw new Error("Booking details are missing")
            }

            // Validate payment method specific requirements
            if (paymentMethod === "MAYA" && !proofOfPayment) {
                throw new Error("Please upload proof of payment for MAYA transactions.")
            }

            const amountToPay = user?.role ? calculateSellingPrice(user.role) : 0
            if (paymentMethod === "credits" && userCredit < amountToPay) {
                throw new Error("Insufficient credits. Please choose another payment method.")
            }

            let proofOfPaymentUrl = ""

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
                } else {
                    throw new Error(blobResult.error || "Failed to upload proof of payment.")
                }
            }

            // Prepare the form data with all fields
            const amountPaid = user?.role ? calculateSellingPrice(user.role) : 0

            // Create a fresh FormData object
            const formData = new FormData()

            // Add user ID and critical booking fields first
            formData.append("uid", user?.id?.toString() || "")
            formData.append("paymentMethod", paymentMethod) // Make sure this matches exactly what the server expects
            formData.append("amountPaid", amountPaid.toString())
            formData.append("proofOfPaymentUrl", proofOfPaymentUrl)
            formData.append("basePrice", (amountPaid * 0.7).toString()) // Example business logic for base price
            formData.append("sellingPrice", amountPaid.toString())

            // Ensure required fields are present
            const essentialFields = [
                "hotelName", "bookingId", "checkInDate", "checkOutDate", 
                "firstName", "lastName", "email", "phoneNumber"
              ];

            for (const field of essentialFields) {
                if (!bookingDetails[field]) {
                    throw new Error(`Missing required field: ${field}`)
                }
            }

            // Add all booking details from the bookingDetails object
            Object.entries(bookingDetails).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    // Skip arrays or objects that need special handling
                    if (typeof value !== 'object' || value instanceof File) {
                        formData.append(key, value.toString())
                    }
                }
            })

            // Handle special fields like additionalGuests explicitly
            if (bookingDetails.additionalGuests) {
                try {
                    // If it's already a string, use it directly
                    if (typeof bookingDetails.additionalGuests === 'string') {
                        formData.append("additionalGuests", bookingDetails.additionalGuests)
                    } else {
                        // Otherwise, stringify it
                        formData.append("additionalGuests", JSON.stringify(bookingDetails.additionalGuests))
                    }
                } catch (error) {
                    console.error("Error processing additional guests:", error)
                    formData.append("additionalGuests", "[]")
                }
            }

            // Log FormData contents for debugging
            console.log("FormData keys:", [...formData.keys()])

            // Call the server action with the FormData object
            const result = await createHotelBooking(formData)

            if (!result) {
                throw new Error("No response received from server")
            }

            if (result.success) {
                toast({
                    title: "Hotel Booking Sent Successfully",
                    description: `Your hotel booking has been processed!`,
                    duration: 5000,
                })
                onBookingSuccess()
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

        const amountToPay = user?.role ? calculateSellingPrice(user.role) : 0
        if (paymentMethod === "credits" && userCredit < amountToPay) {
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

    // Calculate the payment amount based on user's role
    const paymentAmount = user?.role ? calculateSellingPrice(user.role) : 0;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">
                        Hotel Booking Payment
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Please review your hotel booking details and confirm payment.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Mode of Payment</Label>
                                <Select
                                    value={paymentMethod}
                                    onValueChange={setPaymentMethod}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MAYA">MAYA</SelectItem>
                                        {(user?.user_kyc?.toString() === '1' || user?.status?.toString() === '1') && (
                                            <SelectItem value="credits">Credits</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            {paymentMethod === "credits" && (
                                <div className="mt-4">
                                    <Label className="text-sm font-medium text-gray-500">Available Credits</Label>
                                    <Input value={`${userCredit}`} readOnly className="mt-2" />

                                    <div className="mt-2 flex justify-between items-center">
                                        <p className="text-sm text-gray-500">
                                            Required credits:
                                        </p>
                                        <p className="text-sm font-bold">
                                            {paymentAmount}
                                        </p>
                                    </div>

                                    <div className="mt-2 flex justify-between items-center">
                                        <p className="text-sm text-gray-500">
                                            Your balance:
                                        </p>
                                        <p className={`text-sm font-bold ${userCredit < paymentAmount ? 'text-red-500' : 'text-green-500'}`}>
                                            {userCredit}
                                        </p>
                                    </div>

                                    {userCredit < paymentAmount && (
                                        <p className="mt-2 text-xs text-red-500">
                                            You don't have enough credits for this booking. Please choose another payment method.
                                        </p>
                                    )}
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
                                    value={paymentMethod === "credits"
                                        ? paymentAmount.toString()
                                        : `₱${paymentAmount}`}
                                    readOnly
                                    className="font-bold"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <DialogFooter>
                    <Button
                        className="w-full sm:w-auto"
                        onClick={handleConfirmPayment}
                        disabled={isLoading || (paymentMethod === "credits" && userCredit < paymentAmount)}
                    >
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
                                Are you sure you want to proceed with the payment of {paymentMethod === "credits"
                                    ? `${paymentAmount} credits`
                                    : `₱${paymentAmount}`}?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirmation(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePayment}
                                disabled={isLoading}
                            >
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