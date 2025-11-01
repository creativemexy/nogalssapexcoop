import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 });
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;

    // Support two modes: from existing filename (JSON) or uploaded file (multipart)
    if (contentType.includes('application/json')) {
      const { filename } = await request.json();
      if (!filename) return NextResponse.json({ error: 'filename is required' }, { status: 400 });
      const safe = path.basename(filename);
      const filePath = path.join(process.cwd(), 'backups', safe);
      if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'Backup not found' }, { status: 404 });

      const cmd = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${filePath}"`;
      const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 50 });
      return NextResponse.json({ success: true, message: 'Restore complete', stdout, stderr });
    }

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadsDir = path.join(process.cwd(), 'backups', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const tempPath = path.join(uploadsDir, `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
    fs.writeFileSync(tempPath, buffer);

    try {
      const cmd = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${tempPath}"`;
      const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 50 });
      return NextResponse.json({ success: true, message: 'Restore complete', stdout, stderr });
    } finally {
      // Clean up uploaded file
      fs.existsSync(tempPath) && fs.unlinkSync(tempPath);
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Restore failed' }, { status: 500 });
  }
}


