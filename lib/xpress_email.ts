import nodemailer from "nodemailer"
import { format } from "date-fns"

const transporter = nodemailer.createTransport({
  host: "mail.philtechbusiness.ph", // Replace with your Bluehost mail server
  port: 465, // Use 587 for TLS or 465 for SSL
  secure: true, // true for SSL, false for TLS
  auth: {
    user: process.env.BLUEHOST_EMAIL, // Your Bluehost email (e.g., info@yourdomain.com)
    pass: process.env.BLUEHOST_PASS,  // Your email password
  },
})

function handleFlightClass(flightClass: string): string {
  if (!flightClass) return ""
  return flightClass
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function handleAirBus(airBus: string): string {
  if (!airBus) return ""
  return airBus
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function handleTravelType(travelType: string): string {
  if (!travelType) return ""
  return travelType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export async function sendItineraryEmail(toEmail: string, booking: any, airports: any, pdfBuffer: Buffer) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Flight Itinerary - PHILTECH XPRESS Travels</title>
      <style>
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .header {
          background-color: #00f5ff;
          padding: 20px;
          text-align: center;
          color: #000;
        }
        .content {
          padding: 20px;
        }
        .flight-details {
          background-color: #f9f9f9;
          padding: 15px;
          margin: 15px 0;
          border-radius: 5px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .details-table th,
        .details-table td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }
        .details-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .important-note {
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          padding: 15px;
          margin: 15px 0;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background-color: #f5f5f5;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>Your Flight Itinerary</h1>
          <p>Booking Reference: ${booking.reference_no}</p>
        </div>
        <div class="content">
          <p>Dear ${booking.title} ${booking.first_name} ${booking.last_name},</p>
          <p>Thank you for booking with PHILTECH XPRESS Travels. Please find your flight itinerary details below:</p>

          <div class="flight-details">
            <h3>Flight Details</h3>
            <table class="details-table">
              <tr>
                <th>PNR</th>
                <td>${booking.pnr}</td>
              </tr>
              <tr>
                <th>Flight Type</th>
                <td>${handleTravelType(booking.type_of_travel)}</td>
              </tr>
              <tr>
                <th>Class</th>
                <td>${handleFlightClass(booking.flight_class_depart)}</td>
              </tr>
              <tr>
                <th>Aircraft</th>
                <td>${handleAirBus(booking.airbus_details_depart)}</td>
              </tr>
            </table>

            <h4>Departure Flight</h4>
            <table class="details-table">
              <tr>
                <th>From</th>
                <td>${airports.departure.name} (${airports.departure.code})</td>
              </tr>
              <tr>
                <th>To</th>
                <td>${airports.destination.name} (${airports.destination.code})</td>
              </tr>
              <tr>
                <th>Date & Time</th>
                <td>${format(new Date(booking.departure_date), "MMMM dd, yyyy h:mm a")}</td>
              </tr>
            </table>

            ${
              booking.type_of_travel === "round-trip" && airports.returnDeparture
                ? `
                <h4>Return Flight</h4>
                <table class="details-table">
                  <tr>
                    <th>From</th>
                    <td>${airports.returnDeparture.name} (${airports.returnDeparture.code})</td>
                  </tr>
                  <tr>
                    <th>To</th>
                    <td>${airports.returnDestination.name} (${airports.returnDestination.code})</td>
                  </tr>
                  <tr>
                    <th>Date & Time</th>
                    <td>${format(new Date(booking.return_departure_date), "MMMM dd, yyyy HH:mm")}</td>
                  </tr>
                </table>
              `
                : ""
            }
          </div>

          <div class="important-note">
            <strong>Important Information:</strong>
            <ul>
              <li>Please arrive at the airport at least 2 hours before your departure time.</li>
              <li>Don't forget to bring a valid ID that matches your booking details.</li>
              <li>Your baggage allowance: Checked: ${booking.baggage_kilogram || 0}kg, Carry-on: 7kg</li>
            </ul>
          </div>

          <p>We've attached your complete itinerary as a PDF to this email. Please print it and bring it with you to the airport.</p>

          <p>If you have any questions or need assistance, please don't hesitate to contact us:</p>
          <p>Agency Name: ${booking.travel_agency_name} <br>
          Contact Us: ${booking.social_media_page}</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} PHILTECH XPRESS Travels. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`

  const mailOptions = {
    from: {
      name: "PHILTECH XPRESS Travels",
      address: process.env.BLUEHOST_EMAIL as string,
    },
    to: toEmail,
    subject: `Flight Itinerary - Booking Reference: ${booking.reference_no}`,
    html: htmlContent,
    attachments: [
      {
        filename: `itinerary-${booking.reference_no}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Error sending itinerary email:", error)
    throw new Error("Failed to send itinerary email.")
  }
}



