# NOGALSS Cooperative - Deployment Guide

This document explains how to use the Git Update Manager system for deploying code updates to your VPS server.

## 🚀 Features

- **Automatic Update Detection**: Check for updates from GitHub repository
- **One-Click Deployment**: Update code with a single button click from admin dashboard
- **Rollback Capability**: Revert to previous version if needed
- **Status Monitoring**: View current deployment status and commit information
- **Logging**: Comprehensive logging of all deployment activities
- **Safety Features**: Automatic backups and error handling

## 📋 Prerequisites

### Server Requirements
- Node.js (v18 or higher)
- npm (v8 or higher)
- Git
- PM2 (recommended for process management)
- PostgreSQL (for database)

### Repository Setup
- GitHub repository: `https://github.com/creativemexy/nogalssapexcoop.git`
- SSH access to the repository (recommended)
- Proper file permissions for the deployment user

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/creativemexy/nogalssapexcoop.git
cd nogalssapexcoop
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file with your configuration:
```env
DATABASE_URL="your_database_url"
NEXTAUTH_SECRET="your_secret"
# ... other environment variables
```

### 4. Make Scripts Executable
```bash
chmod +x scripts/deploy.sh
chmod +x scripts/update.sh
```

### 5. Set Up PM2 (Optional but Recommended)
```bash
npm install -g pm2
pm2 start npm --name "nogalss-cooperative" -- start
pm2 save
pm2 startup
```

## 🎯 Usage

### Web Interface (Recommended)

1. **Access the Git Update Manager**:
   - Login as Super Admin
   - Navigate to `/dashboard/super-admin/git-update`

2. **Check for Updates**:
   - Click "Check for Updates" button
   - View current status and available updates

3. **Deploy Updates**:
   - Click "Update Code" button when updates are available
   - Monitor the deployment progress
   - View deployment logs and results

### Command Line Interface

#### Deploy Latest Changes
```bash
./scripts/deploy.sh
```

#### Check Status
```bash
./scripts/deploy.sh status
```

#### Rollback to Previous Version
```bash
./scripts/deploy.sh rollback
```

#### Manual Update
```bash
./scripts/update.sh
```

## 📊 Monitoring

### Deployment Logs
- **Web Interface**: View logs in the Git Update Manager dashboard
- **Server Logs**: Check `/var/log/nogalss-deploy.log`
- **Application Logs**: Check PM2 logs with `pm2 logs nogalss-cooperative`

### Status Checks
- **Git Status**: Current commit, branch, and remote status
- **Application Status**: PM2 process status and health
- **Database Status**: Migration status and connectivity

## 🔧 Configuration

### Repository Settings
The system is configured to work with:
- **Repository**: `https://github.com/creativemexy/nogalssapexcoop.git`
- **Branch**: `main`
- **Working Directory**: `/home/mexy/Desktop/newNogalss`

### Update Process
The deployment process includes:
1. **Fetch**: Get latest changes from remote repository
2. **Stash**: Save any local changes
3. **Pull**: Merge latest changes
4. **Install**: Update dependencies
5. **Migrate**: Run database migrations
6. **Build**: Compile the application
7. **Restart**: Restart the application server

## 🛡️ Safety Features

### Automatic Backups
- Local changes are automatically stashed before updates
- Previous versions are backed up in `/tmp/nogalss-backup-*`
- Old backups are automatically cleaned up after 7 days

### Error Handling
- Rollback capability if deployment fails
- Comprehensive error logging
- Graceful fallback to manual update process
- Timeout protection (5 minutes maximum)

### Security
- Only Super Admin and APEX users can trigger updates
- All deployment activities are logged
- Repository access is controlled by Git permissions

## 🚨 Troubleshooting

### Common Issues

#### 1. Permission Denied
```bash
# Fix script permissions
chmod +x scripts/deploy.sh scripts/update.sh

# Check file ownership
ls -la scripts/
```

#### 2. Git Authentication Failed
```bash
# Set up SSH keys for GitHub
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
ssh-add ~/.ssh/id_rsa

# Test connection
ssh -T git@github.com
```

#### 3. PM2 Not Found
```bash
# Install PM2 globally
npm install -g pm2

# Or use alternative process manager
# The system will work without PM2 but requires manual restart
```

#### 4. Database Migration Failed
```bash
# Check database connection
npx prisma db push

# Check environment variables
cat .env | grep DATABASE_URL
```

### Log Analysis
```bash
# View deployment logs
tail -f /var/log/nogalss-deploy.log

# View application logs
pm2 logs nogalss-cooperative

# Check system status
./scripts/deploy.sh status
```

## 📈 Best Practices

### Before Deployment
1. **Test Locally**: Ensure code works in development
2. **Backup Database**: Create database backup before major updates
3. **Check Dependencies**: Verify all dependencies are compatible
4. **Review Changes**: Check what changes will be deployed

### During Deployment
1. **Monitor Logs**: Watch deployment progress in real-time
2. **Test Application**: Verify application is working after deployment
3. **Check Database**: Ensure migrations completed successfully
4. **Verify Features**: Test key functionality

### After Deployment
1. **Monitor Performance**: Check application performance
2. **Review Logs**: Look for any errors or warnings
3. **User Testing**: Have users test the updated features
4. **Document Changes**: Update documentation if needed

## 🔄 Rollback Procedure

If deployment fails or causes issues:

### Automatic Rollback
```bash
./scripts/deploy.sh rollback
```

### Manual Rollback
```bash
# Navigate to project directory
cd /home/mexy/Desktop/newNogalss

# Reset to previous commit
git reset --hard HEAD~1

# Rebuild and restart
npm install
npm run build
pm2 restart nogalss-cooperative
```

## 📞 Support

For issues with the deployment system:
1. Check the logs first
2. Verify all prerequisites are met
3. Test with manual deployment
4. Contact system administrator if needed

## 🔐 Security Notes

- Only authorized users can trigger deployments
- All deployment activities are logged
- Repository access is controlled by Git permissions
- Environment variables should be kept secure
- Regular security updates are recommended

---

**Note**: This deployment system is designed for production use with proper security measures. Always test deployments in a staging environment first.
