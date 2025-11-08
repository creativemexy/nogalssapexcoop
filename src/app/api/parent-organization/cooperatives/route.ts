import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a parent organization
    if ((session.user as any).role !== 'PARENT_ORGANIZATION') {
      return NextResponse.json({ error: 'Access denied. Parent organization role required.' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';

    // Get the parent organization for this user
    const parentOrganization = await prisma.parentOrganization.findFirst({
      where: { userId: userId }
    });

    if (!parentOrganization) {
      return NextResponse.json({ error: 'Parent organization not found' }, { status: 404 });
    }

    // Build where clause
    const where: any = {
      parentOrganizationId: parentOrganization.id
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Get cooperatives with pagination
    const [cooperatives, totalCooperatives] = await prisma.$transaction([
      prisma.cooperative.findMany({
        where,
        include: {
          leader: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              members: true,
              contributions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take
      }),
      prisma.cooperative.count({ where })
    ]);

    const totalPages = Math.ceil(totalCooperatives / pageSize);

    return NextResponse.json({
      success: true,
      cooperatives,
      pagination: {
        page,
        pageSize,
        total: totalCooperatives,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching parent organization cooperatives:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
