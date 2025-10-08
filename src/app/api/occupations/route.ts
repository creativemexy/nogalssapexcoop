import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;

    let whereClause: any = {
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

    const [occupations, totalCount] = await Promise.all([
      prisma.occupation.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'asc'
        },
        ...(limit && { take: limit })
      }),
      prisma.occupation.count({
        where: whereClause
      })
    ]);

    return NextResponse.json({
      occupations,
      total: totalCount,
      returned: occupations.length,
      hasMore: occupations.length < totalCount
    });

  } catch (error) {
    console.error('Error fetching occupations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch occupations' },
      { status: 500 }
    );
  }
}
