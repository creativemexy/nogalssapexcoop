import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isWithdrawalEnabled } from '@/lib/withdrawal-permissions';

export async function POST(request: NextRequest) {
  try {
    // Check if withdrawals are enabled for PARENT_ORGANIZATION role
    const withdrawalsEnabled = await isWithdrawalEnabled('PARENT_ORGANIZATION');
    if (!withdrawalsEnabled) {
      return NextResponse.json({ 
        error: 'Withdrawals are currently disabled for parent organizations',
        code: 'WITHDRAWAL_DISABLED'
      }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'PARENT_ORGANIZATION') {
      return NextResponse.json({ error: 'Access denied. Parent organization role required.' }, { status: 403 });
    }

    // Get parent organization
    const parentOrganization = await prisma.parentOrganization.findFirst({
      where: { userId }
    });

    if (!parentOrganization) {
      return NextResponse.json({ error: 'Parent organization not found' }, { status: 400 });
    }

    const parentOrganizationId = parentOrganization.id;
    const { amount, reason } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Calculate parent organization's allocation balance from registration fees
    const registrationFees = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESSFUL',
        reference: { startsWith: 'REG_' },
        amount: { gt: 0 },
        user: {
          cooperative: {
            parentOrganizationId: parentOrganizationId
          }
        }
      }
    });

    // Get allocation percentage from system settings
    const allocationSettings = await prisma.systemSettings.findMany({
      where: {
        category: 'allocation',
        isActive: true
      }
    });

    const defaultAllocations = { parentOrganizationShare: 5 };
    const allocations = { ...defaultAllocations };
    allocationSettings.forEach(setting => {
      const value = parseFloat(setting.value);
      if (!isNaN(value) && setting.key === 'parentOrganizationShare') {
        allocations.parentOrganizationShare = value;
      }
    });

    const totalRegistrationFees = Number(registrationFees._sum.amount || 0) / 100; // Convert from kobo to naira
    
    // Get super admin wallet allocation amounts
    const [memberAllocSetting, coopAllocSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'SUPER_ADMIN_ALLOCATION_MEMBER_AMOUNT' } }),
      prisma.setting.findUnique({ where: { key: 'SUPER_ADMIN_ALLOCATION_COOP_AMOUNT' } })
    ]);
    const memberAllocationAmount = parseFloat(memberAllocSetting?.value || '0');
    const coopAllocationAmount = parseFloat(coopAllocSetting?.value || '0');
    
    // Count member and cooperative registrations for cooperatives under this parent organization
    const [memberRegCount, coopRegCount] = await Promise.all([
      prisma.transaction.count({
        where: {
          user: {
            cooperative: { parentOrganizationId: parentOrganizationId }
          },
          reference: { startsWith: 'REG_' },
          status: 'SUCCESSFUL',
          description: { contains: 'Member registration' }
        }
      }),
      prisma.transaction.count({
        where: {
          user: {
            cooperative: { parentOrganizationId: parentOrganizationId }
          },
          reference: { startsWith: 'REG_' },
          status: 'SUCCESSFUL',
          description: { contains: 'Cooperative registration' }
        }
      })
    ]);
    
    // Calculate total super admin wallet allocation
    const totalSuperAdminAllocation = (memberRegCount * memberAllocationAmount) + (coopRegCount * coopAllocationAmount);
    
    // Calculate remaining amount after super admin wallet allocation
    const remainingAmount = Math.max(0, totalRegistrationFees - totalSuperAdminAllocation);
    
    const allocationPercentage = allocations.parentOrganizationShare || 5;
    const availableBalance = remainingAmount * (allocationPercentage / 100);

    // Check for pending withdrawals that haven't been processed
    // Get all users under this parent organization's cooperatives
    const cooperativeUsers = await prisma.user.findMany({
      where: {
        cooperative: {
          parentOrganizationId: parentOrganizationId
        }
      },
      select: { id: true }
    });

    const userIds = cooperativeUsers.map(u => u.id);
    
    // For parent organization, we'll track withdrawals by the parent organization user
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        userId: userId, // Parent organization user's ID
        status: 'PENDING'
      },
      select: {
        amount: true
      }
    });

    const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount) / 100, 0);
    const availableBalanceAfterPending = availableBalance - pendingAmount;

    if (amount > availableBalanceAfterPending) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        message: `Available balance: ₦${availableBalanceAfterPending.toLocaleString()}`,
        totalAllocation: availableBalance,
        pendingWithdrawals: pendingAmount
      }, { status: 400 });
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: userId, // Parent organization user's ID
        amount: Math.round(amount * 100), // Convert to kobo
        reason: reason.trim(),
        status: 'PENDING',
        requestedAt: new Date()
      }
    });

    console.log('✅ Parent organization withdrawal request created:', withdrawal.id);

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawalId: withdrawal.id,
      availableBalance: availableBalanceAfterPending
    });

  } catch (error) {
    console.error('Error creating parent organization withdrawal request:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to submit withdrawal request'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'PARENT_ORGANIZATION') {
      return NextResponse.json({ error: 'Access denied. Parent organization role required.' }, { status: 403 });
    }

    // Get parent organization
    const parentOrganization = await prisma.parentOrganization.findFirst({
      where: { userId }
    });

    if (!parentOrganization) {
      return NextResponse.json({ error: 'Parent organization not found' }, { status: 400 });
    }

    const parentOrganizationId = parentOrganization.id;

    // Calculate available allocation balance
    const registrationFees = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESSFUL',
        reference: { startsWith: 'REG_' },
        amount: { gt: 0 },
        user: {
          cooperative: {
            parentOrganizationId: parentOrganizationId
          }
        }
      }
    });

    // Get allocation percentage
    const allocationSettings = await prisma.systemSettings.findMany({
      where: {
        category: 'allocation',
        isActive: true
      }
    });

    const defaultAllocations = { parentOrganizationShare: 5 };
    const allocations = { ...defaultAllocations };
    allocationSettings.forEach(setting => {
      const value = parseFloat(setting.value);
      if (!isNaN(value) && setting.key === 'parentOrganizationShare') {
        allocations.parentOrganizationShare = value;
      }
    });

    const totalRegistrationFees = Number(registrationFees._sum.amount || 0) / 100;
    
    // Get super admin wallet allocation amounts
    const [memberAllocSetting, coopAllocSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'SUPER_ADMIN_ALLOCATION_MEMBER_AMOUNT' } }),
      prisma.setting.findUnique({ where: { key: 'SUPER_ADMIN_ALLOCATION_COOP_AMOUNT' } })
    ]);
    const memberAllocationAmount = parseFloat(memberAllocSetting?.value || '0');
    const coopAllocationAmount = parseFloat(coopAllocSetting?.value || '0');
    
    // Count member and cooperative registrations for cooperatives under this parent organization
    const [memberRegCount, coopRegCount] = await Promise.all([
      prisma.transaction.count({
        where: {
          user: {
            cooperative: { parentOrganizationId: parentOrganizationId }
          },
          reference: { startsWith: 'REG_' },
          status: 'SUCCESSFUL',
          description: { contains: 'Member registration' }
        }
      }),
      prisma.transaction.count({
        where: {
          user: {
            cooperative: { parentOrganizationId: parentOrganizationId }
          },
          reference: { startsWith: 'REG_' },
          status: 'SUCCESSFUL',
          description: { contains: 'Cooperative registration' }
        }
      })
    ]);
    
    // Calculate total super admin wallet allocation
    const totalSuperAdminAllocation = (memberRegCount * memberAllocationAmount) + (coopRegCount * coopAllocationAmount);
    
    // Calculate remaining amount after super admin wallet allocation
    const remainingAmount = Math.max(0, totalRegistrationFees - totalSuperAdminAllocation);
    
    const allocationPercentage = allocations.parentOrganizationShare || 5;
    const totalAllocation = remainingAmount * (allocationPercentage / 100);

    // Get pending withdrawals
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        userId: userId, // Parent organization user's ID
        status: 'PENDING'
      },
      select: {
        amount: true
      }
    });

    const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount) / 100, 0);
    const availableBalance = totalAllocation - pendingAmount;

    // Get withdrawal history
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: userId },
      orderBy: { requestedAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      availableBalance: Math.max(0, availableBalance),
      totalAllocation,
      pendingAmount,
      allocationPercentage,
      withdrawals: withdrawals.map(w => ({
        id: w.id,
        amount: Number(w.amount) / 100,
        reason: w.reason,
        status: w.status,
        requestedAt: w.requestedAt.toISOString(),
        processedAt: w.processedAt?.toISOString(),
        notes: w.notes
      }))
    });

  } catch (error) {
    console.error('Error fetching parent organization withdrawal balance:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

