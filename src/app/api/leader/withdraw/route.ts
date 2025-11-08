import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = (session.user as any).id;
    let userRole = (session.user as any).role;

    // Check for impersonation data
    const impersonationData = request.headers.get('x-impersonation-data');
    let targetUserId = userId;

    if (impersonationData) {
      try {
        const impersonatedUser = JSON.parse(impersonationData);
        targetUserId = impersonatedUser.id;
        userId = impersonatedUser.id;
        userRole = impersonatedUser.role;
      } catch (error) {
        console.error('Error parsing impersonation data:', error);
      }
    }

    // Only LEADER role users can withdraw
    if (userRole !== 'LEADER') {
      return NextResponse.json({ error: 'Access denied. Leader role required.' }, { status: 403 });
    }

    // Get leader's cooperative
    const leader = await prisma.leader.findUnique({
      where: { userId: targetUserId },
      select: { cooperativeId: true }
    });

    if (!leader?.cooperativeId) {
      return NextResponse.json({ error: 'No cooperative associated with leader' }, { status: 400 });
    }

    const cooperativeId = leader.cooperativeId;
    const { amount, reason } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Calculate leader's allocation balance from registration fees
    const registrationFees = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        user: { cooperativeId },
        reference: { startsWith: 'REG_' },
        status: 'SUCCESSFUL',
        amount: { gt: 0 }
      }
    });

    // Get allocation percentage from system settings
    const allocationSettings = await prisma.systemSettings.findMany({
      where: {
        category: 'allocation',
        isActive: true
      }
    });

    const defaultAllocations = { leaderShare: 15 };
    const allocations = { ...defaultAllocations };
    allocationSettings.forEach(setting => {
      const value = parseFloat(setting.value);
      if (!isNaN(value) && setting.key === 'leaderShare') {
        allocations.leaderShare = value;
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
    
    // Count member and cooperative registrations for this cooperative
    const [memberRegCount, coopRegCount] = await Promise.all([
      prisma.transaction.count({
        where: {
          user: { cooperativeId },
          reference: { startsWith: 'REG_' },
          status: 'SUCCESSFUL',
          description: { contains: 'Member registration' }
        }
      }),
      prisma.transaction.count({
        where: {
          user: { cooperativeId },
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
    
    const allocationPercentage = allocations.leaderShare || 15;
    const availableBalance = remainingAmount * (allocationPercentage / 100);

    // Check for pending withdrawals that haven't been processed
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        userId: targetUserId,
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
        userId: targetUserId,
        amount: Math.round(amount * 100), // Convert to kobo
        reason: reason.trim(),
        status: 'PENDING',
        requestedAt: new Date()
      }
    });

    console.log('✅ Leader withdrawal request created:', withdrawal.id);

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawalId: withdrawal.id,
      availableBalance: availableBalanceAfterPending
    });

  } catch (error) {
    console.error('Error creating leader withdrawal request:', error);
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

    let userId = (session.user as any).id;
    let userRole = (session.user as any).role;

    // Check for impersonation data
    const impersonationData = request.headers.get('x-impersonation-data');
    let targetUserId = userId;

    if (impersonationData) {
      try {
        const impersonatedUser = JSON.parse(impersonationData);
        targetUserId = impersonatedUser.id;
        userId = impersonatedUser.id;
        userRole = impersonatedUser.role;
      } catch (error) {
        console.error('Error parsing impersonation data:', error);
      }
    }

    if (userRole !== 'LEADER') {
      return NextResponse.json({ error: 'Access denied. Leader role required.' }, { status: 403 });
    }

    // Get leader's cooperative
    const leader = await prisma.leader.findUnique({
      where: { userId: targetUserId },
      select: { cooperativeId: true }
    });

    if (!leader?.cooperativeId) {
      return NextResponse.json({ error: 'No cooperative associated with leader' }, { status: 400 });
    }

    const cooperativeId = leader.cooperativeId;

    // Calculate available allocation balance
    const registrationFees = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        user: { cooperativeId },
        reference: { startsWith: 'REG_' },
        status: 'SUCCESSFUL',
        amount: { gt: 0 }
      }
    });

    // Get allocation percentage
    const allocationSettings = await prisma.systemSettings.findMany({
      where: {
        category: 'allocation',
        isActive: true
      }
    });

    const defaultAllocations = { leaderShare: 15 };
    const allocations = { ...defaultAllocations };
    allocationSettings.forEach(setting => {
      const value = parseFloat(setting.value);
      if (!isNaN(value) && setting.key === 'leaderShare') {
        allocations.leaderShare = value;
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
    
    // Count member and cooperative registrations for this cooperative
    const [memberRegCount, coopRegCount] = await Promise.all([
      prisma.transaction.count({
        where: {
          user: { cooperativeId },
          reference: { startsWith: 'REG_' },
          status: 'SUCCESSFUL',
          description: { contains: 'Member registration' }
        }
      }),
      prisma.transaction.count({
        where: {
          user: { cooperativeId },
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
    
    const allocationPercentage = allocations.leaderShare || 15;
    const totalAllocation = remainingAmount * (allocationPercentage / 100);

    // Get pending withdrawals
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        userId: targetUserId,
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
      where: { userId: targetUserId },
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
    console.error('Error fetching leader withdrawal balance:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

