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

    // Decode URL-encoded filename
    const rawName = decodeURIComponent(params.filename);
    // prevent path traversal
    const filename = path.basename(rawName);
    const backupsDir = path.join(process.cwd(), 'backups');
    const filePath = path.join(backupsDir, filename);

    // Check if backups directory exists
    if (!fs.existsSync(backupsDir)) {
      console.error('Backups directory does not exist:', backupsDir);
      return NextResponse.json({ error: 'Backups directory not found' }, { status: 404 });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      // List available files for debugging
      const availableFiles = fs.existsSync(backupsDir) 
        ? fs.readdirSync(backupsDir).filter(f => f.endsWith('.sql'))
        : [];
      console.error('File not found:', filePath);
      console.error('Requested filename:', filename);
      console.error('Available files:', availableFiles);
      return NextResponse.json({ 
        error: 'File not found',
        requested: filename,
        available: availableFiles
      }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const stream = fs.createReadStream(filePath);
    const headers = new Headers();
    headers.set('Content-Type', 'application/sql');
    headers.set('Content-Length', stat.size.toString());
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    // @ts-ignore - NextResponse can take a ReadableStream
    return new NextResponse(stream as any, { headers, status: 200 });
  } catch (error: any) {
    console.error('Download backup error:', error);
    return NextResponse.json({ 
      error: 'Failed to download backup',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode URL-encoded filename
    const rawName = decodeURIComponent(params.filename);
    // prevent path traversal
    const filename = path.basename(rawName);
    const backupsDir = path.join(process.cwd(), 'backups');
    const filePath = path.join(backupsDir, filename);

    // Check if backups directory exists
    if (!fs.existsSync(backupsDir)) {
      return NextResponse.json({ error: 'Backups directory not found' }, { status: 404 });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete backup error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete backup',
      details: error.message 
    }, { status: 500 });
  }
}


