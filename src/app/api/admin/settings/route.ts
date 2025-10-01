import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession, logSecurityEvent } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { emitDashboardUpdate } from '@/lib/notifications';

const settingsSchema = z.object({
  category: z.enum(['general', 'branding', 'payment', 'notification', 'security', 'privacy']),
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  description: z.string().optional(),
});

const updateSettingsSchema = z.object({
  settings: z.array(settingsSchema),
});

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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const whereClause = category ? { category, isActive: true } : { isActive: true };

    const settings = await prisma.systemSettings.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category][setting.key] = {
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy,
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ settings: groupedSettings });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const validationResult = updateSettingsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid settings data', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { settings } = validationResult.data;
    const userId = (session.user as any).id;

    // Update settings in a transaction
    const updatedSettings = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const setting of settings) {
        const result = await tx.systemSettings.upsert({
          where: {
            category_key: {
              category: setting.category,
              key: setting.key,
            },
          },
          update: {
            value: setting.value,
            description: setting.description,
            updatedBy: userId,
            isActive: true,
          },
          create: {
            category: setting.category,
            key: setting.key,
            value: setting.value,
            description: setting.description,
            updatedBy: userId,
            isActive: true,
          },
        });
        results.push(result);
      }
      
      return results;
    });

    // Log the settings update
    await logSecurityEvent('system', 'SETTINGS_UPDATED', {
      updatedSettings: settings.map(s => ({ category: s.category, key: s.key })),
      updatedBy: userId,
    });

    // Emit real-time update
    emitDashboardUpdate();

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully',
      updatedCount: updatedSettings.length,
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const key = searchParams.get('key');

    if (!category || !key) {
      return NextResponse.json({ error: 'Category and key are required' }, { status: 400 });
    }

    const deletedSetting = await prisma.systemSettings.update({
      where: {
        category_key: {
          category,
          key,
        },
      },
      data: {
        isActive: false,
        updatedBy: (session.user as any).id,
      },
    });

    // Log the settings deletion
    await logSecurityEvent('system', 'SETTINGS_DELETED', {
      category,
      key,
      deletedBy: (session.user as any).id,
    });

    // Emit real-time update
    emitDashboardUpdate();

    return NextResponse.json({ 
      success: true, 
      message: 'Setting deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting system setting:', error);
    return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 });
  }
}
