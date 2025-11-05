import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'MEMBER') {
      return NextResponse.json({ error: 'Access denied. Member role required.' }, { status: 403 });
    }

    // Fetch the member's loans
    const loans = await prisma.loan.findMany({
      where: { 
        userId,
        isActive: true
      },
      select: {
        id: true,
        amount: true,
        purpose: true,
        interestRate: true,
        duration: true,
        status: true,
        approvedBy: true,
        approvedAt: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        cooperative: {
          select: {
            id: true,
            name: true,
            registrationNumber: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate loan details (payments may be tracked separately via transactions)
    const loansWithPayments = loans.map((loan) => {
      const loanAmount = Number(loan.amount) / 100; // Convert from kobo to naira
      const interestAmount = loanAmount * (Number(loan.interestRate) / 100);
      const totalAmount = loanAmount + interestAmount;
      
      // For now, if loan is REPAID, assume fully paid, otherwise show outstanding
      // This can be enhanced later when payment tracking is implemented
      const isRepaid = loan.status === 'REPAID';
      const totalPaid = isRepaid ? totalAmount : 0;
      const remainingAmount = isRepaid ? 0 : totalAmount;

      return {
        id: loan.id,
        amount: loanAmount,
        purpose: loan.purpose,
        interestRate: Number(loan.interestRate),
        duration: loan.duration,
        status: loan.status,
        approvedBy: loan.approvedBy,
        approvedAt: loan.approvedAt?.toISOString(),
        startDate: loan.startDate?.toISOString(),
        endDate: loan.endDate?.toISOString(),
        createdAt: loan.createdAt.toISOString(),
        cooperative: loan.cooperative,
        payments: {
          totalPaid,
          remainingAmount,
          totalAmount,
          paymentCount: isRepaid ? 1 : 0
        }
      };
    });

    // Calculate stats
    const totalLoans = loansWithPayments.length;
    const totalAmount = loansWithPayments.reduce((sum, loan) => sum + loan.payments.totalAmount, 0);
    const totalPaid = loansWithPayments.reduce((sum, loan) => sum + loan.payments.totalPaid, 0);
    const totalOutstanding = loansWithPayments.reduce((sum, loan) => sum + loan.payments.remainingAmount, 0);
    const pendingLoans = loansWithPayments.filter(loan => loan.status === 'PENDING').length;
    const approvedLoans = loansWithPayments.filter(loan => loan.status === 'APPROVED').length;
    const rejectedLoans = loansWithPayments.filter(loan => loan.status === 'REJECTED').length;
    const repaidLoans = loansWithPayments.filter(loan => loan.status === 'REPAID').length;

    return NextResponse.json({
      loans: loansWithPayments,
      stats: {
        totalLoans,
        totalAmount,
        totalPaid,
        totalOutstanding,
        pendingLoans,
        approvedLoans,
        rejectedLoans,
        repaidLoans
      }
    });

  } catch (error) {
    console.error('Error fetching member loans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

