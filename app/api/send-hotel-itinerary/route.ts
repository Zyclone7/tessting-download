import { NextResponse } from "next/server";
import React from "react";
import { sendHotelItineraryEmail } from "@/lib/hotel_xpress_email";
import { pdf } from "@react-pdf/renderer";
import HotelItineraryDocument from "@/components/hotel-iterinary-documents";

export async function POST(request: Request) {
  try {
    const { booking, additionalGuests = [] } = await request.json();

    // Calculate booking dates
    const bookingDates = {
      checkIn: booking.check_in_date ? new Date(booking.check_in_date) : null,
      checkOut: booking.check_out_date
        ? new Date(booking.check_out_date)
        : null,
      nights: 0,
    };

    // Calculate number of nights
    if (bookingDates.checkIn && bookingDates.checkOut) {
      const timeDiff =
        bookingDates.checkOut.getTime() - bookingDates.checkIn.getTime();
      bookingDates.nights = Math.round(timeDiff / (1000 * 60 * 60 * 24));
    }

    // Create PDF document with metadata
    const pdfElement = React.createElement(HotelItineraryDocument, {
      booking,
      bookingDates,
      additionalGuests,
      title: `Hotel Itinerary - ${booking.reference_no || "Booking"}`,
      author: "PHILTECH XPRESS Travels",
      subject: "Hotel Booking Confirmation",
      keywords: "itinerary, hotel, booking, accommodation",
      creator: "XPRESS Booking System",
      producer: "PHILTECH XPRESS Travels",
    });

    // Generate PDF buffer
    const pdfStream = await pdf(pdfElement).toBuffer();
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      pdfStream.on("data", (chunk) => chunks.push(chunk));
      pdfStream.on("end", () => resolve(Buffer.concat(chunks)));
      pdfStream.on("error", reject);
    });

    // Send email with PDF attachment
    await sendHotelItineraryEmail(booking.email_client, booking, pdfBuffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in send-hotel-itinerary route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send hotel itinerary email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
