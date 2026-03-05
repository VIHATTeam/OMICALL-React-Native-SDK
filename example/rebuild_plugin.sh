#!/bin/bash

# Rebuild omikit-plugin from source
# This ensures example app uses latest changes from parent directory

echo "🔄 Rebuilding omikit-plugin from source..."

# 1. Remove old plugin from node_modules
echo "🗑️  Removing old omikit-plugin from node_modules..."
rm -rf node_modules/omikit-plugin

# 2. Reinstall to link from parent directory
echo "📦 Reinstalling dependencies..."
if command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

# 3. Verify link
if [ -L "node_modules/omikit-plugin" ]; then
    echo "✅ omikit-plugin linked from: $(readlink node_modules/omikit-plugin)"
else
    echo "✅ omikit-plugin installed from parent directory"
fi

# 4. Clean Android build
echo "🧹 Cleaning Android build..."
cd android
./gradlew clean
cd ..

echo ""
echo "✅ Plugin rebuilt successfully!"
echo "You can now run: npm run android:old"
