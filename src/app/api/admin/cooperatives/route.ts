import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { registrationNumber: { contains: search, mode: 'insensitive' as const } },
        { city: { contains: search, mode: 'insensitive' as const } },
        { state: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [cooperatives, total] = await Promise.all([
      prisma.cooperative.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              members: true,
              leader: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.cooperative.count({ where: whereClause })
    ]);

    const formattedCooperatives = cooperatives.map(coop => ({
      id: coop.id,
      name: coop.name,
      registrationNumber: coop.registrationNumber,
      city: coop.city,
      state: coop.state,
      status: coop.isActive ? 'Active' : 'Inactive',
      createdAt: coop.createdAt,
      memberCount: coop._count.members,
      leaderCount: coop._count.leader,
      email: coop.email,
      phoneNumber: coop.phoneNumber,
      address: coop.address,
      bankName: coop.bankName,
      bankAccountNumber: coop.bankAccountNumber
    }));

    return NextResponse.json({
      cooperatives: formattedCooperatives,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching cooperatives:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
