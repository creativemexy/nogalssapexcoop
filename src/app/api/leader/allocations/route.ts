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

    if (!['LEADER', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Leader or Super Admin role required.' }, { status: 403 });
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

    // Get all successful registration fee transactions from members of this leader's cooperative
    const registrationFees = await prisma.transaction.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        status: 'SUCCESSFUL',
        reference: { startsWith: 'REG_' },
        amount: { gt: 0 },
        user: { cooperativeId } // Only transactions from members of this leader's cooperative
      },
    });

    const totalRegistrationFees = Number(registrationFees._sum.amount || 0) / 100; // Convert from kobo to naira
    const totalTransactions = registrationFees._count.id || 0;
    
    // Get allocation percentages from system settings
    const allocationSettings = await prisma.systemSettings.findMany({
      where: {
        category: 'allocation',
        isActive: true
      }
    });

    // Default allocation percentages
    const defaultAllocations = {
      cooperativeShare: 20,
      leaderShare: 15,
      parentOrganizationShare: 5
    };

    // Parse current settings or use defaults
    const allocations = { ...defaultAllocations };
    allocationSettings.forEach(setting => {
      const value = parseFloat(setting.value);
      if (!isNaN(value)) {
        allocations[setting.key as keyof typeof allocations] = value;
      }
    });
    
    // Calculate Leader's allocation based on settings
    const leaderAllocation = totalRegistrationFees * (allocations.leaderShare / 100);
    
    // Get recent transactions from cooperative members
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESSFUL',
        reference: { startsWith: 'REG_' },
        amount: { gt: 0 },
        user: { cooperativeId }
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
          user: { cooperativeId },
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });
      
      const monthTotal = Number(monthFees._sum.amount || 0) / 100; // Convert from kobo to naira
      const monthLeaderAllocation = monthTotal * (allocations.leaderShare / 100);
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalFees: monthTotal,
        leaderAllocation: monthLeaderAllocation,
        transactionCount: 0, // Could be calculated if needed
      });
    }

    return NextResponse.json({
      // Main metrics
      totalRegistrationFees,
      totalTransactions,
      leaderAllocation, // Dynamic percentage of registration fees from their cooperative members
      allocationPercentage: allocations.leaderShare,
      
      // Recent activity
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        amount: Number(tx.amount) / 100, // Convert from kobo to naira
        payer: `${tx.user.firstName} ${tx.user.lastName}`,
        email: tx.user.email,
        reference: tx.reference,
        createdAt: tx.createdAt,
        description: tx.description,
        leaderAllocation: (Number(tx.amount) / 100) * (allocations.leaderShare / 100), // Dynamic percentage of this transaction
      })),
      
      // Monthly breakdown
      monthlyBreakdown: monthlyData,
      
      // Summary stats
      averageTransactionValue: totalTransactions > 0 ? totalRegistrationFees / totalTransactions : 0,
      averageLeaderAllocation: totalTransactions > 0 ? leaderAllocation / totalTransactions : 0,
    });
  } catch (error) {
    console.error('Leader allocations error:', error);
    return NextResponse.json({ error: 'Failed to fetch leader allocations' }, { status: 500 });
  }
}
