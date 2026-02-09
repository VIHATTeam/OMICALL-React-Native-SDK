#!/bin/bash

set -e

echo "🧹 Cleaning cache and dependencies..."

# Clean React Native cache
echo "Cleaning React Native cache..."
npx react-native start --reset-cache &
METRO_PID=$!
sleep 3
kill $METRO_PID 2>/dev/null || true

# Clean npm cache
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
watchman watch-del-all 2>/dev/null || echo "Watchman not available, skipping..."

# Clean Metro cache
echo "Cleaning Metro cache..."
rm -rf /tmp/metro-* || true
rm -rf /tmp/haste-map-* || true

# Clean Android build cache
echo "🔧 Cleaning Android build cache..."
cd android

# Stop gradle daemon first
echo "Stopping Gradle daemon..."
./gradlew --stop

# Clean gradle cache selectively
echo "Cleaning Gradle Kotlin DSL cache..."
rm -rf ~/.gradle/caches/8.10.2/kotlin-dsl/ || true

# Clean project
echo "Running Gradle clean..."
./gradlew clean

# Remove local build directories
rm -rf build/
rm -rf app/build/
rm -rf .gradle/

echo "📱 Building APK..."
echo "This may take several minutes..."

# Build release APK with more verbose output
./gradlew assembleRelease --console=plain

echo "✅ APK build completed!"
echo "📍 APK location: android/app/build/outputs/apk/release/app-release.apk"

# Go back to root directory
cd ..

# Check if APK exists
if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
    APK_SIZE=$(ls -lh android/app/build/outputs/apk/release/app-release.apk | awk '{print $5}')
    echo "📦 APK size: $APK_SIZE"
else
    echo "❌ APK file not found!"
    exit 1
fi