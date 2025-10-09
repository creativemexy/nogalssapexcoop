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

    // Check if user is super admin or apex
    if ((session.user as any).role !== 'SUPER_ADMIN' && (session.user as any).role !== 'APEX') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch dashboard statistics
    const [
      totalUsers,
      totalCooperatives,
      totalTransactions,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      totalContributionsResult,
      totalLoansResult,
      memberRegistrationFeesResult,
      cooperativeRegistrationFeesResult,
      withdrawalResult,
      memberFeeSetting,
      cooperativeFeeSetting,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.cooperative.count(),
      prisma.transaction.count(),
      prisma.loan.count({ where: { status: 'PENDING' } }),
      prisma.loan.count({ where: { status: 'APPROVED' } }),
      prisma.loan.count({ where: { status: 'REJECTED' } }),
      prisma.contribution.aggregate({
        _sum: { amount: true },
      }),
      prisma.loan.aggregate({
        _sum: { amount: true },
      }),
      // Member registration fees (transactions with reference starting with 'REG_MEMBER_')
      prisma.transaction.aggregate({
        where: { 
          reference: { startsWith: 'REG_MEMBER_' }
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Cooperative registration fees (transactions with reference starting with 'REG_COOP_')
      prisma.transaction.aggregate({
        where: { 
          reference: { startsWith: 'REG_COOP_' }
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.transaction.aggregate({
        where: { 
          type: 'WITHDRAWAL',
          status: 'SUCCESSFUL'
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Get current fee settings
      prisma.systemSettings.findFirst({
        where: { category: 'payment', key: 'member_registration_fee' }
      }),
      prisma.systemSettings.findFirst({
        where: { category: 'payment', key: 'cooperative_registration_fee' }
      }),
    ]);

    // Convert amounts from kobo to naira for display
    const totalContributions = Number(totalContributionsResult._sum.amount || 0) / 100;
    const totalLoans = Number(totalLoansResult._sum.amount || 0) / 100;
    const totalMemberRegistrationFees = Number(memberRegistrationFeesResult._sum.amount || 0) / 100;
    const totalMemberRegistrationTransactions = memberRegistrationFeesResult._count.id;
    const totalCooperativeRegistrationFees = Number(cooperativeRegistrationFeesResult._sum.amount || 0) / 100;
    const totalCooperativeRegistrationTransactions = cooperativeRegistrationFeesResult._count.id;
    const totalWithdrawals = Number(withdrawalResult._sum.amount || 0) / 100;
    const totalWithdrawalTransactions = withdrawalResult._count.id;

    // Get current fee amounts
    const currentMemberFee = memberFeeSetting ? parseInt(memberFeeSetting.value) : 500000; // ₦5,000.00
    const currentCooperativeFee = cooperativeFeeSetting ? parseInt(cooperativeFeeSetting.value) : 5000000; // ₦50,000.00

    return NextResponse.json({
      totalUsers,
      totalCooperatives,
      totalTransactions,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      totalContributions,
      totalLoans,
      // Member registration fees
      totalMemberRegistrationFees,
      totalMemberRegistrationTransactions,
      currentMemberFee: currentMemberFee / 100, // Convert to naira
      // Cooperative registration fees
      totalCooperativeRegistrationFees,
      totalCooperativeRegistrationTransactions,
      currentCooperativeFee: currentCooperativeFee / 100, // Convert to naira
      // Legacy fields for backward compatibility
      totalRegistrationFees: totalMemberRegistrationFees + totalCooperativeRegistrationFees,
      totalRegistrations: totalMemberRegistrationTransactions + totalCooperativeRegistrationTransactions,
      totalWithdrawals,
      totalWithdrawalTransactions,
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 