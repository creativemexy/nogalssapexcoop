import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateRequest } from '@/lib/mobile-auth';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Try mobile auth first (JWT), fallback to NextAuth session
    let userId: string | undefined;
    
    const mobileUser = await authenticateRequest(request);
    if (mobileUser) {
      userId = mobileUser.id;
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = (session.user as any).id;
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with their cooperative information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        cooperative: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.cooperativeId || !user.cooperative) {
      return NextResponse.json({
        cooperative: null,
        message: 'You are not associated with any cooperative'
      });
    }

    return NextResponse.json({
      cooperative: {
        id: user.cooperative.id,
        name: user.cooperative.name,
        registrationNumber: user.cooperative.registrationNumber,
        address: user.cooperative.address,
        city: user.cooperative.city
      },
      memberAmount: 1000 // Default amount - you can adjust this or get from user profile
    });

  } catch (error) {
    console.error('Error fetching user cooperative:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
