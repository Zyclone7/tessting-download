import nodemailer from "nodemailer";
import { format } from "date-fns";

const transporter = nodemailer.createTransport({
  host: "mail.philtechbusiness.ph", // Replace with your Bluehost mail server
  port: 465, // Use 587 for TLS or 465 for SSL
  secure: true, // true for SSL, false for TLS
  auth: {
    user: process.env.BLUEHOST_EMAIL, // Your Bluehost email (e.g., info@yourdomain.com)
    pass: process.env.BLUEHOST_PASS, // Your email password
  },
});

// Helper function to calculate nights between two date strings
function calculateNights(checkInDate: string, checkOutDate: string): number {
  if (!checkInDate || !checkOutDate) return 0;

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  // Calculate the difference in milliseconds
  const diffInMs = checkOut.getTime() - checkIn.getTime();

  // Convert to days and round to handle daylight saving time changes
  return Math.round(diffInMs / (1000 * 60 * 60 * 24));
}

// Format currency helper
const formatCurrency = (amount: string | number | undefined): string => {
  if (!amount) return "0.00";
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  return numericAmount.toFixed(2);
};

export async function sendHotelItineraryEmail(
  toEmail: string,
  booking: any,
  pdfBuffer: Buffer
) {
  // Calculate nights
  const nights = calculateNights(booking.check_in_date, booking.check_out_date);

  // Format check-in and check-out dates
  const formattedCheckIn = booking.check_in_date
    ? format(new Date(booking.check_in_date), "EEEE, MMMM dd, yyyy")
    : "N/A";

  const formattedCheckOut = booking.check_out_date
    ? format(new Date(booking.check_out_date), "EEEE, MMMM dd, yyyy")
    : "N/A";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Hotel Reservation - PHILTECH XPRESS Travels</title>
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
        .hotel-details {
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
        .hotel-image {
          width: 100%;
          height: auto;
          max-height: 200px;
          object-fit: cover;
          border-radius: 5px;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>Your Hotel Reservation</h1>
          <p>Booking Reference: ${booking.reference_no || "N/A"}</p>
        </div>
        <div class="content">
          <p>Dear ${booking.title || ""} ${booking.first_name || ""} ${
    booking.last_name || ""
  },</p>
          <p>Thank you for booking with PHILTECH XPRESS Travels. Your hotel reservation has been confirmed, and we're excited to help make your stay a pleasant one.</p>

          <div class="hotel-details">
            <h3>Hotel Details</h3>
            <table class="details-table">
              <tr>
                <th>Hotel Name</th>
                <td>${booking.hotel_name || "N/A"}</td>
              </tr>
              <tr>
                <th>Location</th>
                <td>${
                  booking.hotel_address || booking.hotel_location || "N/A"
                }</td>
              </tr>
              <tr>
                <th>Contact</th>
                <td>${booking.hotel_contact || "N/A"}</td>
              </tr>
            </table>

            <h3>Reservation Information</h3>
            <table class="details-table">
              <tr>
                <th>Check-in</th>
                <td>${formattedCheckIn} (After 2:00 PM)</td>
              </tr>
              <tr>
                <th>Check-out</th>
                <td>${formattedCheckOut} (Before 12:00 PM)</td>
              </tr>
              <tr>
                <th>Duration</th>
                <td>${nights} night${nights !== 1 ? "s" : ""}</td>
              </tr>
              <tr>
                <th>Room Type</th>
                <td>${booking.room_type || "Standard Room"}</td>
              </tr>
              <tr>
                <th>Number of Rooms</th>
                <td>${booking.number_of_rooms || "1"}</td>
              </tr>
              <tr>
                <th>Number of Guests</th>
                <td>${booking.number_of_guests || "1"}</td>
              </tr>
              <tr>
                <th>Room Rate per Night</th>
                <td>₱${formatCurrency(
                  booking.room_rate_per_night ||
                    (booking.selling_price && nights > 0
                      ? Number(booking.selling_price) / nights
                      : 0)
                )}</td>
              </tr>
              <tr>
                <th>Total Amount</th>
                <td>₱${formatCurrency(booking.selling_price || 0)}</td>
              </tr>
            </table>
          </div>

          <div class="important-note">
            <strong>Important Information:</strong>
            <ul>
              <li>Please bring a valid ID that matches your booking details for check-in.</li>
              <li>The hotel may require a credit card or cash deposit for incidental charges.</li>
              <li>If you need to modify or cancel your reservation, please contact us as soon as possible.</li>
              <li>Special requests are subject to availability and may incur additional charges.</li>
            </ul>
          </div>

          <p>We've attached your complete hotel itinerary as a PDF to this email. We recommend keeping this for your records and having it readily available during check-in.</p>

          <p>If you have any questions or need assistance, please don't hesitate to contact us:</p>
          <p>Agency Name: ${
            booking.travel_agency_name || "PHILTECH XPRESS Travels"
          } <br>
          Contact Us: ${booking.contact_number_merchant || "N/A"}<br>
          Social Media: ${booking.social_media_page || "N/A"}</p>
          
          <p>We hope you have a wonderful stay!</p>
          <p>Best regards,<br>PHILTECH XPRESS Travels Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} PHILTECH XPRESS Travels. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`;

  const mailOptions = {
    from: {
      name: "PHILTECH XPRESS Travels",
      address: process.env.BLUEHOST_EMAIL as string,
    },
    to: toEmail,
    subject: `Hotel Reservation - Booking Reference: ${
      booking.reference_no || "N/A"
    }`,
    html: htmlContent,
    attachments: [
      {
        filename: `hotel-itinerary-${booking.reference_no || "booking"}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending hotel itinerary email:", error);
    throw new Error("Failed to send hotel itinerary email.");
  }
}
