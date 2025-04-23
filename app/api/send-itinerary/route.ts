import { NextResponse } from "next/server"
import React from "react"
import { sendItineraryEmail } from "@/lib/xpress_email"
import { getAirportById } from "@/actions/booking"
import { pdf } from "@react-pdf/renderer"
import ItineraryDocument from "@/components/itinerary_document"

export async function POST(request: Request) {
  try {
    const { booking } = await request.json()

    // Fetch airport data
    const airports: Record<string, any> = {}
    const airportPromises = []

    if (booking.departure_airport_id) {
      airportPromises.push(
        getAirportById(booking.departure_airport_id).then((res) => {
          if (res.success) airports.departure = res.data
        })
      )
    }

    if (booking.destination_airport_id) {
      airportPromises.push(
        getAirportById(booking.destination_airport_id).then((res) => {
          if (res.success) airports.destination = res.data
        })
      )
    }

    if (booking.return_departure_airport_id) {
      airportPromises.push(
        getAirportById(booking.return_departure_airport_id).then((res) => {
          if (res.success) airports.returnDeparture = res.data
        })
      )
    }

    if (booking.return_destination_airport_id) {
      airportPromises.push(
        getAirportById(booking.return_destination_airport_id).then((res) => {
          if (res.success) airports.returnDestination = res.data
        })
      )
    }

    await Promise.all(airportPromises)

    // Create PDF document with metadata
    const pdfElement = React.createElement(ItineraryDocument, {
      booking,
      airports,
      title: `Travel Itinerary - ${booking.reference_no}`,
      author: "PHILTECH XPRESS Travels",
      subject: "Flight Booking Confirmation",
      keywords: "itinerary, flight, booking",
      creator: "XPRESS Booking System",
      producer: "PHILTECH XPRESS Travels",
    })

    // Generate PDF buffer
    const pdfStream = await pdf(pdfElement).toBuffer()
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Uint8Array[] = []
      pdfStream.on("data", (chunk) => chunks.push(chunk))
      pdfStream.on("end", () => resolve(Buffer.concat(chunks)))
      pdfStream.on("error", reject)
    })

    // Send email with PDF attachment
    await sendItineraryEmail(
      booking.email_client,
      booking,
      airports,
      pdfBuffer
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in send-itinerary route:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to send itinerary email",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}