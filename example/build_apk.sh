#!/bin/bash

set -e

echo "🧹 Cleaning cache and dependencies..."

# Clean React Native cache
echo "Cleaning React Native cache..."
npx react-native start --reset-cache &
sleep 3
pkill -f "react-native start" || true

# Clean npm/yarn cache
echo "Cleaning npm cache..."
npm cache clean --force

# Clean yarn cache if yarn.lock exists
if [ -f "yarn.lock" ]; then
    echo "Cleaning yarn cache..."
    yarn cache clean
fi

# Clean node_modules and reinstall
echo "Cleaning node_modules..."
rm -rf node_modules
npm install

# Clean watchman cache
echo "Cleaning watchman cache..."
watchman watch-del-all || echo "Watchman not available, skipping..."

# Clean Metro cache
echo "Cleaning Metro cache..."
rm -rf /tmp/metro-* || true
rm -rf /tmp/haste-map-* || true

# Clean Android build cache
echo "🔧 Cleaning Android build cache..."
cd android

# Clean gradle cache
./gradlew clean
rm -rf build/
rm -rf app/build/
rm -rf .gradle/

# Stop gradle daemon before cleaning cache
./gradlew --stop

# Clean only specific gradle cache directories, not the entire cache
rm -rf ~/.gradle/caches/8.10.2/kotlin-dsl/ || true
rm -rf ~/.gradle/caches/build-cache-* || true
rm -rf ~/.gradle/caches/transforms-* || true

echo "📱 Building APK..."

# Build release APK
./gradlew assembleRelease

echo "✅ APK build completed!"
echo "📍 APK location: android/app/build/outputs/apk/release/app-release.apk"

# Go back to root directory
cd ..