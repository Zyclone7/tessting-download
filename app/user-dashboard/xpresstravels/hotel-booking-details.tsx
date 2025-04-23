"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from "framer-motion"
import { Building, Calendar, User, Users, CreditCard, Clock, MapPin, Bed } from "lucide-react"

interface HotelBookingDetailsProps {
    open: boolean
    onClose: () => void
    bookingDetails: any
    onConfirm: () => void
}

export function HotelBookingDetails({ open, onClose, bookingDetails, onConfirm }: HotelBookingDetailsProps) {
    const [isOpen, setIsOpen] = useState(open)

    useEffect(() => {
        setIsOpen(open)
    }, [open])

    const formatDate = (dateString: string | Date) => {
        if (!dateString) return "Not specified"
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return "Invalid date"

        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
    }

    const formatDateShort = (dateString: string | Date) => {
        if (!dateString) return "Not specified"
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return "Invalid date"

        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    const handleClose = () => {
        setIsOpen(false)
        onClose()
    }

    // Parse additional guests if stored as a string
    const additionalGuests = bookingDetails.additionalGuests
        ? typeof bookingDetails.additionalGuests === "string"
            ? JSON.parse(bookingDetails.additionalGuests)
            : bookingDetails.additionalGuests
        : []

    // Calculate number of nights
    const calculateNights = () => {
        if (!bookingDetails.checkInDate || !bookingDetails.checkOutDate) return 0

        const checkIn = new Date(bookingDetails.checkInDate)
        const checkOut = new Date(bookingDetails.checkOutDate)

        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return 0

        const diffTime = checkOut.getTime() - checkIn.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return diffDays
    }

    const nights = calculateNights()

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <DialogContent className="max-h-[calc(100vh-4rem)] w-[100vw] max-w-5xl flex flex-col overflow-auto rounded-lg p-0 shadow-lg bg-white">
                            <DialogHeader className="p-6 pb-4 border-b border-gray-200">
                                <DialogTitle className="text-2xl font-bold text-[#1A5EA2] flex items-center gap-2">
                                    <Building className="w-6 h-6" />
                                    Hotel Booking Details
                                </DialogTitle>
                                <DialogDescription className="text-gray-600">
                                    Please review your hotel booking information below.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="p-6 overflow-auto">
                                {/* Booking Summary Card */}
                                <Card className="border-[#95C3E3] shadow-sm overflow-hidden mb-6">
                                    <div className="bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] p-4 text-white">
                                        <h3 className="text-lg font-semibold">Booking Summary</h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                                                <Bed className="w-3 h-3 mr-1" />
                                                {bookingDetails.roomType || "Standard Room"}
                                            </Badge>
                                            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {nights} {nights === 1 ? "Night" : "Nights"}
                                            </Badge>
                                            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                                                <Users className="w-3 h-3 mr-1" />
                                                {additionalGuests.length + 1} Guest{additionalGuests.length > 0 ? "s" : ""}
                                            </Badge>
                                            {bookingDetails.bookingId && (
                                                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                                                    ID: {bookingDetails.bookingId}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <CardContent className="p-0">
                                        <div className="p-4 bg-blue-50 border-b border-blue-100">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-5 h-5 text-[#1A5EA2]" />
                                                    <h3 className="font-semibold text-lg text-[#1A5EA2]">{bookingDetails.hotelName}</h3>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 md:mt-0">
                                                    <MapPin className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm text-gray-600">{bookingDetails.destination}</span>
                                                </div>
                                            </div>
                                            {bookingDetails.hotelAddress && (
                                                <p className="text-sm text-gray-600 mt-1 ml-7">{bookingDetails.hotelAddress}</p>
                                            )}
                                        </div>

                                        <div className="p-4 flex flex-col md:flex-row justify-between border-b border-gray-100">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-500">Check-in</span>
                                                <span className="font-medium">{formatDateShort(bookingDetails.checkInDate)}</span>
                                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {bookingDetails.checkInTime || "2:00 PM"}
                                                </div>
                                            </div>
                                            <div className="hidden md:flex items-center text-gray-300 px-4">
                                                <div className="w-16 h-[1px] bg-gray-300"></div>
                                                <div className="px-2 text-xs text-gray-500">
                                                    {nights} {nights === 1 ? "NIGHT" : "NIGHTS"}
                                                </div>
                                                <div className="w-16 h-[1px] bg-gray-300"></div>
                                            </div>
                                            <div className="flex flex-col mt-3 md:mt-0">
                                                <span className="text-sm text-gray-500">Check-out</span>
                                                <span className="font-medium">{formatDateShort(bookingDetails.checkOutDate)}</span>
                                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {bookingDetails.checkOutTime || "12:00 PM"}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Guest Information */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <h3 className="text-md font-semibold text-[#1A5EA2] flex items-center gap-2">
                                                <User className="w-5 h-5" />
                                                Primary Guest
                                            </h3>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <p className="text-sm text-gray-500">Title</p>
                                                    <p className="font-medium">{bookingDetails.title || "Not specified"}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-sm text-gray-500">Full Name</p>
                                                    <p className="font-medium">
                                                        {bookingDetails.firstName} {bookingDetails.lastName}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Email Address</p>
                                                <p className="font-medium">{bookingDetails.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Mobile Number</p>
                                                <p className="font-medium">{bookingDetails.contact_number_client}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Room Details */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <h3 className="text-md font-semibold text-[#1A5EA2] flex items-center gap-2">
                                                <Bed className="w-5 h-5" />
                                                Room Details
                                            </h3>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Room Type</p>
                                                <p className="font-medium">{bookingDetails.roomType || "Standard Room"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Total Guests</p>
                                                <p className="font-medium">
                                                    {additionalGuests.length + 1} Guest{additionalGuests.length > 0 ? "s" : ""}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Duration</p>
                                                <p className="font-medium">
                                                    {nights} {nights === 1 ? "Night" : "Nights"}
                                                </p>
                                            </div>
                                            {bookingDetails.contactNumber && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Hotel Contact</p>
                                                    <p className="font-medium">{bookingDetails.contactNumber}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Additional Guests */}
                                    {additionalGuests.length > 0 && (
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <h3 className="text-md font-semibold text-[#1A5EA2] flex items-center gap-2">
                                                    <Users className="w-5 h-5" />
                                                    Additional Guests
                                                </h3>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {additionalGuests.map((guest: any, index: number) => (
                                                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                                                            <p className="text-sm font-medium mb-2">Guest {index + 2}</p>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Title</p>
                                                                    <p className="font-medium">{guest.title || "Not specified"}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">First Name</p>
                                                                    <p className="font-medium">{guest.firstName || "Not provided"}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Last Name</p>
                                                                    <p className="font-medium">{guest.lastName || "Not provided"}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Pricing Information */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <h3 className="text-md font-semibold text-[#1A5EA2] flex items-center gap-2">
                                                <CreditCard className="w-5 h-5" />
                                                Pricing Information
                                            </h3>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {bookingDetails.basePrice && (
                                                    <div className="flex justify-between">
                                                        <p className="text-gray-500">Base Price</p>
                                                        <p className="font-medium">₱{Number(bookingDetails.basePrice).toFixed(2)}</p>
                                                    </div>
                                                )}

                                                <Separator />

                                                <div className="flex justify-between items-center pt-2">
                                                    <p className="font-medium">Total Amount</p>
                                                    <p className="font-bold text-lg text-[#1A5EA2]">
                                                        ₱{Number(bookingDetails.sellingPrice || 0).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            <DialogFooter className="p-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                                <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                                    Edit Details
                                </Button>
                                <Button
                                    onClick={onConfirm}
                                    className="w-full sm:w-auto bg-[#3D89D6] hover:bg-[#1A5EA2] transition-colors"
                                >
                                    Confirm Booking
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Dialog>
    )
}
