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
    let url: URL;
    try {
      url = new URL(dbUrl);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid DATABASE_URL format' }, { status: 500 });
    }
    
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1);
    const username = decodeURIComponent(url.username || '');
    // Decode password - it's already URL-decoded by the URL parser, but be explicit
    // Handle both encoded and unencoded passwords
    const password = url.password ? decodeURIComponent(url.password) : '';
    
    if (!password) {
      return NextResponse.json({ error: 'Database password not found in DATABASE_URL' }, { status: 500 });
    }
    
    if (!username) {
      return NextResponse.json({ error: 'Database username not found in DATABASE_URL' }, { status: 500 });
    }

    // Create pg_dump command
    // Redirect stdout to backup file and stderr to a temp error file
    // Pass password via environment variable to avoid shell escaping issues
    const errorLogPath = path.join(backupDir, `error_${Date.now()}.log`);
    const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-password --clean --if-exists --create > "${backupPath}" 2> "${errorLogPath}"`;

    console.log('🔄 Creating database backup...');
    console.log(`📁 Backup file: ${filename}`);
    
    try {
      // Pass password via environment variable to avoid shell escaping issues
      await execAsync(pgDumpCommand, { 
        maxBuffer: 1024 * 1024 * 10,
        env: {
          ...process.env,
          PGPASSWORD: password
        }
      });
      
      // Check if backup file was created and has content
      if (!fs.existsSync(backupPath)) {
        let errorDetails = 'No error details available.';
        if (fs.existsSync(errorLogPath)) {
          try {
            errorDetails = fs.readFileSync(errorLogPath, 'utf-8').substring(0, 500);
            fs.unlinkSync(errorLogPath);
          } catch (e) {
            // Ignore
          }
        }
        throw new Error('Backup file was not created. ' + errorDetails);
      }
      
      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        let errorDetails = 'No error details available.';
        if (fs.existsSync(errorLogPath)) {
          try {
            errorDetails = fs.readFileSync(errorLogPath, 'utf-8').substring(0, 500);
            fs.unlinkSync(errorLogPath);
          } catch (e) {
            // Ignore
          }
        }
        throw new Error('Backup file is empty. ' + errorDetails);
      }

      // Clean up error log if backup succeeded
      if (fs.existsSync(errorLogPath)) {
        try {
          fs.unlinkSync(errorLogPath);
        } catch (e) {
          // Ignore
        }
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
      
      // Try to read error log for more details
      let errorMessage = error.message || 'Unknown error occurred';
      if (fs.existsSync(errorLogPath)) {
        try {
          const errorLog = fs.readFileSync(errorLogPath, 'utf-8');
          if (errorLog.trim()) {
            errorMessage = errorLog.trim().substring(0, 500);
          }
          fs.unlinkSync(errorLogPath);
        } catch (e) {
          // Ignore
        }
      }
      
      // Clean up empty backup file if it exists
      if (fs.existsSync(backupPath)) {
        try {
          fs.unlinkSync(backupPath);
        } catch (unlinkError) {
          // Ignore unlink errors
        }
      }
      
      return NextResponse.json({
        success: false,
        error: `Backup creation failed: ${errorMessage}`
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
