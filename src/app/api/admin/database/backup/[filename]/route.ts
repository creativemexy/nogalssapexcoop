import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawName = params.filename;
    // prevent path traversal
    const filename = path.basename(rawName);
    const filePath = path.join(process.cwd(), 'backups', filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const stream = fs.createReadStream(filePath);
    const headers = new Headers();
    headers.set('Content-Type', 'application/sql');
    headers.set('Content-Length', stat.size.toString());
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    // @ts-ignore - NextResponse can take a ReadableStream
    return new NextResponse(stream as any, { headers, status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to download backup' }, { status: 500 });
  }
}


