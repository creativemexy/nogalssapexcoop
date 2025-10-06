import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitStatus {
  isUpToDate: boolean;
  currentCommit: string;
  latestCommit: string;
  hasUpdates: boolean;
  lastChecked: string;
  error?: string;
}

export interface UpdateResult {
  success: boolean;
  message: string;
  output?: string;
  error?: string;
}

export class GitUpdater {
  private repoUrl: string;
  private branch: string;
  private workingDir: string;

  constructor(repoUrl: string = 'https://github.com/creativemexy/nogalssapexcoop.git', branch: string = 'main') {
    this.repoUrl = repoUrl;
    this.branch = branch;
    this.workingDir = process.cwd();
  }

  /**
   * Check if there are updates available from the remote repository
   */
  async checkForUpdates(): Promise<GitStatus> {
    try {
      // Fetch latest changes from remote
      await execAsync('git fetch origin', { cwd: this.workingDir });
      
      // Get current commit hash
      const { stdout: currentCommit } = await execAsync('git rev-parse HEAD', { cwd: this.workingDir });
      
      // Get latest commit hash from remote
      const { stdout: latestCommit } = await execAsync(`git rev-parse origin/${this.branch}`, { cwd: this.workingDir });
      
      const currentCommitHash = currentCommit.trim();
      const latestCommitHash = latestCommit.trim();
      
      const isUpToDate = currentCommitHash === latestCommitHash;
      
      return {
        isUpToDate,
        currentCommit: currentCommitHash,
        latestCommit: latestCommitHash,
        hasUpdates: !isUpToDate,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return {
        isUpToDate: false,
        currentCommit: '',
        latestCommit: '',
        hasUpdates: false,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update the code to the latest version
   */
  async updateCode(): Promise<UpdateResult> {
    try {
      console.log('Starting code update process...');
      
      // Use the update script for better error handling and logging
      const updateScript = `${this.workingDir}/scripts/update.sh`;
      
      try {
        const { stdout, stderr } = await execAsync(`bash ${updateScript}`, { 
          cwd: this.workingDir,
          timeout: 300000 // 5 minutes timeout
        });
        
        console.log('Update script output:', stdout);
        
        if (stdout.includes('SUCCESS:')) {
          return {
            success: true,
            message: 'Code updated successfully',
            output: stdout
          };
        } else {
          return {
            success: false,
            message: 'Update completed with warnings',
            output: stdout,
            error: stderr
          };
        }
        
      } catch (scriptError) {
        console.error('Update script failed:', scriptError);
        
        // Fallback to manual update process
        console.log('Falling back to manual update process...');
        return await this.manualUpdate();
      }
      
    } catch (error) {
      console.error('Error updating code:', error);
      return {
        success: false,
        message: 'Failed to update code',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Manual update process (fallback)
   */
  private async manualUpdate(): Promise<UpdateResult> {
    try {
      // Step 1: Fetch latest changes
      console.log('Fetching latest changes...');
      const { stdout: fetchOutput } = await execAsync('git fetch origin', { cwd: this.workingDir });
      
      // Step 2: Check if there are updates
      const status = await this.checkForUpdates();
      if (status.isUpToDate) {
        return {
          success: true,
          message: 'Code is already up to date',
          output: 'No updates available'
        };
      }
      
      // Step 3: Stash any local changes (optional)
      try {
        await execAsync('git stash push -m "Auto-stash before update"', { cwd: this.workingDir });
        console.log('Local changes stashed');
      } catch (error) {
        console.log('No local changes to stash');
      }
      
      // Step 4: Pull latest changes
      console.log('Pulling latest changes...');
      const { stdout: pullOutput } = await execAsync(`git pull origin ${this.branch}`, { cwd: this.workingDir });
      
      // Step 5: Install dependencies
      console.log('Installing dependencies...');
      const { stdout: installOutput } = await execAsync('npm install', { cwd: this.workingDir });
      
      // Step 6: Build the application
      console.log('Building application...');
      const { stdout: buildOutput } = await execAsync('npm run build', { cwd: this.workingDir });
      
      // Step 7: Restart the application (if using PM2 or similar)
      try {
        await execAsync('pm2 restart nogalss-cooperative', { cwd: this.workingDir });
        console.log('Application restarted with PM2');
      } catch (error) {
        console.log('PM2 restart failed, manual restart may be required');
      }
      
      return {
        success: true,
        message: 'Code updated successfully',
        output: `Fetch: ${fetchOutput}\nPull: ${pullOutput}\nInstall: ${installOutput}\nBuild: ${buildOutput}`
      };
      
    } catch (error) {
      console.error('Error in manual update:', error);
      return {
        success: false,
        message: 'Manual update failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current git status
   */
  async getCurrentStatus(): Promise<{
    branch: string;
    commit: string;
    message: string;
    author: string;
    date: string;
  }> {
    try {
      const [
        { stdout: branch },
        { stdout: commit },
        { stdout: message },
        { stdout: author },
        { stdout: date }
      ] = await Promise.all([
        execAsync('git rev-parse --abbrev-ref HEAD', { cwd: this.workingDir }),
        execAsync('git rev-parse --short HEAD', { cwd: this.workingDir }),
        execAsync('git log -1 --pretty=format:"%s"', { cwd: this.workingDir }),
        execAsync('git log -1 --pretty=format:"%an"', { cwd: this.workingDir }),
        execAsync('git log -1 --pretty=format:"%ad" --date=short', { cwd: this.workingDir })
      ]);

      return {
        branch: branch.trim(),
        commit: commit.trim(),
        message: message.trim(),
        author: author.trim(),
        date: date.trim()
      };
    } catch (error) {
      console.error('Error getting git status:', error);
      return {
        branch: 'unknown',
        commit: 'unknown',
        message: 'Unable to get status',
        author: 'unknown',
        date: 'unknown'
      };
    }
  }
}
