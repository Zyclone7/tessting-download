import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || undefined;

  const skip = (page - 1) * limit;

  try {
    const where = search
      ? {
          OR: [
            { user_nicename: { contains: search, mode: 'insensitive' } },
            { user_email: { contains: search, mode: 'insensitive' } },
            { display_name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.pt_users.findMany({
        where,
        skip,
        take: limit,
        select: {
          ID: true,
          user_login: true,
          user_nicename: true,
          user_email: true,
          user_url: true,
          user_registered: true,
          user_status: true,
          display_name: true,
          user_role: true,
          user_level: true,
          user_upline_id: true,
          user_credits: true,
          user_referral_code: true,
          user_referred_by_id: true,
        },
      }),
      prisma.pt_users.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}