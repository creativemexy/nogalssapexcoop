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

    // Check if user is a parent organization
    const userRole = (session.user as any).role;
    if (userRole !== 'PARENT_ORGANIZATION') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the parent organization associated with this user
    const organization = await prisma.parentOrganization.findUnique({
      where: { userId: (session.user as any).id },
      select: { id: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch dashboard statistics for this organization
    const [
      totalCooperatives,
      activeCooperatives,
      totalTransactions,
      totalContributionsResult,
      totalLoansResult,
      pendingLoans,
    ] = await Promise.all([
      prisma.cooperative.count({
        where: { parentOrganizationId: organization.id },
      }),
      prisma.cooperative.count({
        where: { 
          parentOrganizationId: organization.id,
          isActive: true,
        },
      }),
      prisma.transaction.count({
        where: {
          user: {
            cooperative: {
              parentOrganizationId: organization.id,
            },
          },
        },
      }),
      prisma.contribution.aggregate({
        where: {
          user: {
            cooperative: {
              parentOrganizationId: organization.id,
            },
          },
        },
        _sum: { amount: true },
      }),
      prisma.loan.aggregate({
        where: {
          user: {
            cooperative: {
              parentOrganizationId: organization.id,
            },
          },
        },
        _sum: { amount: true },
      }),
      prisma.loan.count({
        where: {
          status: 'PENDING',
          user: {
            cooperative: {
              parentOrganizationId: organization.id,
            },
          },
        },
      }),
    ]);

    // Convert amounts from kobo to naira for display
    const totalContributions = Number(totalContributionsResult._sum.amount || 0) / 100;
    const totalLoans = Number(totalLoansResult._sum.amount || 0) / 100;

    // Get allocation data for parent organization
    const registrationFees = await prisma.transaction.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        status: 'SUCCESSFUL',
        reference: { startsWith: 'REG_' },
        amount: { gt: 0 },
        user: { 
          cooperative: { 
            parentOrganizationId: organization.id
          } 
        }
      },
    });

    const totalRegistrationFees = Number(registrationFees._sum.amount || 0) / 100;
    
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
    
    // Calculate Parent Organization's allocation
    const parentOrganizationAllocation = totalRegistrationFees * (allocations.parentOrganizationShare / 100);

    return NextResponse.json({
      totalCooperatives,
      activeCooperatives,
      totalTransactions,
      totalContributions,
      totalLoans,
      pendingLoans,
      // Allocation data
      totalRegistrationFees,
      parentOrganizationAllocation,
      allocationPercentage: allocations.parentOrganizationShare,
      allocationSettings: allocations,
    });

  } catch (error) {
    console.error('Error fetching parent organization dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
