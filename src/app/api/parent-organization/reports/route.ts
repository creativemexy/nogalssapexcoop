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
    if ((session.user as any).role !== 'PARENT_ORGANIZATION') {
      return NextResponse.json({ error: 'Access denied. Parent organization role required.' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    // Get the parent organization for this user
    const parentOrganization = await prisma.parentOrganization.findFirst({
      where: { userId: userId }
    });

    if (!parentOrganization) {
      return NextResponse.json({ error: 'Parent organization not found' }, { status: 404 });
    }

    // Get all cooperatives under this parent organization with their data
    const cooperatives = await prisma.cooperative.findMany({
      where: {
        parentOrganizationId: parentOrganization.id
      },
      include: {
        _count: {
          select: {
            members: true,
            contributions: {
              where: {
                createdAt: {
                  gte: new Date(startDate),
                  lte: new Date(endDate)
                }
              }
            },
            loans: {
              where: {
                createdAt: {
                  gte: new Date(startDate),
                  lte: new Date(endDate)
                }
              }
            }
          }
        },
        contributions: {
          where: {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          },
          select: {
            amount: true
          }
        },
        loans: {
          where: {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          },
          select: {
            amount: true,
            status: true
          }
        }
      }
    });

    // Calculate summary data
    const totalMembers = cooperatives.reduce((sum, coop) => sum + coop._count.members, 0);
    const totalContributions = cooperatives.reduce((sum, coop) => 
      sum + coop.contributions.reduce((contribSum, contrib) => contribSum + Number(contrib.amount), 0), 0
    );
    const totalLoans = cooperatives.reduce((sum, coop) => 
      sum + coop.loans.reduce((loanSum, loan) => loanSum + Number(loan.amount), 0), 0
    );
    const activeLoans = cooperatives.reduce((sum, coop) => 
      sum + coop.loans.filter(loan => loan.status === 'APPROVED').length, 0
    );

    // Format cooperative data for the report
    const cooperativeData = cooperatives.map(coop => ({
      id: coop.id,
      name: coop.name,
      memberCount: coop._count.members,
      contributionTotal: coop.contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0),
      loanTotal: coop.loans.reduce((sum, loan) => sum + Number(loan.amount), 0),
      activeLoans: coop.loans.filter(loan => loan.status === 'APPROVED').length
    }));

    // Generate monthly data for the last 12 months
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthContributions = await prisma.contribution.aggregate({
        where: {
          cooperative: {
            parentOrganizationId: parentOrganization.id
          },
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: {
          amount: true
        }
      });

      const monthLoans = await prisma.loan.aggregate({
        where: {
          cooperative: {
            parentOrganizationId: parentOrganization.id
          },
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: {
          amount: true
        }
      });

      const monthMembers = await prisma.user.count({
        where: {
          cooperative: {
            parentOrganizationId: parentOrganization.id
          },
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        contributions: monthContributions._sum.amount || 0,
        loans: monthLoans._sum.amount || 0,
        members: monthMembers
      });
    }

    const reportData = {
      cooperatives: cooperativeData,
      summary: {
        totalCooperatives: cooperatives.length,
        totalMembers,
        totalContributions,
        totalLoans,
        activeLoans
      },
      monthlyData
    };

    return NextResponse.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Error fetching parent organization reports:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
