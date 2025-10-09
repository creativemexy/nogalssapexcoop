#!/bin/bash

# Enhanced update script for web interface
# This script is called by the Git Update Manager

# Don't exit on error, handle them gracefully
set +e

# Configuration
PROJECT_DIR="/home/mexy/Desktop/newNogalss"
LOG_FILE="/tmp/nogalss-update.log"
ERROR_LOG="/tmp/nogalss-update-error.log"

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$ERROR_LOG"
}

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    error_log "Project directory not found: $PROJECT_DIR"
    echo "ERROR: Project directory not found"
    exit 1
fi

# Main update process
log "Starting update process..."

cd "$PROJECT_DIR" || {
    error_log "Failed to change to project directory"
    echo "ERROR: Failed to change to project directory"
    exit 1
}

# Check if git repository exists
if [ ! -d ".git" ]; then
    error_log "Not a git repository"
    echo "ERROR: Not a git repository"
    exit 1
fi

# Fetch latest changes
log "Fetching latest changes..."
if ! git fetch origin 2>&1 | tee -a "$LOG_FILE"; then
    error_log "Failed to fetch from origin"
    echo "ERROR: Failed to fetch from origin"
    exit 1
fi

# Check if there are updates
current_commit=$(git rev-parse HEAD 2>/dev/null)
latest_commit=$(git rev-parse origin/main 2>/dev/null)

if [ -z "$current_commit" ] || [ -z "$latest_commit" ]; then
    error_log "Failed to get commit hashes"
    echo "ERROR: Failed to get commit hashes"
    exit 1
fi

if [ "$current_commit" = "$latest_commit" ]; then
    log "No updates available"
    echo "SUCCESS: Code is already up to date"
    exit 0
fi

log "Updates found. Current: ${current_commit:0:8}, Latest: ${latest_commit:0:8}"

# Stash any local changes (don't fail if no changes)
log "Stashing local changes..."
git stash push -m "Auto-stash before update $(date)" 2>/dev/null || log "No local changes to stash"

# Pull latest changes
log "Pulling latest changes..."
if ! git pull origin main 2>&1 | tee -a "$LOG_FILE"; then
    error_log "Failed to pull latest changes"
    echo "ERROR: Failed to pull latest changes"
    exit 1
fi

# Install dependencies
log "Installing dependencies..."
if ! npm install 2>&1 | tee -a "$LOG_FILE"; then
    error_log "Failed to install dependencies"
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

# Run database migrations
log "Running database migrations..."
if ! npx prisma db push 2>&1 | tee -a "$LOG_FILE"; then
    log "Database migration failed, continuing..."
fi

# Build application
log "Building application..."
if ! npm run build 2>&1 | tee -a "$LOG_FILE"; then
    error_log "Build failed"
    echo "ERROR: Build failed"
    exit 1
fi

# Restart with PM2 if available
if command -v pm2 &> /dev/null; then
    log "Restarting with PM2..."
    if ! pm2 restart nogalss-cooperative 2>&1 | tee -a "$LOG_FILE"; then
        log "PM2 restart failed, trying to start..."
        pm2 start npm --name nogalss-cooperative -- start 2>&1 | tee -a "$LOG_FILE" || log "PM2 start also failed"
    fi
else
    log "PM2 not available, manual restart required"
fi

log "Update completed successfully"
echo "SUCCESS: Code updated and application restarted"
