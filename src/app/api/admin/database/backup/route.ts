import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { backupName } = await request.json();
    
    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = backupName ? 
      `${backupName.replace(/[^a-zA-Z0-9-_]/g, '_')}_${timestamp}.sql` : 
      `backup_${timestamp}.sql`;
    
    const backupPath = path.join(process.cwd(), 'backups', filename);
    const backupDir = path.dirname(backupPath);
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Get database connection details from environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ error: 'Database URL not configured' }, { status: 500 });
    }

    // Parse database URL to extract connection details
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;

    // Create pg_dump command
    const pgDumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-password --verbose --clean --if-exists --create > "${backupPath}"`;

    console.log('🔄 Creating database backup...');
    console.log(`📁 Backup file: ${filename}`);
    
    try {
      await execAsync(pgDumpCommand);
      
      // Check if backup file was created and has content
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file was not created');
      }
      
      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      console.log('✅ Database backup created successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Database backup created successfully',
        backup: {
          filename,
          path: backupPath,
          size: stats.size,
          createdAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('❌ Backup creation failed:', error);
      
      // Clean up empty backup file if it exists
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
      
      return NextResponse.json({
        success: false,
        error: `Backup creation failed: ${error.message}`
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Database backup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
