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

    // Get the leader's cooperative ID
    const leader = await prisma.leader.findUnique({
      where: { userId: targetUserId },
      select: { cooperativeId: true }
    });

    if (!leader?.cooperativeId) {
      return NextResponse.json({ error: 'No cooperative associated with leader' }, { status: 400 });
    }

    const cooperativeId = leader.cooperativeId;

    // Fetch loans from members of this cooperative
    const loans = await prisma.loan.findMany({
      where: { 
        cooperativeId
      },
      select: {
        id: true,
        amount: true,
        purpose: true,
        status: true,
        createdAt: true,
        endDate: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats
    const totalLoans = loans.length;
    const totalAmount = loans.reduce((sum, loan) => sum + Number(loan.amount), 0);
    const pendingLoans = loans.filter(loan => loan.status === 'PENDING').length;
    const approvedLoans = loans.filter(loan => loan.status === 'APPROVED').length;
    const rejectedLoans = loans.filter(loan => loan.status === 'REJECTED').length;
    
    // Format loan data
    const formattedLoans = loans.map(loan => ({
      id: loan.id,
      amount: Number(loan.amount),
      purpose: loan.purpose,
      status: loan.status,
      createdAt: loan.createdAt.toISOString(),
      endDate: loan.endDate?.toISOString(),
      member: {
        id: loan.user.id,
        firstName: loan.user.firstName,
        lastName: loan.user.lastName,
        email: loan.user.email
      }
    }));

    return NextResponse.json({
      loans: formattedLoans,
      stats: {
        totalLoans,
        totalAmount,
        pendingLoans,
        approvedLoans,
        rejectedLoans
      }
    });

  } catch (error) {
    console.error('Error fetching leader loans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


