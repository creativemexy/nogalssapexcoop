import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin or apex
    if ((session.user as any).role !== 'SUPER_ADMIN' && (session.user as any).role !== 'APEX') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const workingDir = process.cwd();
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      workingDirectory: workingDir,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform
    };

    // Check if we're in a git repository
    try {
      const { stdout: gitStatus } = await execAsync('git status --porcelain', { cwd: workingDir });
      debugInfo.gitStatus = gitStatus.trim();
      debugInfo.isGitRepo = true;
    } catch (error) {
      debugInfo.isGitRepo = false;
      debugInfo.gitError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check current branch
    try {
      const { stdout: currentBranch } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: workingDir });
      debugInfo.currentBranch = currentBranch.trim();
    } catch (error) {
      debugInfo.branchError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check remote origin
    try {
      const { stdout: remoteUrl } = await execAsync('git remote get-url origin', { cwd: workingDir });
      debugInfo.remoteUrl = remoteUrl.trim();
    } catch (error) {
      debugInfo.remoteError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check if update script exists
    const updateScript = `${workingDir}/scripts/update.sh`;
    try {
      const { stdout: scriptCheck } = await execAsync(`test -f "${updateScript}" && echo "exists" || echo "missing"`);
      debugInfo.updateScriptExists = scriptCheck.trim() === 'exists';
      debugInfo.updateScriptPath = updateScript;
    } catch (error) {
      debugInfo.updateScriptExists = false;
      debugInfo.updateScriptError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check script permissions
    if (debugInfo.updateScriptExists) {
      try {
        const { stdout: permissions } = await execAsync(`ls -la "${updateScript}"`, { cwd: workingDir });
        debugInfo.scriptPermissions = permissions.trim();
      } catch (error) {
        debugInfo.permissionsError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Check PM2 status
    try {
      const { stdout: pm2Status } = await execAsync('pm2 list', { cwd: workingDir });
      debugInfo.pm2Status = pm2Status.trim();
      debugInfo.pm2Available = true;
    } catch (error) {
      debugInfo.pm2Available = false;
      debugInfo.pm2Error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check npm availability
    try {
      const { stdout: npmVersion } = await execAsync('npm --version', { cwd: workingDir });
      debugInfo.npmVersion = npmVersion.trim();
      debugInfo.npmAvailable = true;
    } catch (error) {
      debugInfo.npmAvailable = false;
      debugInfo.npmError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check package.json
    try {
      const { stdout: packageJson } = await execAsync('cat package.json | head -20', { cwd: workingDir });
      debugInfo.packageJson = packageJson.trim();
    } catch (error) {
      debugInfo.packageJsonError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check disk space
    try {
      const { stdout: diskSpace } = await execAsync('df -h .', { cwd: workingDir });
      debugInfo.diskSpace = diskSpace.trim();
    } catch (error) {
      debugInfo.diskSpaceError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check recent logs
    try {
      const { stdout: recentLogs } = await execAsync('tail -20 /tmp/nogalss-update.log 2>/dev/null || echo "No logs found"', { cwd: workingDir });
      debugInfo.recentLogs = recentLogs.trim();
    } catch (error) {
      debugInfo.recentLogs = 'No logs available';
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
