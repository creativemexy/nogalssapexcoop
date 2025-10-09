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
    const steps: string[] = [];
    const errors: string[] = [];
    
    try {
      // Step 1: Check if we're in a git repository
      console.log('Checking git repository...');
      try {
        await execAsync('git status', { cwd: this.workingDir });
        steps.push('✓ Git repository verified');
      } catch (error) {
        errors.push('Not a git repository');
        throw new Error('Not a git repository');
      }
      
      // Step 2: Fetch latest changes
      console.log('Fetching latest changes...');
      try {
        const { stdout: fetchOutput, stderr: fetchError } = await execAsync('git fetch origin', { 
          cwd: this.workingDir,
          timeout: 60000 // 1 minute timeout
        });
        steps.push('✓ Fetched latest changes');
        console.log('Fetch output:', fetchOutput);
        if (fetchError) console.log('Fetch stderr:', fetchError);
      } catch (error) {
        errors.push(`Failed to fetch: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
      
      // Step 3: Check if there are updates
      console.log('Checking for updates...');
      const status = await this.checkForUpdates();
      if (status.error) {
        errors.push(`Check updates failed: ${status.error}`);
        throw new Error(status.error);
      }
      
      if (status.isUpToDate) {
        return {
          success: true,
          message: 'Code is already up to date',
          output: 'No updates available'
        };
      }
      
      steps.push(`✓ Updates found: ${status.currentCommit.substring(0, 8)} → ${status.latestCommit.substring(0, 8)}`);
      
      // Step 4: Stash any local changes (optional)
      console.log('Stashing local changes...');
      try {
        const { stdout: stashOutput } = await execAsync('git stash push -m "Auto-stash before update"', { 
          cwd: this.workingDir,
          timeout: 30000
        });
        steps.push('✓ Local changes stashed');
        console.log('Stash output:', stashOutput);
      } catch (error) {
        steps.push('✓ No local changes to stash');
        console.log('No local changes to stash');
      }
      
      // Step 5: Pull latest changes
      console.log('Pulling latest changes...');
      try {
        const { stdout: pullOutput, stderr: pullError } = await execAsync(`git pull origin ${this.branch}`, { 
          cwd: this.workingDir,
          timeout: 120000 // 2 minutes timeout
        });
        steps.push('✓ Pulled latest changes');
        console.log('Pull output:', pullOutput);
        if (pullError) console.log('Pull stderr:', pullError);
      } catch (error) {
        errors.push(`Failed to pull: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
      
      // Step 6: Install dependencies
      console.log('Installing dependencies...');
      try {
        const { stdout: installOutput, stderr: installError } = await execAsync('npm install', { 
          cwd: this.workingDir,
          timeout: 300000 // 5 minutes timeout
        });
        steps.push('✓ Dependencies installed');
        console.log('Install output:', installOutput);
        if (installError) console.log('Install stderr:', installError);
      } catch (error) {
        errors.push(`Failed to install dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
      
      // Step 7: Build the application
      console.log('Building application...');
      try {
        const { stdout: buildOutput, stderr: buildError } = await execAsync('npm run build', { 
          cwd: this.workingDir,
          timeout: 600000 // 10 minutes timeout
        });
        steps.push('✓ Application built');
        console.log('Build output:', buildOutput);
        if (buildError) console.log('Build stderr:', buildError);
      } catch (error) {
        errors.push(`Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
      
      // Step 8: Restart the application (if using PM2 or similar)
      console.log('Restarting application...');
      try {
        const { stdout: restartOutput, stderr: restartError } = await execAsync('pm2 restart nogalss-cooperative', { 
          cwd: this.workingDir,
          timeout: 60000
        });
        steps.push('✓ Application restarted with PM2');
        console.log('Restart output:', restartOutput);
        if (restartError) console.log('Restart stderr:', restartError);
      } catch (error) {
        steps.push('⚠ PM2 restart failed, manual restart may be required');
        console.log('PM2 restart failed, manual restart may be required');
      }
      
      return {
        success: true,
        message: 'Code updated successfully',
        output: steps.join('\n')
      };
      
    } catch (error) {
      console.error('Error in manual update:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'Manual update failed',
        error: errorMessage,
        output: `Steps completed:\n${steps.join('\n')}\n\nErrors:\n${errors.join('\n')}`
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
