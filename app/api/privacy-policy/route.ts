import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-singleton";

export async function GET() {
  try {
    const policies = await prisma.pt_policy_section.findMany({
      orderBy: {
        display_order: "asc",
      },
    });

    return NextResponse.json({ policies });
  } catch (error) {
    console.error("Error fetching privacy policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch privacy policies" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, accepted } = await request.json();

    if (!userId || !accepted) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Record user acceptance
    await prisma.pt_user_acceptance.create({
      data: {
        user_id: userId,
        accepted_at: new Date(),
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording acceptance:", error);
    return NextResponse.json(
      { error: "Failed to record acceptance" },
      { status: 500 }
    );
  }
}
