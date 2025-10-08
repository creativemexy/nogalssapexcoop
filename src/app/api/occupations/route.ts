import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause = {
      isActive: true
    };

    // Add search filter if provided
    if (search) {
      whereClause = {
        ...whereClause,
        name: {
          contains: search,
          mode: 'insensitive'
        }
      };
    }

    const occupations = await prisma.occupation.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      },
      take: limit
    });

    return NextResponse.json({
      occupations,
      total: occupations.length
    });

  } catch (error) {
    console.error('Error fetching occupations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch occupations' },
      { status: 500 }
    );
  }
}
