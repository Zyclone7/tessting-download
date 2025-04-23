// app/api/users/[id]/route.js
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    // Ensure `user_id` exists
    if (!params || !params.user_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'User ID is required.',
        },
        { status: 400 }
      );
    }

    // Parse `user_id` safely
    const userId = parseInt(params.user_id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid user ID.',
        },
        { status: 400 }
      );
    }

    // Fetch invitation codes for the user
    const invitationCodes = await prisma.pt_invitation_codes.findMany({
      where: { user_id: userId },
    });

    // Return success with empty array if no data found
    if (!invitationCodes || invitationCodes.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No invitation codes found for the given user ID.',
          data: [],
        },
        { status: 200 }
      );
    }

    // Return invitation codes
    return NextResponse.json(
      {
        success: true,
        data: invitationCodes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invitation codes:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong while fetching invitation codes.',
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
