"use server";

import { prisma } from "@/lib/prisma-singleton";

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

export async function getDashboardData(userId?: string) {
  try {
    // Execute all queries in parallel using Promise.all
    const [bookingsData, statsData, trendsData] = await Promise.all([
      getFilteredBookings(userId),
      getBookingStats(userId),
      getMonthlyBookingTrends(userId),
    ]);

    return {
      success: true,
      data: {
        bookings: bookingsData.success ? bookingsData.data : [],
        stats: statsData.success ? statsData.data : null,
        trends: trendsData.success ? trendsData.data : [],
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      success: false,
      message: "Failed to fetch dashboard data.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// In the getFilteredBookings function, convert the userId string to an integer
async function getFilteredBookings(userId?: string) {
  try {
    // Build where clause
    const where: any = {};

    // If userId is provided, filter by user ID - convert string to integer
    if (userId) {
      where.uid = Number.parseInt(userId, 10);

      // If parsing fails (NaN), don't include the filter
      if (isNaN(where.uid)) {
        delete where.uid;
      }
    }

    // Fetch bookings with selected fields
    const bookings = await prisma.pt_xpresstravel.findMany({
      where,
      select: {
        id: true,
        uid: true,
        reference_no: true,
        title: true,
        first_name: true,
        last_name: true,
        pnr: true,
        type_of_travel: true,
        email_client: true,
        email_merchant: true,
        purchase_price: true,
        selling_price: true,
        amount_paid: true,
        date_booked_request: true,
        status: true,
        pdf_url: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    // Process the data
    const processedBookings = bookings.map(processTravel);

    return {
      success: true,
      data: processedBookings,
    };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return {
      success: false,
      message: "Failed to fetch bookings.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Also fix the getBookingStats function to handle userId as an integer
async function getBookingStats(userId?: string) {
  try {
    // Build the SQL query with optional user filter
    let query = `
        SELECT 
          COUNT(*) AS total_bookings,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_bookings,
          SUM(CASE WHEN status = 'Generated' THEN 1 ELSE 0 END) AS generated_bookings,
          SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_bookings,
          SUM(CAST(selling_price AS DECIMAL(10,2))) AS total_revenue,
          SUM(CAST(purchase_price AS DECIMAL(10,2))) AS total_cost,
          COUNT(DISTINCT CONCAT(first_name, ' ', last_name)) AS unique_passengers
        FROM pt_xpresstravel
      `;

    // Add WHERE clause if userId is provided
    if (userId) {
      const parsedUserId = Number.parseInt(userId, 10);
      if (!isNaN(parsedUserId)) {
        query += ` WHERE uid = ${parsedUserId}`;
      }
    }

    // Execute the query
    const stats: any = await prisma.$queryRawUnsafe(query);

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
        uniquePassengers: Number(result.unique_passengers) || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    return {
      success: false,
      message: "Failed to fetch booking statistics.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Fix the getMonthlyBookingTrends function as well
async function getMonthlyBookingTrends(userId?: string) {
  try {
    const currentYear = new Date().getFullYear();

    // Build the SQL query with optional user filter
    let query = `
        SELECT 
          EXTRACT(MONTH FROM date_booked_request) AS month,
          COUNT(*) AS booking_count,
          SUM(CAST(selling_price AS DECIMAL(10,2))) AS revenue
        FROM pt_xpresstravel
      `;

    // Add WHERE clause
    if (userId) {
      const parsedUserId = Number.parseInt(userId, 10);
      if (!isNaN(parsedUserId)) {
        query += ` WHERE EXTRACT(YEAR FROM date_booked_request) = ${currentYear} AND uid = ${parsedUserId}`;
      } else {
        query += ` WHERE EXTRACT(YEAR FROM date_booked_request) = ${currentYear}`;
      }
    } else {
      query += ` WHERE EXTRACT(YEAR FROM date_booked_request) = ${currentYear}`;
    }

    // Add GROUP BY and ORDER BY
    query += `
        GROUP BY EXTRACT(MONTH FROM date_booked_request)
        ORDER BY month
      `;

    // Execute the query
    const monthlyStats: any = await prisma.$queryRawUnsafe(query);

    // Format the results
    const formattedStats = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyStats.find(
        (item: any) => Number(item.month) === i + 1
      );
      return {
        month: i + 1,
        monthName: new Date(currentYear, i, 1).toLocaleString("default", {
          month: "short",
        }),
        bookingCount: Number(monthData?.booking_count || 0),
        revenue: monthData?.revenue?.toString() || "0",
      };
    });

    return {
      success: true,
      data: formattedStats,
    };
  } catch (error) {
    console.error("Error fetching monthly booking trends:", error);
    return {
      success: false,
      message: "Failed to fetch monthly booking trends.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
