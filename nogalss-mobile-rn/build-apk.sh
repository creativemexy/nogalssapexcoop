#!/bin/bash

# Build APK script for Nogalss Mobile App
# This script will help you build an APK for Android

echo "🚀 Building APK for Nogalss Mobile App"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI is not installed. Installing..."
    npm install -g eas-cli
fi

# Navigate to project directory
cd "$(dirname "$0")"

# Check if eas.json exists
if [ ! -f "eas.json" ]; then
    echo "📝 Creating eas.json..."
    cat > eas.json << EOF
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    }
  }
}
EOF
fi

echo "📦 Starting EAS build..."
echo "⚠️  This will open an interactive prompt. Please:"
echo "   1. Type 'y' to create a new EAS project (if prompted)"
echo "   2. Wait for the build to complete"
echo ""

# Start the build
eas build --platform android --profile preview

echo ""
echo "✅ Build process started!"
echo "📱 Once complete, you can download the APK from:"
echo "   https://expo.dev/accounts/[your-account]/projects/nogalss-mobile/builds"

