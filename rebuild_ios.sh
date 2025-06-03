#!/bin/bash

echo "🔄 Rebuilding iOS Plugin..."

# Bước 1: Clean build artifacts
echo "📦 Cleaning build artifacts..."
rm -rf lib/
rm -rf node_modules/
rm -rf example/node_modules/
rm -rf example/ios/Pods/
rm -rf example/ios/build/
rm -rf example/ios/*.xcworkspace

# Bước 2: Reinstall dependencies
echo "📦 Installing root dependencies..."
yarn install

echo "📦 Building plugin..."
yarn prepare

# Bước 3: Install example dependencies
echo "📦 Installing example dependencies..."
cd example
yarn install

# Bước 4: Install iOS pods
echo "🍎 Installing iOS pods..."
cd ios
pod deintegrate || true
pod install --repo-update

echo "✅ iOS Plugin rebuild completed!"
echo "📱 You can now run: yarn ios" 