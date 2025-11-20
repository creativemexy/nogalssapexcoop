import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

/**
 * Register or update Expo push token for mobile notifications
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { expoPushToken, platform } = body;

    if (!expoPushToken) {
      return NextResponse.json(
        { error: 'Expo push token is required' },
        { status: 400 }
      );
    }

    // Check if device already exists
    const existingDevice = await prisma.device.findUnique({
      where: { expoPushToken },
    });

    if (existingDevice) {
      // Update existing device
      await prisma.device.update({
        where: { expoPushToken },
        data: {
          userId: user.id,
          platform: platform || 'unknown',
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new device record
      await prisma.device.create({
        data: {
          userId: user.id,
          expoPushToken,
          platform: platform || 'unknown',
          isActive: true,
        },
      });
    }

    // Deactivate other devices for this user (optional - keep multiple devices active)
    // await prisma.device.updateMany({
    //   where: {
    //     userId: user.id,
    //     expoPushToken: { not: expoPushToken },
    //   },
    //   data: { isActive: false },
    // });
    
    return NextResponse.json({
      success: true,
      message: 'Push token registered successfully',
    });
  } catch (error) {
    console.error('Error registering push token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Unregister push token
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { expoPushToken } = body;

    if (!expoPushToken) {
      return NextResponse.json(
        { error: 'Expo push token is required' },
        { status: 400 }
      );
    }

    // Deactivate or delete device
    await prisma.device.updateMany({
      where: {
        userId: user.id,
        expoPushToken,
      },
      data: { isActive: false },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Push token unregistered successfully',
    });
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

