import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emitDashboardUpdate } from '@/lib/notifications';

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
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }},
        { cooperative: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Get total count
    const totalCount = await prisma.transaction.count({ where: whereClause });

    // Get transactions with pagination
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        cooperative: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    });

    // Format the data
    const rows = transactions.map(tx => ({
      id: tx.id,
      createdAt: tx.createdAt.toISOString(),
      user: `${tx.user.firstName} ${tx.user.lastName}`,
      email: tx.user.email,
      cooperative: tx.cooperative?.name || 'N/A',
      type: tx.type,
      amount: Number(tx.amount) / 100, // Convert from kobo to naira
      status: tx.status,
      reference: tx.reference,
      description: tx.description
    }));

    const pages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      rows,
      pagination: {
        page,
        pages,
        count: totalCount,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // TODO: Add your transaction creation logic here
    // After successful creation:
    emitDashboardUpdate();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // TODO: Add your transaction update logic here
    // After successful update:
    emitDashboardUpdate();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // TODO: Add your transaction deletion logic here
    // After successful deletion:
    emitDashboardUpdate();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
