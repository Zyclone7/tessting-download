"use server";

import { prisma } from "@/lib/prisma-singleton";
// import { date } from "zod";

// get all bookings from the database
let travelCache: {
  data: any[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION = 60000;

const travelSelectFields = {
  id: true,
  uid: true,
  reference_no: true,
  title: true,
  first_name: true,
  middle_name: true,
  last_name: true,
  pnr: true,
  type_of_travel: true,
  airbus_details_depart: true,
  flight_class_depart: true,
  departure_airport_id: true,
  departure_date: true,
  destination_airport_id: true,
  destination_date: true,
  airbus_details_return: true,
  flight_class_return: true,
  return_departure_airport_id: true,
  return_departure_date: true,
  return_destination_airport_id: true,
  return_destination_date: true,
  baggage_kilogram: true,
  email_merchant: true,
  email_client: true,
  contact_number_merchant: true,
  provider: true,
  purchase_price: true,
  selling_price: true,
  amount_paid: true,
  payment_method: true,
  proof_of_payment_url: true,
  date_booked_request: true,
  status: true,
  date_generated_rejected: true,
  reason_of_rejected: true,
  travel_agency_name: true,
  pdf_url: true,
  travel_agency_address: true,
  travel_agency_number: true,
  social_media_page: true,
};

export async function getAllTravel() {
  try {
    // Check if we have cached data that's still valid
    const now = Date.now()
    if (travelCache.data && now - travelCache.timestamp < CACHE_DURATION) {
      return {
        success: true,
        data: travelCache.data,
        fromCache: true,
      }
    }

    // If no valid cache, fetch from database with selected fields
    const travels = await prisma.pt_xpresstravel.findMany({
      select: travelSelectFields,
      orderBy: {
        id: "desc",
      },
    })

    // Process the data efficiently
    const plainTravels = travels.map(processTravel)

    // Get all unique merchant IDs
    const merchantIds = [...new Set(plainTravels.filter((t) => t.uid).map((t) => t.uid))]

    // Fetch all merchants in a single query
    const merchants =
      merchantIds.length > 0
        ? await prisma.wp_users.findMany({
            where: {
              ID: {
                in: merchantIds.map((id) => Number(id)),
              },
            },
            select: {
              ID: true,
              user_nicename: true,
              display_name: true,
            },
          })
        : []

    // Create a lookup map for quick access
    const merchantMap = new Map()
    merchants.forEach((merchant) => {
      merchantMap.set(String(merchant.ID), {
        user_nicename: merchant.user_nicename,
        display_name: merchant.display_name,
      })
    })

    // Enhance travels with merchant info
    const enhancedTravels = plainTravels.map((travel) => {
      if (travel.uid && merchantMap.has(String(travel.uid))) {
        const merchant = merchantMap.get(String(travel.uid))
        return {
          ...travel,
          merchant_name: merchant.user_nicename || merchant.display_name || "Unknown",
        }
      }
      return travel
    })

    // Update cache
    travelCache = {
      data: enhancedTravels,
      timestamp: now,
    }

    return {
      success: true,
      data: enhancedTravels,
    }
  } catch (error) {
    console.error("Error fetching travels:", error)
    return {
      success: false,
      message: "Failed to fetch travels.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

function processTravel(travel: any) {
  // Use a more efficient approach to transform the data
  return {
    ...travel,
    // Convert Decimal fields to strings
    purchase_price: travel.purchase_price?.toString() || null,
    selling_price: travel.selling_price?.toString() || null,
    amount_paid: travel.amount_paid?.toString() || null,
    baggage_kilogram: travel.baggage_kilogram?.toString() || null,

    // Convert IDs to strings if needed
    departure_airport_id: travel.departure_airport_id?.toString() || null,
    destination_airport_id: travel.destination_airport_id?.toString() || null,
    return_departure_airport_id:
      travel.return_departure_airport_id?.toString() || null,
    return_destination_airport_id:
      travel.return_destination_airport_id?.toString() || null,

    // Convert DateTime fields to ISO strings
    date_generated_rejected:
      travel.date_generated_rejected?.toISOString() || null,
    date_booked_request: travel.date_booked_request?.toISOString() || null,
    departure_date: travel.departure_date?.toISOString() || null,
    destination_date: travel.destination_date?.toISOString() || null,
    return_departure_date: travel.return_departure_date?.toISOString() || null,
    return_destination_date:
      travel.return_destination_date?.toISOString() || null,
  };
}

// get a single booking from the database
export async function createBooking(formData: FormData | null) {
  // Create a new booking
  console.log("Starting createBooking function");
  // Validate input
  if (!formData) {
    console.log("FormData is null or undefined");
    return {
      success: false,
      error: "FormData is null or undefined",
    };
  }

  try {
    // Convert formData to an object
    const booking = Object.fromEntries(formData.entries());
    console.log("Received booking data:", JSON.stringify(booking, null, 2));

    // Helper to safely convert to a number
    const toNumber = (value: any, fallback = 0): number => {
      const num = Number(value);
      return isNaN(num) ? fallback : num;
    };

    // Convert and default some values
    const uid = toNumber(booking.uid, 0);
    const amountPaid = toNumber(booking.amount_paid, 0);
    const paymentMethod = (booking.payment_method as string) || "";

    // IMPORTANT: Make sure that the property names here match your Prisma schema.
    const bookingData = {
      uid: Number.parseInt(uid.toString(), 10),
      reference_no: (booking.reference_no as string) || "",
      title: (booking.title as string) || "",
      first_name: (booking.first_name as string) || "",
      middle_name: (booking.middle_name as string) || null,
      last_name: (booking.last_name as string) || "",
      pnr: (booking.pnr as string) || "",
      email_merchant: (booking.email_merchant as string) || "",
      email_client: (booking.email_client as string) || "",
      contact_number_merchant:
        (booking.contact_number_merchant as string) || "",
      purchase_price: toNumber(booking.purchase_price, 0),
      selling_price: toNumber(booking.selling_price, 0),
      amount_paid: amountPaid,
      payment_method: paymentMethod,
      proof_of_payment_url: (booking.proof_of_payment_url as string) || null,
      type_of_travel: (booking.type_of_travel as string) || "",
      date_booked_request: booking.date_booked_request
        ? new Date(booking.date_booked_request as string)
        : new Date(),
      status: (booking.status as string) || "Pending",
      provider: (booking.provider as string) || null,
      departure_date: booking.departure_date
        ? new Date(booking.departure_date as string)
        : null,
      destination_date: booking.destination_date
        ? new Date(booking.destination_date as string)
        : null,
      departure_airport_id: booking.departure_airport
        ? toNumber(booking.departure_airport)
        : null,
      destination_airport_id: booking.destination_airport
        ? toNumber(booking.destination_airport)
        : null,
      flight_class_depart: (booking.flight_class_depart as string) || null,
      baggage_kilogram: booking.baggage_kilogram
        ? toNumber(booking.baggage_kilogram)
        : null,
      flight_class_return: (booking.return_flight_class as string) || null,
      return_departure_date: booking.return_departure_date
        ? new Date(booking.return_departure_date as string)
        : null,
      return_destination_date: booking.return_destination_date
        ? new Date(booking.return_destination_date as string)
        : null,
      return_departure_airport_id: booking.return_departure_airport
        ? toNumber(booking.return_departure_airport)
        : null,
      return_destination_airport_id: booking.return_destination_airport
        ? toNumber(booking.return_destination_airport)
        : null,
      airbus_details_depart:
        (
          (booking.airline_select ? booking.airline_select : "") +
          (booking.airline_bus ? " " + booking.airline_bus : "")
        ).trim() || null,
      airbus_details_return:
        (
          (booking.return_airline ? booking.return_airline : "") +
          (booking.return_airline_bus ? " " + booking.return_airline_bus : "")
        ).trim() || null,
      pdf_url: (booking.pdf_url as string) || "", // Add pdf_url property
      travel_agency_address: (booking.travel_agency_address as string) || "", // Add travel_agency_address property
      travel_agency_number: (booking.travel_agency_number as string) || "", // Add travel_agency_number property
      social_media_page: (booking.social_media_page as string) || "", // Add social_media_page property
      travel_agency_name: (booking.travel_agency_name as string) || "",
    };

    // Log the final payload to verify it is an object and contains valid data.
    console.log("Booking data object:", JSON.stringify(bookingData, null, 2));

    if (!bookingData) {
      throw new Error("Booking data is null or undefined");
    }

    console.log("Attempting to create new booking in database");

    // Insert the booking into the database
    const newBooking = await prisma.pt_xpresstravel.create({
      data: bookingData,
    });

    if (!newBooking) {
      throw new Error("Failed to create new booking");
    }

    console.log(
      "New booking created successfully:",
      JSON.stringify(newBooking, null, 2)
    );

    // Update user credits if payment method is "credits"
    if (paymentMethod === "credits") {
      console.log(
        `Updating user credits for UID: ${uid}, Amount: ${amountPaid}`
      );
      await prisma.pt_users.update({
        where: { ID: uid },
        data: { user_credits: { decrement: amountPaid } },
      });
    }

    return {
      success: true,
      booking: newBooking,
    };
  } catch (error) {
    console.log("Caught an error in createBooking");

    let errorMessage = "Unknown error occurred";
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack,
      };
    } else if (error && typeof error === "object") {
      errorMessage = "An object was thrown as an error";
      errorDetails = error;
    }

    console.log(
      "Error details:",
      JSON.stringify({ message: errorMessage, details: errorDetails }, null, 2)
    );

    return {
      success: false,
      error: errorMessage,
      details: errorDetails,
    };
  }
}


// update booking status in the database
export async function updateBookingStatus(id: number, status: string, date: string, remarks: string) {
  try {
    const updateData: any = {
      status,
      date_generated_rejected: new Date(date),
    }

    if (status === "Generated") {
      updateData.pdf_url = remarks
    } else if (status === "Rejected") {
      updateData.reason_of_rejected = remarks
    }

    await prisma.pt_xpresstravel.update({
      where: { id },
      data: updateData,
    })

    // Invalidate cache
    travelCache.data = null

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error updating booking status:", error)
    return {
      success: false,
      message: "Failed to update booking status.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getBookingStats() {
  try {
    // Use a single query to get all statistics at once
    const stats: any = await prisma.$queryRaw`
      SELECT 
        COUNT(*) AS total_bookings,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_bookings,
        SUM(CASE WHEN status = 'Generated' THEN 1 ELSE 0 END) AS generated_bookings,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_bookings,
        SUM(CAST(selling_price AS DECIMAL(10,2))) AS total_revenue,
        SUM(CAST(purchase_price AS DECIMAL(10,2))) AS total_cost,
        COUNT(DISTINCT CONCAT(first_name, ' ', last_name)) AS unique_passengers
      FROM pt_xpresstravel
    `

    // Extract the first row from the result
    const result = stats[0]

    return {
      success: true,
      data: {
        totalBookings: Number(result.total_bookings) || 0,
        pendingBookings: Number(result.pending_bookings) || 0,
        generatedBookings: Number(result.generated_bookings) || 0,
        rejectedBookings: Number(result.rejected_bookings) || 0,
        totalRevenue: result.total_revenue?.toString() || "0",
        totalCost: result.total_cost?.toString() || "0",
        profit: (Number(result.total_revenue || 0) - Number(result.total_cost || 0)).toString(),
        uniquePassengers: Number(result.unique_passengers) || 0,
      },
    }
  } catch (error) {
    console.error("Error fetching booking stats:", error)
    return {
      success: false,
      message: "Failed to fetch booking statistics.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// fetch a booking history by user ID
export async function getBookingHistoryByUserId(userId: any) {
  try {
    if (!userId || isNaN(Number.parseInt(userId, 10))) {
      return {
        success: false,
        message: "Invalid or missing user ID.",
      };
    }

    // Fetch all bookings by user ID
    const userBookingHistory = await prisma.pt_xpresstravel.findMany({
      where: {
        uid: Number.parseInt(userId, 10),
      },
      select: {
        reference_no: true,
        title: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        pnr: true,
        email_client: true,
        email_merchant: true,
        contact_number_merchant: true,
        purchase_price: true,
        selling_price: true,
        amount_paid: true,
        payment_method: true,
        date_booked_request: true,
        type_of_travel: true,
        status: true,
        date_generated_rejected: true,
        reason_of_rejected: true,
        departure_date: true,
        destination_date: true,
        departure_airport_id: true,
        destination_airport_id: true,
        flight_class_depart: true,
        baggage_kilogram: true,
        flight_class_return: true,
        return_departure_date: true,
        return_destination_date: true,
        return_departure_airport_id: true,
        return_destination_airport_id: true,
        airbus_details_depart: true,
        airbus_details_return: true,
        travel_agency_name: true,
        travel_agency_address: true,
      },
      orderBy: {
        date_booked_request: "desc",
      },
    });

    // Mapping function to convert Decimal fields to Number
    const transformBookingData = (bookingData: any) => {
      return {
        ...bookingData,

        // Convert Decimal to number
        purchase_price: bookingData.purchase_price
          ? bookingData.purchase_price.toString()
          : null,
        selling_price: bookingData.selling_price
          ? bookingData.selling_price.toString()
          : null,
        amount_paid: bookingData.amount_paid
          ? bookingData.amount_paid.toString()
          : null,
        baggage_kilogram: bookingData.baggage_kilogram
          ? bookingData.baggage_kilogram.toString()
          : null,
        departure_airport_id: bookingData.departure_airport_id
          ? bookingData.departure_airport_id.toString()
          : null,
        destination_airport_id: bookingData.destination_airport_id
          ? bookingData.destination_airport_id.toString()
          : null,
        // Convert DateTime fields to string (ISO format or custom format)
        date_generated_rejected: bookingData.date_generated_rejected
          ? bookingData.date_generated_rejected.toISOString()
          : null,
        date_booked_request: bookingData.date_booked_request
          ? bookingData.date_booked_request.toISOString()
          : null,
        departure_date: bookingData.departure_date
          ? bookingData.departure_date.toISOString()
          : null,
        destination_date: bookingData.destination_date
          ? bookingData.destination_date.toISOString()
          : null,
        return_departure_date: bookingData.return_departure_date
          ? bookingData.return_departure_date.toISOString()
          : null,
        return_destination_date: bookingData.return_destination_date
          ? bookingData.return_destination_date.toISOString()
          : null,
        travel_agency_name: bookingData.travel_agency_name
          ? bookingData.travel_agency_name.toString()
          : null,
        travel_agency_address: bookingData.travel_agency_address
          ? bookingData.travel_agency_address.toString()
          : null,
      };
    };

    // Apply the transformation to all booking records
    const plainBookingHistory = userBookingHistory.map(transformBookingData);

    return {
      success: true,
      data: plainBookingHistory,
    };
  } catch (error) {
    console.error("Error fetching booking history by user ID:", error);
    return {
      success: false,
      message: "Failed to fetch booking history for the specified user.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// fetch all airports from the database
export async function getAllAirport() {
  try {
    const airports = await prisma.pt_airports.findMany({
      orderBy: {
        id: "desc",
      },
    });
    return {
      success: true,
      data: airports,
    };
  } catch (error) {
    console.error("Error fetching airports:", error);
    return {
      success: false,
      message: "Failed to fetch airports.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// fetch a single airport by ID
export async function getAirportById(airportId: any) {
  try {
    if (!airportId || isNaN(Number.parseInt(airportId, 10))) {
      return {
        success: false,
        message: "Invalid or missing airport ID.",
      };
    }

    const airport = await prisma.pt_airports.findUnique({
      where: {
        id: Number.parseInt(airportId, 10),
      },
      select: {
        name: true,
        code: true,
        location: true,
      },
    });

    return {
      success: true,
      data: airport,
    };
  } catch (error) {
    console.error("Error fetching airport by ID:", error);
    return {
      success: false,
      message: "Failed to fetch airport by ID.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// check if a PNR is already exists in the database
export async function isPNRBooked(pnr: string) {
  try {
    const existingBooking = await prisma.pt_xpresstravel.findFirst({
      where: {
        pnr: pnr,
      },
      select: {
        pnr: true,
      },
    });

    return existingBooking !== null;
  } catch (error) {
    console.error("Error checking PNR booking:", error);
    throw error;
  }
}
