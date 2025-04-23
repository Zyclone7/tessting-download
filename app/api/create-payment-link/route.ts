import { NextResponse } from "next/server";
import axios from "axios";

//use this instead
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

//this
const PAYMONGO_API_URL = "https://api.paymongo.com/v1/links";

// Temporary in-memory storage (Map object)
const TEMP_STORAGE = new Map(); // Stores user data temporarily using a Map

// Store user data temporarily for 30 minutes
function storeTemporaryUserData(userId: any, userData: any) {
  const expirationTime = 30 * 60 * 1000; // 30 minutes in milliseconds
  TEMP_STORAGE.set(userId, userData);

  // Automatically delete the data after 30 minutes
  setTimeout(() => {
    TEMP_STORAGE.delete(userId);
  }, expirationTime);
}

export async function POST(request: Request) {
  const { amount, description, name, email, userData, userId } =
    await request.json();

  try {
    storeTemporaryUserData(userData, { name, email, amount, description });

    const response = await axios.post(
      PAYMONGO_API_URL,
      {
        data: {
          attributes: {
            amount: amount,
            description: description,
            currency: "PHP",
            checkout: {
              billing: {
                name: name,
                email: email,
              },
              success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/success`,
              failure_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/failed`,
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            PAYMONGO_SECRET_KEY + ":"
          ).toString("base64")}`,
        },
      }
    );

    const checkoutUrl = response.data.data.attributes.checkout_url;
    const id = response.data;

    return NextResponse.json({ checkoutUrl, id });
  } catch (err) {
    console.error("Error creating payment link:", err);
    return NextResponse.json(
      { error: "Failed to create payment link" },
      { status: 500 }
    );
  }
}
