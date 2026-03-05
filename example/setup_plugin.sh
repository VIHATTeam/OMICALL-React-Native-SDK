#!/bin/bash

# Setup omikit-plugin for development
# This script properly links the plugin from parent directory

set -e  # Exit on error

echo "🔧 Setting up omikit-plugin for development..."

# Get absolute paths
EXAMPLE_DIR="$(pwd)"
PLUGIN_DIR="$(cd .. && pwd)"

echo "📁 Example directory: $EXAMPLE_DIR"
echo "📁 Plugin directory: $PLUGIN_DIR"

# Step 1: Ensure node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Creating node_modules directory..."
    mkdir -p node_modules
fi

# Step 2: Create symlink to plugin (use relative path to avoid nested loops)
echo "🔗 Creating symlink to omikit-plugin..."
rm -rf node_modules/omikit-plugin

# Use relative path: node_modules/omikit-plugin -> ..
# This points to parent directory (the SDK root)
ln -s .. node_modules/omikit-plugin

# Verify symlink
if [ -L "node_modules/omikit-plugin" ]; then
    SYMLINK_TARGET=$(readlink node_modules/omikit-plugin)
    echo "✅ Symlink created: node_modules/omikit-plugin -> $SYMLINK_TARGET"

    # Extra check: ensure we're not creating a loop
    if [ "$SYMLINK_TARGET" = "$PLUGIN_DIR" ] || [ "$SYMLINK_TARGET" = ".." ]; then
        echo "✅ Symlink target is valid"
    else
        echo "⚠️  Warning: Unexpected symlink target"
    fi
else
    echo "❌ Failed to create symlink"
    exit 1
fi

# Step 3: Verify plugin structure
if [ -f "node_modules/omikit-plugin/package.json" ]; then
    PLUGIN_VERSION=$(grep '"version"' node_modules/omikit-plugin/package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
    echo "✅ Plugin version: $PLUGIN_VERSION"
else
    echo "❌ Plugin package.json not found"
    exit 1
fi

# Step 4: Verify Android source
if [ -f "node_modules/omikit-plugin/android/build.gradle" ]; then
    echo "✅ Android native code found"
else
    echo "❌ Android native code not found"
    exit 1
fi

# Step 5: Verify iOS source
if [ -f "node_modules/omikit-plugin/ios/OmikitPlugin.m" ]; then
    echo "✅ iOS native code found"
else
    echo "❌ iOS native code not found"
    exit 1
fi

# Step 6: Install other dependencies
echo "📦 Installing other dependencies..."
if command -v yarn &> /dev/null; then
    yarn install --check-files
else
    npm install
fi

# Step 7: Clean Android build
echo "🧹 Cleaning Android build..."
cd android
./gradlew clean
cd ..

# Step 8: Install iOS pods (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Installing iOS pods..."
    cd ios
    rm -rf Pods Podfile.lock
    pod install
    cd ..
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. npm start          # Start Metro bundler"
echo "  2. npm run android:old # Run Android app"
echo "  or"
echo "  2. npm run ios:old     # Run iOS app"
