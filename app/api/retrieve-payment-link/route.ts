import axios from "axios";
import { NextResponse } from "next/server";

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY as string;

export async function GET(request: Request) {
  try {
    // Extract `id` from request URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Security Check 1: Ensure ID is present and valid
    if (!id || typeof id !== "string" || id.length < 10) {
      return NextResponse.json({ error: "Invalid payment link ID" }, { status: 400 });
    }

    // Request options
    const response = await axios.get(`https://api.paymongo.com/v1/links/${id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (err: any) {
    console.error("Error retrieving payment link:", err.response?.data || err.message);
    return NextResponse.json({ error: "Failed to retrieve payment link" }, { status: 500 });
  }
}
