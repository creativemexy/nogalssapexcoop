import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSessionWithRoles } from '@/lib/security';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSessionWithRoles(session.user, ['APEX']);
    if ('error' in authResult) {
      return authResult.error;
    }

    // Get both registration fees from system settings
    const [memberFeeSetting, cooperativeFeeSetting] = await Promise.all([
      prisma.systemSettings.findFirst({
        where: {
          category: 'payment',
          key: 'member_registration_fee'
        }
      }),
      prisma.systemSettings.findFirst({
        where: {
          category: 'payment',
          key: 'cooperative_registration_fee'
        }
      })
    ]);

    const defaultMemberFee = 50000; // ₦500.00 in kobo
    const defaultCooperativeFee = 5000000; // ₦50,000.00 in kobo

    const memberFee = memberFeeSetting ? parseInt(memberFeeSetting.value) : defaultMemberFee;
    const cooperativeFee = cooperativeFeeSetting ? parseInt(cooperativeFeeSetting.value) : defaultCooperativeFee;

    return NextResponse.json({
      memberFee: {
        amount: memberFee,
        formatted: `₦${(memberFee / 100).toLocaleString()}`,
        currency: 'NGN'
      },
      cooperativeFee: {
        amount: cooperativeFee,
        formatted: `₦${(cooperativeFee / 100).toLocaleString()}`,
        currency: 'NGN'
      }
    });

  } catch (error) {
    console.error('Error fetching registration fees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSessionWithRoles(session.user, ['APEX']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const body = await request.json();
    const { memberFee, cooperativeFee } = body;

    // Validate fees
    if (memberFee && (memberFee < 1000 || memberFee > 10000000)) {
      return NextResponse.json({ 
        error: 'Member registration fee must be between ₦10.00 and ₦100,000.00' 
      }, { status: 400 });
    }

    if (cooperativeFee && (cooperativeFee < 1000 || cooperativeFee > 100000000)) {
      return NextResponse.json({ 
        error: 'Cooperative registration fee must be between ₦10.00 and ₦1,000,000.00' 
      }, { status: 400 });
    }

    const results = [];

    // Update member registration fee if provided
    if (memberFee !== undefined) {
      const memberSetting = await prisma.systemSettings.upsert({
        where: { 
          category_key: {
            category: 'payment',
            key: 'member_registration_fee'
          }
        },
        update: { 
          value: memberFee.toString(),
          updatedBy: (session.user as any).id
        },
        create: {
          category: 'payment',
          key: 'member_registration_fee',
          value: memberFee.toString(),
          description: 'Member registration fee in kobo',
          updatedBy: (session.user as any).id
        }
      });
      results.push({ type: 'member', setting: memberSetting });
    }

    // Update cooperative registration fee if provided
    if (cooperativeFee !== undefined) {
      const cooperativeSetting = await prisma.systemSettings.upsert({
        where: { 
          category_key: {
            category: 'payment',
            key: 'cooperative_registration_fee'
          }
        },
        update: { 
          value: cooperativeFee.toString(),
          updatedBy: (session.user as any).id
        },
        create: {
          category: 'payment',
          key: 'cooperative_registration_fee',
          value: cooperativeFee.toString(),
          description: 'Cooperative registration fee in kobo',
          updatedBy: (session.user as any).id
        }
      });
      results.push({ type: 'cooperative', setting: cooperativeSetting });
    }

    return NextResponse.json({
      success: true,
      message: 'Registration fees updated successfully',
      updated: results.map(r => ({
        type: r.type,
        amount: parseInt(r.setting.value),
        formatted: `₦${(parseInt(r.setting.value) / 100).toLocaleString()}`
      }))
    });

  } catch (error) {
    console.error('Error updating registration fees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
