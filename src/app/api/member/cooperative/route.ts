import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, checkDatabaseConnection } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          cooperative: null,
          message: 'Database connection unavailable'
        });
      }
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

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
      }
    });

  } catch (error) {
    console.error('Error fetching user cooperative:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
