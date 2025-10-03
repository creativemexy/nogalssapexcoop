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

    if (userRole !== 'LEADER') {
      return NextResponse.json({ error: 'Access denied. Leader role required.' }, { status: 403 });
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

    // Fetch members with their financial data
    const members = await prisma.user.findMany({
      where: { 
        cooperativeId,
        role: 'MEMBER'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        contributions: {
          select: {
            amount: true
          }
        },
        loans: {
          select: {
            amount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.isActive).length;
    const verifiedMembers = members.filter(m => m.isVerified).length;
    
    // Convert amounts from kobo to naira
    const totalContributions = members.reduce((sum, member) => 
      sum + member.contributions.reduce((memberSum, contrib) => memberSum + Number(contrib.amount), 0), 0
    ) / 100;
    
    const totalLoans = members.reduce((sum, member) => 
      sum + member.loans.reduce((memberSum, loan) => memberSum + Number(loan.amount), 0), 0
    ) / 100;
    
    const pendingLoans = members.reduce((sum, member) => 
      sum + member.loans.filter(loan => loan.status === 'PENDING').length, 0
    );

    // Format member data with aggregated financial information
    const formattedMembers = members.map(member => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phoneNumber: member.phoneNumber,
      isActive: member.isActive,
      isVerified: member.isVerified,
      createdAt: member.createdAt.toISOString(),
      contributions: {
        totalAmount: member.contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0) / 100, // Convert from kobo to naira
        count: member.contributions.length
      },
      loans: {
        totalAmount: member.loans.reduce((sum, loan) => sum + Number(loan.amount), 0) / 100, // Convert from kobo to naira
        count: member.loans.length,
        pendingCount: member.loans.filter(loan => loan.status === 'PENDING').length
      }
    }));

    return NextResponse.json({
      members: formattedMembers,
      stats: {
        totalMembers,
        activeMembers,
        verifiedMembers,
        totalContributions,
        totalLoans,
        pendingLoans
      }
    });

  } catch (error) {
    console.error('Error fetching leader members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


