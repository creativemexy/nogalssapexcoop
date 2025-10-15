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
      totalParentOrganizations,
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
      prisma.parentOrganization.count(),
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
      // Member registration fees (transactions with type 'FEE' and description containing 'Member registration')
      prisma.transaction.aggregate({
        where: { 
          type: 'FEE',
          description: { contains: 'Member registration' },
          status: 'SUCCESSFUL'
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Cooperative registration fees (transactions with type 'FEE' and description containing 'Cooperative registration')
      prisma.transaction.aggregate({
        where: { 
          type: 'FEE',
          description: { contains: 'Cooperative registration' },
          status: 'SUCCESSFUL'
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
    const totalMemberRegistrationTransactions = memberRegistrationFeesResult._count.id || 0;
    const totalCooperativeRegistrationFees = Number(cooperativeRegistrationFeesResult._sum.amount || 0) / 100;
    const totalCooperativeRegistrationTransactions = cooperativeRegistrationFeesResult._count.id || 0;
    const totalWithdrawals = Number(withdrawalResult._sum.amount || 0) / 100;
    const totalWithdrawalTransactions = withdrawalResult._count.id || 0;

    // Get current fee amounts
    const currentMemberFee = memberFeeSetting ? parseInt(memberFeeSetting.value) : 500000; // ₦5,000.00
    const currentCooperativeFee = cooperativeFeeSetting ? parseInt(cooperativeFeeSetting.value) : 5000000; // ₦50,000.00

    // Get allocation percentages from system settings
    const allocationSettings = await prisma.systemSettings.findMany({
      where: {
        category: 'allocation',
        isActive: true
      }
    });

    // Default allocation percentages
    const defaultAllocations = {
      apexFunds: 40,
      nogalssFunds: 20,
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

    // Calculate total registration fees
    const totalRegistrationFees = totalMemberRegistrationFees + totalCooperativeRegistrationFees;
    const totalRegistrations = totalMemberRegistrationTransactions + totalCooperativeRegistrationTransactions;

    // Calculate parent organization allocation
    const parentOrganizationAllocation = totalRegistrationFees * (allocations.parentOrganizationShare / 100);

    // Debug logging
    console.log('Registration fees debug:', {
      memberFees: totalMemberRegistrationFees,
      memberCount: totalMemberRegistrationTransactions,
      cooperativeFees: totalCooperativeRegistrationFees,
      cooperativeCount: totalCooperativeRegistrationTransactions,
    });

    // If no registration fees found with description matching, try a broader search
    if (totalMemberRegistrationTransactions === 0 && totalCooperativeRegistrationTransactions === 0) {
      console.log('No registration fees found with description matching, trying broader search...');
      
      // Get all FEE transactions to see what we have
      const allFeeTransactions = await prisma.transaction.findMany({
        where: { 
          type: 'FEE',
          status: 'SUCCESSFUL'
        },
        select: {
          id: true,
          amount: true,
          description: true,
          reference: true,
          createdAt: true,
        },
        take: 10,
      });
      
      console.log('All FEE transactions found:', allFeeTransactions);
    }

    return NextResponse.json({
      totalUsers,
      totalCooperatives,
      totalParentOrganizations,
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
      totalRegistrationFees,
      totalRegistrations,
      // Parent organization allocation
      parentOrganizationAllocation,
      parentOrganizationPercentage: allocations.parentOrganizationShare,
      totalWithdrawals,
      totalWithdrawalTransactions,
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 