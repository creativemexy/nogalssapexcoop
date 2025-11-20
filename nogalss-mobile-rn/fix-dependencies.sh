#!/bin/bash
# Fix dependency versions for Expo SDK 54

cd "$(dirname "$0")"

echo "🔧 Fixing dependencies for Expo SDK 54..."

# Stop Expo
pkill -f expo || true

# Remove node_modules and lock file
echo "🧹 Cleaning up..."
rm -rf node_modules package-lock.json

# Install Expo SDK 54
echo "📦 Installing Expo SDK 54..."
npm install expo@~54.0.0

# Fix all dependencies to match SDK 54
echo "🔧 Fixing all dependencies..."
npx expo install --fix

# Install React Navigation dependencies
echo "📦 Installing React Navigation..."
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler

# Install AsyncStorage
echo "📦 Installing AsyncStorage..."
npx expo install @react-native-async-storage/async-storage

echo ""
echo "✅ Dependencies fixed!"
echo ""
echo "Next: Run 'npm start' to start the app"

