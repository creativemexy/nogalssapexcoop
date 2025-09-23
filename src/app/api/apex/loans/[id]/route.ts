import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const VALID_LOAN_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'APEX') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const { status } = await req.json();

  if (!status) {
    return NextResponse.json({ error: 'Status is required' }, { status: 400 });
  }

  if (!VALID_LOAN_STATUSES.includes(status)) {
    return NextResponse.json({ 
      error: 'Invalid status. Must be one of: ' + VALID_LOAN_STATUSES.join(', ') 
    }, { status: 400 });
  }

  try {
    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: { 
        status,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
        approvedBy: status === 'APPROVED' ? session.user.id : undefined,
      },
    });
    return NextResponse.json({ loan: updatedLoan });
  } catch (error) {
    console.error('Error updating loan status:', error);
    return NextResponse.json({ error: 'Failed to update loan status' }, { status: 500 });
  }
} 