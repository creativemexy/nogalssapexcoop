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
    const cooperativeId = searchParams.get('cooperativeId') || '';
    const status = searchParams.get('status') || '';
    const verificationStatus = searchParams.get('verificationStatus') || '';

    // Get the parent organization for this user
    const parentOrganization = await prisma.parentOrganization.findFirst({
      where: { userId: userId }
    });

    if (!parentOrganization) {
      return NextResponse.json({ error: 'Parent organization not found' }, { status: 404 });
    }

    // Build where clause for filtering
    const where: any = {
      cooperative: {
        parentOrganizationId: parentOrganization.id
      }
    };

    // Add search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add cooperative filter
    if (cooperativeId) {
      where.cooperativeId = cooperativeId;
    }

    // Add status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Add verification status filter
    if (verificationStatus === 'verified') {
      where.isVerified = true;
    } else if (verificationStatus === 'unverified') {
      where.isVerified = false;
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Get members with pagination
    const [members, totalMembers] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          nin: true,
          address: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          cooperative: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(totalMembers / pageSize);

    return NextResponse.json({
      success: true,
      data: {
        members,
        totalMembers,
        currentPage: page,
        pageSize,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching parent organization members:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
