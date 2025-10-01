import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession, logSecurityEvent } from '@/lib/security';
import { prisma } from '@/lib/prisma';

// List all tables in the database
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) return authResult.error;

    // List tables (Postgres)
    const tables = await prisma.$queryRawUnsafe<any[]>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
    );
    await logSecurityEvent((session.user as any).id, 'DB_LIST_TABLES', { tables: tables.map(t => t.table_name) });
    return NextResponse.json({ tables: tables.map(t => t.table_name) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list tables' }, { status: 500 });
  }
}

// View table data (paginated)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) return authResult.error;

    const { table, page = 1, pageSize = 20 } = await request.json();
    if (!table || typeof table !== 'string') {
      return NextResponse.json({ error: 'Table name required' }, { status: 400 });
    }
    // Prevent SQL injection: only allow alphanumeric and underscore
    if (!/^\w+$/.test(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }
    const offset = (page - 1) * pageSize;
    // Get total count
    const countResult = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM "${table}"`);
    const total = countResult[0]?.count || 0;
    // Get paginated data
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "${table}" ORDER BY 1 DESC OFFSET $1 LIMIT $2`, offset, pageSize);
    await logSecurityEvent((session.user as any).id, 'DB_VIEW_TABLE', { table, page, pageSize });
    // Convert BigInt to string for JSON serialization
    const safeRows = rows.map(row =>
      Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? v.toString() : v]))
    );
    return NextResponse.json({ rows: safeRows, total, page, pageSize });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch table data' }, { status: 500 });
  }
}
