#!/bin/bash

# Nogalss Deployment Script
echo "🚀 Starting Nogalss deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the project root directory"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Restart the application (adjust based on your setup)
    echo "🔄 Restarting application..."
    
    # Option 1: PM2
    if command -v pm2 &> /dev/null; then
        pm2 restart nogalss || pm2 start npm --name "nogalss" -- run start
        echo "✅ Application restarted with PM2"
    fi
    
    # Option 2: Systemd
    if systemctl is-active --quiet nogalss; then
        sudo systemctl restart nogalss
        echo "✅ Application restarted with systemctl"
    fi
    
    # Option 3: Manual restart (if using other process manager)
    echo "⚠️  Please manually restart your application server"
    
    echo ""
    echo "🎉 Deployment completed!"
    echo "🔗 Test your payment verification URL:"
    echo "https://nogalssapexcoop.org/api/payments/verify?trxref=REG_1761071227173&reference=REG_1761071227173"
    
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi

