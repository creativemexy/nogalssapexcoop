#!/bin/bash

# NOGALSS Cooperative - Deployment Script
# This script handles automatic deployment from GitHub

set -e  # Exit on any error

# Configuration
REPO_URL="https://github.com/creativemexy/nogalssapexcoop.git"
BRANCH="main"
APP_NAME="nogalss-cooperative"
PROJECT_DIR="/home/mexy/Desktop/newNogalss"
LOG_FILE="/var/log/nogalss-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. Consider using a non-root user with sudo privileges."
    fi
}

# Check if git is installed
check_git() {
    if ! command -v git &> /dev/null; then
        error "Git is not installed. Please install git first."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
}

# Check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        warning "PM2 is not installed. Application restart will be skipped."
        return 1
    fi
    return 0
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    local backup_dir="/tmp/nogalss-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    if [ -d "$PROJECT_DIR" ]; then
        cp -r "$PROJECT_DIR" "$backup_dir/"
        success "Backup created at $backup_dir"
    else
        warning "Project directory not found. Skipping backup."
    fi
}

# Fetch latest changes
fetch_updates() {
    log "Fetching latest changes from GitHub..."
    
    if [ ! -d "$PROJECT_DIR" ]; then
        log "Project directory not found. Cloning repository..."
        git clone "$REPO_URL" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    else
        cd "$PROJECT_DIR"
        git fetch origin
    fi
    
    # Check if there are updates
    local current_commit=$(git rev-parse HEAD)
    local latest_commit=$(git rev-parse origin/$BRANCH)
    
    if [ "$current_commit" = "$latest_commit" ]; then
        success "Code is already up to date"
        return 1
    fi
    
    log "Updates available. Current: ${current_commit:0:8}, Latest: ${latest_commit:0:8}"
    return 0
}

# Stash local changes
stash_changes() {
    log "Stashing local changes..."
    if git diff --quiet && git diff --cached --quiet; then
        log "No local changes to stash"
    else
        git stash push -m "Auto-stash before deployment $(date)"
        success "Local changes stashed"
    fi
}

# Pull latest changes
pull_changes() {
    log "Pulling latest changes from $BRANCH branch..."
    git pull origin "$BRANCH"
    success "Code updated successfully"
}

# Install dependencies
install_dependencies() {
    log "Installing/updating dependencies..."
    npm ci --production=false
    success "Dependencies installed"
}

# Build application
build_application() {
    log "Building application..."
    npm run build
    success "Application built successfully"
}

# Restart application
restart_application() {
    if check_pm2; then
        log "Restarting application with PM2..."
        pm2 restart "$APP_NAME" || pm2 start npm --name "$APP_NAME" -- start
        success "Application restarted with PM2"
    else
        warning "PM2 not available. Manual restart required."
        log "To restart manually, run: cd $PROJECT_DIR && npm start"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    if command -v npx &> /dev/null; then
        npx prisma db push
        success "Database migrations completed"
    else
        warning "npx not available. Database migrations skipped."
    fi
}

# Cleanup old files
cleanup() {
    log "Cleaning up temporary files..."
    # Remove old backups (keep last 5)
    find /tmp -name "nogalss-backup-*" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
    success "Cleanup completed"
}

# Main deployment function
deploy() {
    log "Starting deployment process..."
    
    # Pre-deployment checks
    check_permissions
    check_git
    check_npm
    
    # Create backup
    backup_current
    
    # Check for updates
    if ! fetch_updates; then
        success "No updates available. Deployment skipped."
        exit 0
    fi
    
    # Stash local changes
    stash_changes
    
    # Pull latest changes
    pull_changes
    
    # Install dependencies
    install_dependencies
    
    # Run migrations
    run_migrations
    
    # Build application
    build_application
    
    # Restart application
    restart_application
    
    # Cleanup
    cleanup
    
    success "Deployment completed successfully!"
    log "Application is now running the latest version"
}

# Rollback function
rollback() {
    log "Rolling back to previous version..."
    
    cd "$PROJECT_DIR"
    
    # Get previous commit
    local previous_commit=$(git log --oneline -2 | tail -1 | cut -d' ' -f1)
    
    if [ -z "$previous_commit" ]; then
        error "No previous commit found for rollback"
        exit 1
    fi
    
    log "Rolling back to commit: $previous_commit"
    git reset --hard "$previous_commit"
    
    # Rebuild and restart
    install_dependencies
    build_application
    restart_application
    
    success "Rollback completed"
}

# Status check function
status() {
    log "Checking application status..."
    
    cd "$PROJECT_DIR"
    
    echo "=== Git Status ==="
    git status --porcelain
    echo ""
    
    echo "=== Current Commit ==="
    git log --oneline -1
    echo ""
    
    echo "=== Remote Status ==="
    git fetch origin
    git status -uno
    echo ""
    
    if check_pm2; then
        echo "=== PM2 Status ==="
        pm2 status
    fi
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "status")
        status
        ;;
    "help")
        echo "Usage: $0 [deploy|rollback|status|help]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy latest changes (default)"
        echo "  rollback - Rollback to previous version"
        echo "  status   - Check current status"
        echo "  help     - Show this help message"
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
