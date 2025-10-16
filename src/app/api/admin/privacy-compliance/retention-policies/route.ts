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

    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch retention policies
    const policies = await prisma.dataRetentionPolicy.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    const totalPolicies = policies.length;
    const activePolicies = policies.filter(p => p.isActive).length;
    const dataTypes = Array.from(new Set(policies.map(p => p.dataCategory)));
    const averageRetentionPeriod = policies.length > 0 
      ? Math.round(policies.reduce((sum, p) => sum + p.retentionPeriod, 0) / policies.length)
      : 0;

    const stats = {
      totalPolicies,
      activePolicies,
      dataTypes,
      averageRetentionPeriod,
    };

    return NextResponse.json({
      policies,
      stats,
    });

  } catch (error) {
    console.error('Retention policies fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { dataType, retentionPeriod, description, legalBasis, isActive } = body;

    if (!dataType || !retentionPeriod || !description || !legalBasis) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create new retention policy
    const policy = await prisma.dataRetentionPolicy.create({
      data: {
        dataCategory: dataType, // Map dataType to dataCategory
        retentionPeriod,
        description,
        legalBasis,
        isActive: isActive ?? true,
        createdBy: (session.user as any).id,
      },
    });

    return NextResponse.json({
      success: true,
      policy,
    });

  } catch (error) {
    console.error('Retention policy creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
