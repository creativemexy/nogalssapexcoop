import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession } from '@/lib/security';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    // Get allocation percentages from system settings
    const allocationSettings = await prisma.systemSettings.findMany({
      where: {
        category: 'allocation',
        isActive: true
      },
      orderBy: { key: 'asc' }
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
    const currentAllocations = { ...defaultAllocations };
    
    allocationSettings.forEach(setting => {
      const value = parseFloat(setting.value);
      if (!isNaN(value)) {
        currentAllocations[setting.key as keyof typeof currentAllocations] = value;
      }
    });

    return NextResponse.json({
      allocations: currentAllocations,
      totalPercentage: Object.values(currentAllocations).reduce((sum, val) => sum + val, 0)
    });

  } catch (error) {
    console.error('Error fetching allocation percentages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const body = await request.json();
    const { allocations } = body;

    // Validate that percentages add up to 100%
    const values = Object.values(allocations);
    let totalPercentage = 0;
    for (const val of values) {
      totalPercentage += parseFloat(String(val)) || 0;
    }
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json({ 
        error: 'Allocation percentages must add up to exactly 100%',
        currentTotal: totalPercentage
      }, { status: 400 });
    }

    // Validate individual percentages are non-negative
    for (const [key, value] of Object.entries(allocations)) {
      const percentage = parseFloat(value as string);
      if (percentage < 0) {
        return NextResponse.json({ 
          error: `Allocation percentage for ${key} cannot be negative`
        }, { status: 400 });
      }
    }

    const userId = (session.user as any).id;

    // Update allocation settings in a transaction
    const updatedSettings = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const [key, value] of Object.entries(allocations)) {
        const result = await tx.systemSettings.upsert({
          where: {
            category_key: {
              category: 'allocation',
              key: key,
            },
          },
          update: {
            value: value.toString(),
            description: `Allocation percentage for ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
            updatedBy: userId,
            isActive: true,
          },
          create: {
            category: 'allocation',
            key: key,
            value: value.toString(),
            description: `Allocation percentage for ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
            updatedBy: userId,
            isActive: true,
          },
        });
        results.push(result);
      }
      
      return results;
    });

    // Log the allocation update
    await prisma.log.create({
      data: {
        userId: userId,
        userEmail: session.user.email || 'unknown',
        action: 'Allocation percentages updated'
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Allocation percentages updated successfully',
      allocations: allocations,
      totalPercentage: totalPercentage
    });

  } catch (error) {
    console.error('Error updating allocation percentages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
