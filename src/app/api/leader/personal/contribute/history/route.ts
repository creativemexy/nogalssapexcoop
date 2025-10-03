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

    // Check for impersonation data in request headers
    const impersonationData = request.headers.get('x-impersonation-data');
    let targetUserId = (session.user as any).id;
    let userRole = (session.user as any).role;

    // If impersonation data is provided, use that instead of session data
    if (impersonationData) {
      try {
        const impersonatedUser = JSON.parse(impersonationData);
        targetUserId = impersonatedUser.id;
        userRole = impersonatedUser.role;
      } catch (error) {
        console.error('Error parsing impersonation data:', error);
      }
    }

    if (userRole !== 'LEADER') {
      return NextResponse.json({ error: 'Access denied. Leader role required.' }, { status: 403 });
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get total count
    const totalCount = await prisma.contribution.count({
      where: { userId: targetUserId }
    });

    // Get contributions with pagination
    const contributions = await prisma.contribution.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        amount: true,
        description: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Convert amounts from kobo to naira
    const formattedContributions = contributions.map(contribution => ({
      id: contribution.id,
      amount: Number(contribution.amount) / 100,
      description: contribution.description,
      createdAt: contribution.createdAt.toISOString()
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      contributions: formattedContributions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching leader contribution history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
