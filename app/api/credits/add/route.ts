// File: app/api/credits/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { topUpCredits } from "@/actions/credits"; // Import your server action

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract data from the request body
    const { userId, amount, paymentReference } = body;

    if (!userId || !amount) {
      return NextResponse.json(
        { success: false, message: "User ID and amount are required" },
        { status: 400 }
      );
    }

    // Additional validation to prevent type errors
    if (isNaN(Number(userId)) || isNaN(Number(amount))) {
      return NextResponse.json(
        { success: false, message: "User ID and amount must be valid numbers" },
        { status: 400 }
      );
    }

    // Format data for the topUpCredits function
    const topUpData = {
      userId: Number(userId),
      amount: Number(amount),
      paymentMethod: "Paymongo (2% fee)",
      transactionReference: paymentReference || undefined, // Ensure undefined if empty string
    };

    // Call the server action to process the top-up
    const result = await topUpCredits(topUpData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in API route:");
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(String(error));
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process top-up request",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
