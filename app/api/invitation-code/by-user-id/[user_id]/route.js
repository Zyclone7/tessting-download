import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const userId = await params.user_id;

  if (!params.user_id || isNaN(parseInt(params.user_id, 10))) {
    return NextResponse.json(
      {
        success: false,
        message: 'Invalid or missing user_id.',
      },
      { status: 400 }
    );
  }

  try {
    const invitationCodes = await prisma.pt_invitation_codes.findMany({
      where: { user_id: parseInt(userId, 10) },
    });

    return NextResponse.json(
      {
        success: true,
        data: invitationCodes || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invitation codes:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch invitation codes.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
