import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const loanId = params.id;

    // Check if loan exists and belongs to leader's cooperative
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      select: {
        id: true,
        status: true,
        cooperativeId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    // Verify the loan belongs to the leader's cooperative
    const leader = await prisma.leader.findUnique({
      where: { userId: targetUserId },
      select: { cooperativeId: true }
    });

    if (!leader || loan.cooperativeId !== leader.cooperativeId) {
      return NextResponse.json({ error: 'Access denied. Loan does not belong to your cooperative.' }, { status: 403 });
    }

    if (loan.status !== 'PENDING') {
      return NextResponse.json({ error: 'Loan is not in pending status' }, { status: 400 });
    }

    // Update loan status to rejected
    await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'REJECTED',
        approvedAt: new Date(),
        approvedBy: targetUserId
      }
    });

    return NextResponse.json({
      success: true,
      message: `Loan for ${loan.user.firstName} ${loan.user.lastName} has been rejected`
    });

  } catch (error) {
    console.error('Error rejecting loan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


