import { NextResponse } from "next/server"
import { getAllTravel } from "@/actions/booking"

export async function GET() {
  const result = await getAllTravel()

  if (result.success) {
    const processedData = result.data ? result.data.map((item) => ({
      ...item,
      baggage_kilogram: item.baggage_kilogram ? Number(item.baggage_kilogram) : null,
      // Convert any other Decimal fields here
    })) : null;
    return NextResponse.json({ success: true, data: processedData })
  } else {
    return NextResponse.json(
      { success: false, error: result.error || "An error occurred while fetching data" },
      { status: 500 },
    )
  }
}

