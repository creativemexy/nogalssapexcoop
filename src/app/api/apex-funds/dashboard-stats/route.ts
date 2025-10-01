import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['APEX_FUNDS', 'SUPER_ADMIN'].includes((session.user as any).role)) {
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

    const totalRegistrationFees = Number(registrationFees._sum.amount || 0);
    const totalTransactions = registrationFees._count.id || 0;
    
    // Calculate Apex Fund's 40% allocation
    const apexFundAllocation = totalRegistrationFees * 0.4; // 40% of registration fees
    
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
      
      const monthTotal = Number(monthFees._sum.amount || 0);
      const monthApexAllocation = monthTotal * 0.4;
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalFees: monthTotal,
        apexAllocation: monthApexAllocation,
        transactionCount: 0, // Could be calculated if needed
      });
    }

    return NextResponse.json({
      // Main metrics
      totalRegistrationFees,
      totalTransactions,
      apexFundAllocation, // 40% of all registration fees
      allocationPercentage: 40,
      
      // Recent activity
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        amount: Number(tx.amount),
        payer: `${tx.user.firstName} ${tx.user.lastName}`,
        email: tx.user.email,
        reference: tx.reference,
        createdAt: tx.createdAt,
        description: tx.description,
        apexAllocation: Number(tx.amount) * 0.4, // 40% of this transaction
      })),
      
      // Monthly breakdown
      monthlyBreakdown: monthlyData,
      
      // Summary stats
      averageTransactionValue: totalTransactions > 0 ? totalRegistrationFees / totalTransactions : 0,
      averageApexAllocation: totalTransactions > 0 ? apexFundAllocation / totalTransactions : 0,
    });
  } catch (error) {
    console.error('Apex-Funds dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
