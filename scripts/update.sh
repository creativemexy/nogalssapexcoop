#!/bin/bash

# Simple update script for web interface
# This script is called by the Git Update Manager

set -e

# Configuration
PROJECT_DIR="/home/mexy/Desktop/newNogalss"
LOG_FILE="/tmp/nogalss-update.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Main update process
log "Starting update process..."

cd "$PROJECT_DIR"

# Fetch latest changes
log "Fetching latest changes..."
git fetch origin

# Check if there are updates
current_commit=$(git rev-parse HEAD)
latest_commit=$(git rev-parse origin/main)

if [ "$current_commit" = "$latest_commit" ]; then
    log "No updates available"
    echo "SUCCESS: Code is already up to date"
    exit 0
fi

log "Updates found. Current: ${current_commit:0:8}, Latest: ${latest_commit:0:8}"

# Stash any local changes
log "Stashing local changes..."
git stash push -m "Auto-stash before update $(date)" || true

# Pull latest changes
log "Pulling latest changes..."
git pull origin main

# Install dependencies
log "Installing dependencies..."
npm install

# Run database migrations
log "Running database migrations..."
npx prisma db push || log "Database migration failed, continuing..."

# Build application
log "Building application..."
npm run build

# Restart with PM2 if available
if command -v pm2 &> /dev/null; then
    log "Restarting with PM2..."
    pm2 restart nogalss-cooperative || pm2 start npm --name nogalss-cooperative -- start
else
    log "PM2 not available, manual restart required"
fi

log "Update completed successfully"
echo "SUCCESS: Code updated and application restarted"
