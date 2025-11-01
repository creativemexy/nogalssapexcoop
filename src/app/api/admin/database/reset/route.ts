import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alsoBackup } = await request.json().catch(() => ({ alsoBackup: false }));

    // Optional: trigger a backup prior to reset via internal call
    if (alsoBackup) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/database/backup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupName: 'pre_reset_backup' }),
        });
      } catch (e) {
        // continue even if backup fails
      }
    }

    // 1) Build TRUNCATE for all public tables except users and _prisma_migrations
    const tables: Array<{ tablename: string }> = await prisma.$queryRawUnsafe(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('users', '_prisma_migrations')`
    );

    const tableNames = tables.map(t => `"${t.tablename}"`);

    if (tableNames.length > 0) {
      const truncateSql = `TRUNCATE TABLE ${tableNames.join(',')} RESTART IDENTITY CASCADE;`;
      await prisma.$executeRawUnsafe(truncateSql);
    }

    // 2) Delete all non-super-admin users, keep SUPER_ADMINs
    await prisma.$executeRawUnsafe(`DELETE FROM "users" WHERE role <> 'SUPER_ADMIN';`);

    return NextResponse.json({
      success: true,
      message: 'Database reset completed. Super admin users preserved.',
      preservedCount: await prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
    });

  } catch (error: any) {
    console.error('Database reset error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset database' }, { status: 500 });
  }
}
