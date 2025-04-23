"use client"

import { useEffect, useState } from "react"
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
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { IconPlane, IconUser, IconMail, IconCreditCard } from "@tabler/icons-react"
import { format } from "date-fns"
import { getAllAirport } from "@/actions/booking" // Import the getAllAirport function

interface Airport {
  id: number
  name: string
  code: string
  location: string
}

interface FlightDetails {
  title: string
  first_name: string
  last_name: string
  middle_name: string
  email_merchant: string
  email_client: string
  contact_number_merchant: string
  provider: string
  purchase_price: number
  selling_price: number
  amount_paid: number
  pnr: string
  typeOfTravel: string
  flight_class_depart: string
  departure_airport: string
  departure_date: string
  destination_airport: string
  destination_date: string
  airline_select: string
  airline_bus: string
  baggage_kilogram?: number
  return_flight_class?: string
  return_departure_airport?: string
  return_departure_date?: string
  return_destination_airport?: string
  return_destination_date?: string
  return_airline?: string
  return_airline_bus?: string
  pdf_url?: string | null
  travel_agency_name?: string
  travel_agency_address?: string
  travel_agency_number?: string
  social_media_page?: string
}

interface BookingDetailsProps {
  open: boolean
  onClose: () => void
  bookingDetails: FlightDetails
  onConfirm: () => void
}

export function BookingDetails({ open, onClose, bookingDetails, onConfirm }: BookingDetailsProps) {
  // Add airports state
  const [airports, setAirports] = useState<Airport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch airports on component mount
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        setLoading(true)
        const response = await getAllAirport()
        if (response.success) {
          setAirports(
            response.data?.map((airport) => ({
              id: airport.id,
              name: airport.name || "Unknown",
              code: airport.code || "Unknown",
              location: airport.location || "Unknown",
            })) || []
          )
        } else {
          setError(response.message || "Failed to fetch airports")
        }
      } catch (err) {
        setError("An error occurred while fetching airports")
        console.error("Error fetching airports:", err)
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchAirports()
    }
  }, [open])

  // Function to get airport name by ID or code
  const getAirportName = (airportId: string) => {
    if (!airportId || airports.length === 0) return airportId

    // Check if the ID is numeric
    const isNumeric = !isNaN(Number(airportId))

    const airport = isNumeric
      ? airports.find(a => a.id === Number(airportId))
      : airports.find(a => a.code === airportId || a.name.includes(airportId))

    return airport
      ? `${airport.name} (${airport.code})`
      : airportId
  }

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified"
    try {
      const date = new Date(dateString)
      return format(date, "PPP p") // Format: "Apr 29, 2023, 1:30 PM"
    } catch (error) {
      return dateString
    }
  }

  // Get flight class display name
  const getFlightClass = (classCode: string) => {
    const classes: Record<string, string> = {
      economy_class: "Economy Class",
      premium_economy_class: "Premium Economy Class",
      business_class: "Business Class",
      first_class: "First Class",
    }
    return classes[classCode] || classCode
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#1A5EA2] flex items-center gap-2">
            <IconPlane className="w-6 h-6" />
            Booking Details
          </DialogTitle>
          <DialogDescription>Please review your booking details before confirming</DialogDescription>
        </DialogHeader>

        {loading && <p className="text-center py-4">Loading airport information...</p>}
        {error && <p className="text-red-500 text-center py-4">{error}</p>}

        <div className="mt-4 space-y-6">
          {/* Booking Summary Card */}
          <Card className="border-[#95C3E3] shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] p-4 text-white">
              <h3 className="text-lg font-semibold">Booking Summary</h3>
              <div className="flex items-center mt-1">
                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                  {bookingDetails.typeOfTravel === "one-way" ? "One-way Flight" : "Round-trip Flight"}
                </Badge>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30 ml-2">
                  PNR: {bookingDetails.pnr}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Passenger Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-semibold text-[#1A5EA2] flex items-center gap-2 mb-3">
                    <IconUser className="w-5 h-5" />
                    Passenger Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">
                        {bookingDetails.title} {bookingDetails.first_name} {bookingDetails.middle_name}{" "}
                        {bookingDetails.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium">{bookingDetails.email_client}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Flight Information */}
                <div>
                  <h4 className="text-md font-semibold text-[#1A5EA2] flex items-center gap-2 mb-3">
                    <IconPlane className="w-5 h-5" />
                    Flight Information
                  </h4>

                  <div className="space-y-4">
                    {/* Departure Flight */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h5 className="font-medium text-blue-800 mb-2">Departure Flight</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">From</p>
                          <p className="font-medium">{getAirportName(bookingDetails.departure_airport)}</p>
                          <p className="text-sm text-gray-600">{formatDate(bookingDetails.departure_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">To</p>
                          <p className="font-medium">{getAirportName(bookingDetails.destination_airport)}</p>
                          <p className="text-sm text-gray-600">{formatDate(bookingDetails.destination_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Airline</p>
                          <p className="font-medium">{bookingDetails.airline_select}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Class</p>
                          <p className="font-medium">{getFlightClass(bookingDetails.flight_class_depart)}</p>
                        </div>
                        {bookingDetails.baggage_kilogram && (
                          <div>
                            <p className="text-sm text-gray-500">Baggage</p>
                            <p className="font-medium">{bookingDetails.baggage_kilogram} kg</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Return Flight (if round-trip) */}
                    {bookingDetails.typeOfTravel === "round-trip" && bookingDetails.return_departure_airport && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <h5 className="font-medium text-indigo-800 mb-2">Return Flight</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">From</p>
                            <p className="font-medium">{getAirportName(bookingDetails.return_departure_airport)}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(bookingDetails.return_departure_date || "")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">To</p>
                            <p className="font-medium">{getAirportName(bookingDetails.return_destination_airport || "")}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(bookingDetails.return_destination_date || "")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Airline</p>
                            <p className="font-medium">{bookingDetails.return_airline || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Class</p>
                            <p className="font-medium">{getFlightClass(bookingDetails.return_flight_class || "")}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div>
                  <h4 className="text-md font-semibold text-[#1A5EA2] flex items-center gap-2 mb-3">
                    <IconMail className="w-5 h-5" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                    <div>
                      <p className="text-sm text-gray-500">Merchant Email</p>
                      <p className="font-medium">{bookingDetails.email_merchant}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Merchant Contact</p>
                      <p className="font-medium">{bookingDetails.contact_number_merchant}</p>
                    </div>
                    {bookingDetails.travel_agency_name && (
                      <div>
                        <p className="text-sm text-gray-500">Travel Agency</p>
                        <p className="font-medium">{bookingDetails.travel_agency_name}</p>
                      </div>
                    )}
                    {bookingDetails.travel_agency_address && (
                      <div>
                        <p className="text-sm text-gray-500">Agency Address</p>
                        <p className="font-medium">{bookingDetails.travel_agency_address}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Pricing Information */}
                <div>
                  <h4 className="text-md font-semibold text-[#1A5EA2] flex items-center gap-2 mb-3">
                    <IconCreditCard className="w-5 h-5" />
                    Pricing Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                    <div>
                      <p className="text-sm text-gray-500">Provider</p>
                      <p className="font-medium">{bookingDetails.provider}</p>
                    </div>
                    {Number(bookingDetails.purchase_price) > 0 && (
                      <div>
                        <p className="text-sm text-gray-500">Purchase Price</p>
                        <p className="font-medium">₱{Number(bookingDetails.purchase_price).toFixed(2)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Selling Price</p>
                      <p className="font-medium text-lg text-[#1A5EA2]">₱{Number(bookingDetails.selling_price).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Edit Details
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-auto bg-[#3D89D6] hover:bg-[#1A5EA2] transition-colors">
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}