"use server";

import { prisma } from "@/lib/prisma-singleton";

// Define type for additional guests
type GuestInfo = {
  title?: string;
  firstName?: string;
  lastName?: string;
};

// Setup caching similar to travel bookings
let hotelBookingCache: {
  data: any[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION = 60000; // 1 minute

const hotelSelectFields = {
  id: true,
  uid: true,
  booking_id: true, // Field already added to the database
  reference_no: true,
  title: true,
  first_name: true,
  middle_name: true,
  last_name: true,
  email_merchant: true,
  email_client: true,
  contact_number_client: true,
  contact_number_merchant: true,
  purchase_price: true,
  selling_price: true,
  amount_paid: true,
  payment_method: true,
  proof_of_payment_url: true,
  type_of_travel: true,
  date_booked_request: true,
  status: true,
  date_generated_rejected: true,
  reason_of_rejected: true,
  provider: true,
  hotel_name: true,
  hotel_location: true,
  hotel_address: true,
  hotel_contact: true,
  check_in_date: true,
  check_out_date: true,
  check_in_time: true,
  check_out_time: true,
  room_type: true,
  number_of_guests: true,
  special_requests: true,
  additional_guests: true,
  travel_agency_name: true,
  travel_agency_address: true,
  travel_agency_number: true,
  social_media_page: true,
  pdf_url: true,
};

// Get all hotel bookings
export async function getAllHotels() {
  try {
    // Invalidate cache to ensure we fetch fresh data
    hotelBookingCache.data = null;

    // Check if we have cached data that's still valid
    const now = Date.now();
    if (
      hotelBookingCache.data &&
      now - hotelBookingCache.timestamp < CACHE_DURATION
    ) {
      return {
        success: true,
        data: hotelBookingCache.data,
        fromCache: true,
      };
    }

    // If no valid cache, fetch from database
    const hotels = await prisma.pt_xpresshotel.findMany({
      select: hotelSelectFields,
      orderBy: {
        id: "desc",
      },
    });

    // Process the data
    const processedHotels = hotels.map(processHotel);

    // Get all unique merchant IDs
    const merchantIds = [
      ...new Set(processedHotels.filter((b) => b.uid).map((b) => b.uid)),
    ];

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
        : [];

    // Create a lookup map for quick access
    const merchantMap = new Map();
    merchants.forEach((merchant) => {
      merchantMap.set(String(merchant.ID), {
        user_nicename: merchant.user_nicename,
        display_name: merchant.display_name,
      });
    });

    // Enhance hotels with merchant info
    const enhancedHotels = processedHotels.map((hotel) => {
      if (hotel.uid && merchantMap.has(String(hotel.uid))) {
        const merchant = merchantMap.get(String(hotel.uid));
        return {
          ...hotel,
          merchant_name:
            merchant.user_nicename || merchant.display_name || "Unknown",
        };
      }
      return hotel;
    });

    // Update cache
    hotelBookingCache = {
      data: enhancedHotels,
      timestamp: now,
    };

    return {
      success: true,
      data: enhancedHotels,
    };
  } catch (error) {
    console.error("Error fetching hotels:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return {
      success: false,
      message: "Failed to fetch hotels.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Process hotel data
function processHotel(hotel: any) {
  return {
    ...hotel,
    // Convert Decimal fields to strings
    purchase_price: hotel.purchase_price?.toString() || null,
    selling_price: hotel.selling_price?.toString() || null,
    amount_paid: hotel.amount_paid?.toString() || null,

    // Convert DateTime fields to ISO strings
    date_booked_request: hotel.date_booked_request?.toISOString() || null,
    date_generated_rejected:
      hotel.date_generated_rejected?.toISOString() || null,
    check_in_date: hotel.check_in_date?.toISOString() || null,
    check_out_date: hotel.check_out_date?.toISOString() || null,

    // Parse JSON fields if they exist
    additional_guests: hotel.additional_guests
      ? tryParseJSON(hotel.additional_guests)
      : [],
  };
}

// Helper function to safely parse JSON
function tryParseJSON(jsonString: string) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn("Failed to parse JSON string:", e);
    return null;
  }
}

// Create a new hotel booking
export async function createHotelBooking(formData: FormData | null) {
  console.log("Starting createHotelBooking function");

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
    const bookingData = Object.fromEntries(formData.entries());
    console.log("Received booking data:", JSON.stringify(bookingData, null, 2));

    // Helper to safely convert to a number
    const toNumber = (value: any, fallback = 0): number => {
      const num = Number(value);
      return isNaN(num) ? fallback : num;
    };

    // Parse additional guests if present
    let additionalGuests = [];
    if (bookingData.additionalGuests) {
      try {
        additionalGuests = JSON.parse(bookingData.additionalGuests as string);
      } catch (e) {
        console.warn("Failed to parse additional guests:", e);
        additionalGuests = [];
      }
    }

    // Count the number of guests (primary + additional)
    const numberOfGuests =
      1 + (Array.isArray(additionalGuests) ? additionalGuests.length : 0);

    // Use user-provided booking ID only
    const bookingId = bookingData.booking_id as string;

    // Prepare booking record
    const newBooking = {
      uid: toNumber(bookingData.uid, 0),
      booking_id: bookingId, // Use only user-provided booking ID
      reference_no: generateReferenceNumber(),
      title: (bookingData.title as string) || null,
      first_name: (bookingData.firstName as string) || "",
      middle_name: (bookingData.middleName as string) || null,
      last_name: (bookingData.lastName as string) || "",
      email_merchant: (bookingData.email_merchant as string) || "",
      email_client: (bookingData.email as string) || null,
      contact_number_client: (bookingData.phoneNumber as string) || null,
      contact_number_merchant:
        (bookingData.contact_number_merchant as string) || null,
      purchase_price: toNumber(bookingData.basePrice, 0),
      selling_price: toNumber(bookingData.sellingPrice, 0),
      amount_paid: toNumber(bookingData.amountPaid, 0),
      payment_method: (bookingData.paymentMethod as string) || null,
      proof_of_payment_url: (bookingData.proofOfPaymentUrl as string) || null,
      type_of_travel: "hotel",
      date_booked_request: new Date(),
      status: "Pending",
      provider: (bookingData.provider as string) || null,
      hotel_name: (bookingData.hotelName as string) || "",
      hotel_location: (bookingData.destination as string) || "",
      hotel_address: (bookingData.hotelAddress as string) || null,
      hotel_contact: (bookingData.contactNumber as string) || null,
      check_in_date: bookingData.checkInDate
        ? new Date(bookingData.checkInDate as string)
        : null,
      check_out_date: bookingData.checkOutDate
        ? new Date(bookingData.checkOutDate as string)
        : null,
      check_in_time: (bookingData.checkInTime as string) || "14:00",
      check_out_time: (bookingData.checkOutTime as string) || "12:00",
      room_type: (bookingData.roomType as string) || null,
      number_of_guests: numberOfGuests,
      special_requests: (bookingData.specialRequests as string) || null,
      additional_guests: JSON.stringify(additionalGuests),
      travel_agency_name: (bookingData.travel_agency_name as string) || null,
      travel_agency_address:
        (bookingData.travel_agency_address as string) || null,
      travel_agency_number:
        (bookingData.travel_agency_number as string) || null,
      social_media_page: (bookingData.social_media_page as string) || null,
      pdf_url: null,
    };

    console.log("Prepared booking data:", JSON.stringify(newBooking, null, 2));

    // Insert the booking into the database
    const createdBooking = await prisma.pt_xpresshotel.create({
      data: newBooking,
    });

    if (!createdBooking) {
      throw new Error("Failed to create new hotel booking");
    }

    console.log(
      "New hotel booking created successfully:",
      JSON.stringify(createdBooking, null, 2)
    );

    // Update user credits if payment method is "credits"
    if (newBooking.payment_method?.toLowerCase() === "credits") {
      console.log(
        `Updating user credits for UID: ${newBooking.uid}, Amount: ${newBooking.amount_paid}`
      );
      try {
        // Find the user record first to confirm it exists
        const userRecord = await prisma.pt_users.findUnique({
          where: { ID: newBooking.uid },
          select: { ID: true, user_credits: true },
        });

        if (!userRecord) {
          console.warn(
            `User with ID ${newBooking.uid} not found in pt_users table`
          );

          // Try alternative user table if pt_users fails
          const wpUser = await prisma.wp_users.findUnique({
            where: { ID: newBooking.uid },
          });

          if (!wpUser) {
            throw new Error(`No user record found for ID ${newBooking.uid}`);
          }

          // If we found the user in wp_users, check if they have a user_meta record
          const userMeta = await prisma.wp_usermeta.findFirst({
            where: {
              user_id: newBooking.uid,
              meta_key: "user_credits",
            },
          });

          if (userMeta) {
            // Update the user_credits in wp_usermeta
            const currentCredits = parseFloat(userMeta.meta_value || "0");
            const newCredits = Math.max(
              0,
              currentCredits - newBooking.amount_paid
            );

            await prisma.wp_usermeta.update({
              where: { umeta_id: userMeta.umeta_id },
              data: { meta_value: newCredits.toString() },
            });

            console.log(
              `Updated credits in wp_usermeta for user ${newBooking.uid}: ${currentCredits} -> ${newCredits}`
            );
          } else {
            throw new Error(
              `No user_credits meta found for user ID ${newBooking.uid}`
            );
          }
        } else {
          // Update credits in pt_users table
          await prisma.pt_users.update({
            where: { ID: newBooking.uid },
            data: { user_credits: { decrement: newBooking.amount_paid } },
          });

          console.log(
            `Updated credits in pt_users for user ${newBooking.uid} from ${userRecord.user_credits} by -${newBooking.amount_paid}`
          );
        }
      } catch (error) {
        console.error("Error updating user credits:", error);
        // Don't fail the booking if credit update fails, just log the error
      }
    }

    // Invalidate cache
    hotelBookingCache.data = null;

    return {
      success: true,
      booking: processHotel(createdBooking),
    };
  } catch (error) {
    console.log("Caught an error in createHotelBooking:", error);

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

// Update hotel booking status
export async function updateHotelStatus(
  id: number,
  status: string,
  date: string,
  remarks: string
) {
  try {
    const updateData: any = {
      status,
      date_generated_rejected: new Date(date),
    };

    if (status === "Generated") {
      updateData.pdf_url = remarks;
    } else if (status === "Rejected") {
      updateData.reason_of_rejected = remarks;
    }

    await prisma.pt_xpresshotel.update({
      where: { id },
      data: updateData,
    });

    // Invalidate cache
    hotelBookingCache.data = null;

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating hotel status:", error);
    return {
      success: false,
      message: "Failed to update hotel status.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get hotel booking statistics
export async function getHotelStats() {
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
        COUNT(DISTINCT CONCAT(first_name, ' ', last_name)) AS unique_customers
      FROM pt_xpresshotel
    `;

    // Extract the first row from the result
    const result = stats[0];

    return {
      success: true,
      data: {
        totalBookings: Number(result.total_bookings) || 0,
        pendingBookings: Number(result.pending_bookings) || 0,
        generatedBookings: Number(result.generated_bookings) || 0,
        rejectedBookings: Number(result.rejected_bookings) || 0,
        totalRevenue: result.total_revenue?.toString() || "0",
        totalCost: result.total_cost?.toString() || "0",
        profit: (
          Number(result.total_revenue || 0) - Number(result.total_cost || 0)
        ).toString(),
        uniqueCustomers: Number(result.unique_customers) || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching hotel stats:", error);
    return {
      success: false,
      message: "Failed to fetch hotel statistics.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get hotel bookings for a specific user
export async function getHotelBookingsByUserId(userId: any) {
  try {
    if (!userId || isNaN(Number.parseInt(userId, 10))) {
      return {
        success: false,
        message: "Invalid or missing user ID.",
      };
    }

    // Fetch all bookings by user ID
    const bookings = await prisma.pt_xpresshotel.findMany({
      where: {
        uid: Number.parseInt(userId, 10),
      },
      select: hotelSelectFields,
      orderBy: {
        date_booked_request: "desc",
      },
    });

    // Process the bookings
    const processedBookings = bookings.map(processHotel);

    return {
      success: true,
      data: processedBookings,
    };
  } catch (error) {
    console.error("Error fetching hotel bookings by user ID:", error);
    return {
      success: false,
      message: "Failed to fetch hotel bookings for the specified user.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to generate a reference number
function generateReferenceNumber(): string {
  const prefix = "HT";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}${timestamp}${random}`;
}

// Check if a hotel booking with the same details already exists
export async function isHotelBookingExists(
  firstName: string,
  lastName: string,
  checkInDate: string,
  hotelName: string
) {
  try {
    const existingBooking = await prisma.pt_xpresshotel.findFirst({
      where: {
        first_name: firstName,
        last_name: lastName,
        hotel_name: hotelName,
        check_in_date: new Date(checkInDate),
      },
      select: {
        id: true,
      },
    });

    return existingBooking !== null;
  } catch (error) {
    console.error("Error checking hotel booking existence:", error);
    throw error;
  }
}
