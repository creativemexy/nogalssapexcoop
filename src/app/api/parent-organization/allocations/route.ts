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

    if (!['PARENT_ORGANIZATION', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied. Parent Organization or Super Admin role required.' }, { status: 403 });
    }

    // Get the parent organization ID for the current user
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { parentOrganization: true }
    });

    if (!user?.parentOrganization) {
      return NextResponse.json({ error: 'No parent organization associated with user' }, { status: 400 });
    }

    const parentOrganizationId = user.parentOrganization.id;

    // Get all successful registration fee transactions from cooperatives under this parent organization
    const registrationFees = await prisma.transaction.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        status: 'SUCCESSFUL',
        reference: { startsWith: 'REG_' },
        amount: { gt: 0 },
        user: { 
          cooperative: { 
            parentOrganizationId 
          } 
        }
      },
    });

    const totalRegistrationFees = Number(registrationFees._sum.amount || 0) / 100; // Convert from kobo to naira
    const totalTransactions = registrationFees._count.id || 0;
    
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
            cooperative: { parentOrganizationId }
          },
          reference: { startsWith: 'REG_' },
          status: 'SUCCESSFUL',
          description: { contains: 'Member registration' }
        }
      }),
      prisma.transaction.count({
        where: {
          user: {
            cooperative: { parentOrganizationId }
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
    
    // Calculate Parent Organization's allocation based on remaining amount (after super admin wallet allocation)
    const parentOrganizationAllocation = remainingAmount * (allocations.parentOrganizationShare / 100);
    
    // Get recent transactions from cooperatives under this parent organization
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESSFUL',
        reference: { startsWith: 'REG_' },
        amount: { gt: 0 },
        user: { 
          cooperative: { 
            parentOrganizationId 
          } 
        }
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
            cooperative: {
              select: {
                name: true
              }
            }
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
          user: { 
            cooperative: { 
              parentOrganizationId 
            } 
          },
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });
      
      const monthTotal = Number(monthFees._sum.amount || 0) / 100; // Convert from kobo to naira
      
      // Count registrations in this month
      const [monthMemberRegCount, monthCoopRegCount] = await Promise.all([
        prisma.transaction.count({
          where: {
            user: {
              cooperative: { parentOrganizationId }
            },
            reference: { startsWith: 'REG_' },
            status: 'SUCCESSFUL',
            description: { contains: 'Member registration' },
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        }),
        prisma.transaction.count({
          where: {
            user: {
              cooperative: { parentOrganizationId }
            },
            reference: { startsWith: 'REG_' },
            status: 'SUCCESSFUL',
            description: { contains: 'Cooperative registration' },
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        })
      ]);
      
      // Calculate super admin allocation for this month
      const monthSuperAdminAllocation = (monthMemberRegCount * memberAllocationAmount) + (monthCoopRegCount * coopAllocationAmount);
      const monthRemainingAmount = Math.max(0, monthTotal - monthSuperAdminAllocation);
      
      const monthParentOrganizationAllocation = monthRemainingAmount * (allocations.parentOrganizationShare / 100);
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalFees: monthTotal,
        parentOrganizationAllocation: monthParentOrganizationAllocation,
        transactionCount: 0, // Could be calculated if needed
      });
    }

    return NextResponse.json({
      // Main metrics
      totalRegistrationFees,
      totalTransactions,
      parentOrganizationAllocation, // Dynamic percentage of registration fees from their cooperatives
      allocationPercentage: allocations.parentOrganizationShare,
      
      // Recent activity
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        amount: Number(tx.amount) / 100, // Convert from kobo to naira
        payer: `${tx.user.firstName} ${tx.user.lastName}`,
        email: tx.user.email,
        cooperative: tx.user.cooperative?.name || 'Unknown',
        reference: tx.reference,
        createdAt: tx.createdAt,
        description: tx.description,
        parentOrganizationAllocation: (Number(tx.amount) / 100) * (allocations.parentOrganizationShare / 100), // Dynamic percentage of this transaction
      })),
      
      // Monthly breakdown
      monthlyBreakdown: monthlyData,
      
      // Summary stats
      averageTransactionValue: totalTransactions > 0 ? totalRegistrationFees / totalTransactions : 0,
      averageParentOrganizationAllocation: totalTransactions > 0 ? parentOrganizationAllocation / totalTransactions : 0,
    });
  } catch (error) {
    console.error('Parent organization allocations error:', error);
    return NextResponse.json({ error: 'Failed to fetch parent organization allocations' }, { status: 500 });
  }
}
