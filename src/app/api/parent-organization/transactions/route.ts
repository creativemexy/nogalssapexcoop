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
    const userRole = (session.user as any).role;
    if (userRole !== 'PARENT_ORGANIZATION') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get parent organization
    const organization = await prisma.parentOrganization.findUnique({
      where: { userId: (session.user as any).id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Parent organization not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const cooperativeId = searchParams.get('cooperativeId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Build where clause
    const where: any = {
      user: {
        cooperative: {
          parentOrganizationId: organization.id
        }
      }
    };

    // Add search filter
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Add status filter
    if (status) {
      where.status = status.toUpperCase();
    }

    // Add cooperative filter
    if (cooperativeId) {
      where.user.cooperativeId = cooperativeId;
    }

    // Add date filters
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    // Get total count
    const totalTransactions = await prisma.transaction.count({ where });

    // Get transactions with pagination
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            cooperative: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalTransactions / pageSize);

    return NextResponse.json({
      data: {
        transactions,
        totalTransactions,
        currentPage: page,
        pageSize,
        totalPages,
      },
    });

  } catch (error) {
    console.error('Error fetching parent organization transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
