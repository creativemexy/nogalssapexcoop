import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Try getToken first (more reliable in API routes)
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // Fallback to getServerSession
    let session: any = null;
    let userRole: string | null = null;
    let userId: string | null = null;
    
    if (token && token.id && token.role) {
      session = {
        user: {
          id: token.id as string,
          email: token.email as string,
          role: token.role as string,
        },
      };
      userRole = token.role as string;
      userId = token.id as string;
    } else {
      const serverSession = await getServerSession(authOptions);
      if (serverSession?.user) {
        session = serverSession;
        userRole = (serverSession.user as any).role;
        userId = (serverSession.user as any).id;
      }
    }
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a parent organization, APEX, or SUPER_ADMIN
    if (userRole !== 'PARENT_ORGANIZATION' && userRole !== 'APEX' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied. Parent organization, APEX, or SUPER_ADMIN role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const cooperativeId = searchParams.get('cooperativeId') || '';
    const status = searchParams.get('status') || '';
    const verificationStatus = searchParams.get('verificationStatus') || '';
    const parentOrganizationId = searchParams.get('parentOrganizationId') || '';

    let parentOrganization;

    // For PARENT_ORGANIZATION users, get their own organization
    if (userRole === 'PARENT_ORGANIZATION') {
      parentOrganization = await prisma.parentOrganization.findFirst({
        where: { userId: userId }
      });

      if (!parentOrganization) {
        return NextResponse.json({ error: 'Parent organization not found' }, { status: 404 });
      }
    } 
    // For APEX or SUPER_ADMIN, allow viewing any parent organization's members
    else if (userRole === 'APEX' || userRole === 'SUPER_ADMIN') {
      if (parentOrganizationId) {
        // View specific parent organization's members
        parentOrganization = await prisma.parentOrganization.findUnique({
          where: { id: parentOrganizationId }
        });

        if (!parentOrganization) {
          return NextResponse.json({ error: 'Parent organization not found' }, { status: 404 });
        }
      } else {
        // If no parentOrganizationId specified, return error for APEX/SUPER_ADMIN
        return NextResponse.json({ error: 'parentOrganizationId parameter is required for APEX and SUPER_ADMIN users' }, { status: 400 });
      }
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
