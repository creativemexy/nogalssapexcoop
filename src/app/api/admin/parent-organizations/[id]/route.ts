import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch a single parent organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try getToken first (more reliable in API routes)
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // Fallback to getServerSession
    let session: any = null;
    let userRole: string | null = null;
    
    if (token && token.id && token.role) {
      session = {
        user: {
          id: token.id as string,
          email: token.email as string,
          role: token.role as string,
        },
      };
      userRole = token.role as string;
    } else {
      const serverSession = await getServerSession(authOptions);
      if (serverSession?.user) {
        session = serverSession;
        userRole = (serverSession.user as any).role;
      }
    }
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Please sign in to access this resource'
      }, { status: 401 });
    }

    // Check if user is super admin or apex
    if (!userRole || (userRole !== 'SUPER_ADMIN' && userRole !== 'APEX')) {
      return NextResponse.json({ 
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      }, { status: 403 });
    }

    const organizationId = params.id;

    const organization = await prisma.parentOrganization.findUnique({
      where: { id: organizationId },
      include: {
        parent: true,
        children: true,
        cooperatives: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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
      return NextResponse.json({ 
        error: 'Organization not found' 
      }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error: any) {
    console.error('Error fetching parent organization:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
