import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['NOGALSS_FUNDS', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all successful registration fee transactions
    const registrationFees = await prisma.transaction.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        status: 'SUCCESSFUL',
        reference: { startsWith: 'REG_' },
        amount: { gt: 0 },
      },
    });

    // Convert amounts from kobo to naira for display
    const totalRegistrationFees = Number(registrationFees._sum.amount || 0) / 100;
    const totalTransactions = registrationFees._count.id || 0;
    
    // Calculate Nogalss Fund's 20% allocation
    const nogalssFundAllocation = totalRegistrationFees * 0.2; // 20% of registration fees
    
    // Get recent transactions for the fund
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESSFUL',
        reference: { startsWith: 'REG_' },
        amount: { gt: 0 },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        reference: true,
        createdAt: true,
        description: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Calculate monthly breakdown for the last 12 months
    const monthlyData = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const monthFees = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESSFUL',
          reference: { startsWith: 'REG_' },
          amount: { gt: 0 },
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });
      
      // Convert monthly amounts from kobo to naira
      const monthTotal = Number(monthFees._sum.amount || 0) / 100;
      const monthNogalssAllocation = monthTotal * 0.2;
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalFees: monthTotal,
        nogalssAllocation: monthNogalssAllocation,
        transactionCount: 0, // Could be calculated if needed
      });
    }

    return NextResponse.json({
      // Main metrics
      totalRegistrationFees,
      totalTransactions,
      nogalssFundAllocation, // 20% of all registration fees
      allocationPercentage: 20,
      
      // Recent activity
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        amount: Number(tx.amount) / 100, // Convert from kobo to naira
        payer: `${tx.user.firstName} ${tx.user.lastName}`,
        email: tx.user.email,
        reference: tx.reference,
        createdAt: tx.createdAt,
        description: tx.description,
        nogalssAllocation: (Number(tx.amount) / 100) * 0.2, // 20% of this transaction (in naira)
      })),
      
      // Monthly breakdown
      monthlyBreakdown: monthlyData,
      
      // Summary stats
      averageTransactionValue: totalTransactions > 0 ? totalRegistrationFees / totalTransactions : 0,
      averageNogalssAllocation: totalTransactions > 0 ? nogalssFundAllocation / totalTransactions : 0,
    });
  } catch (error) {
    console.error('Nogalss-Funds dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}







