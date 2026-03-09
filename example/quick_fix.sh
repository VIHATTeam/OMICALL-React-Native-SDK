#!/bin/bash

# Quick Fix for White Screen
# Based on log analysis - Watchman recrawl issue

echo "🔧 Quick Fix for White Screen"
echo "=============================="

# Step 1: Reset Watchman (issue seen in log)
echo ""
echo "Step 1: Resetting Watchman..."
watchman watch-del '/Users/hsolutions/Documents/CODING/VIHAT/SDK/OMICALL-React-Native-SDK' 2>/dev/null || true
watchman watch-project '/Users/hsolutions/Documents/CODING/VIHAT/SDK/OMICALL-React-Native-SDK' 2>/dev/null || true
watchman watch-del-all 2>/dev/null || true
watchman shutdown-server 2>/dev/null || true
echo "✅ Watchman reset"

# Step 2: Kill Metro
echo ""
echo "Step 2: Killing Metro..."
pkill -f "metro" 2>/dev/null || true
pkill -f "react-native.*start" 2>/dev/null || true
sleep 2
echo "✅ Metro killed"

# Step 3: Clear Metro cache
echo ""
echo "Step 3: Clearing Metro cache..."
rm -rf /tmp/metro-* /tmp/haste-* /tmp/react-* 2>/dev/null || true
rm -rf $TMPDIR/metro-* $TMPDIR/haste-* $TMPDIR/react-* 2>/dev/null || true
echo "✅ Metro cache cleared"

# Step 4: Verify symlink
echo ""
echo "Step 4: Verifying omikit-plugin symlink..."
if [ -L "node_modules/omikit-plugin" ] && [ -f "node_modules/omikit-plugin/package.json" ]; then
    echo "✅ Symlink OK"
else
    echo "⚠️  Recreating symlink..."
    rm -rf node_modules/omikit-plugin
    ln -sf ../.. node_modules/omikit-plugin
    echo "✅ Symlink recreated"
fi

# Step 5: Uninstall app
echo ""
echo "Step 5: Uninstalling old app..."
adb uninstall com.omikitpluginexample 2>/dev/null || echo "   App was not installed"
echo "✅ Old app removed"

# Step 6: Install fresh app
echo ""
echo "Step 6: Installing app..."
if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    adb install android/app/build/outputs/apk/debug/app-debug.apk
    echo "✅ App installed"
else
    echo "❌ APK not found, building..."
    cd android && ./gradlew assembleDebug && cd ..
    adb install android/app/build/outputs/apk/debug/app-debug.apk
    echo "✅ App built and installed"
fi

# Step 7: Start Metro with reset cache
echo ""
echo "Step 7: Starting Metro with reset cache..."
npx react-native start --reset-cache &
METRO_PID=$!
echo "✅ Metro started (PID: $METRO_PID)"

# Wait for Metro
echo "   Waiting 10 seconds for Metro..."
sleep 10

# Step 8: Launch app
echo ""
echo "Step 8: Launching app..."
adb shell am start -n com.omikitpluginexample/.MainActivity
echo "✅ App launched"

# Step 9: Monitor logs
echo ""
echo "=============================="
echo "✅ Fix Complete!"
echo "=============================="
echo ""
echo "Monitoring logs (press Ctrl+C to stop)..."
echo ""

# Show relevant logs
adb logcat -c  # Clear log
adb logcat | grep --line-buffered -i "ReactNativeJS\|chromium\|JavaScript\|OmikitPlugin\|Error\|Exception"
