# 🚀 Quick Start Guide - Example App

## 📋 Prerequisites

- Node.js >= 16.0.0
- React Native CLI
- Android Studio (for Android)
- Xcode 14+ (for iOS, macOS only)

---

## ⚡ Quick Setup (Recommended)

```bash
cd example

# Run automated setup script
./setup_plugin.sh
```

This script will:
1. ✅ Link `omikit-plugin` from parent directory
2. ✅ Install compatible dependencies (including react-native-reanimated ~3.15.0)
3. ✅ Clean Android/iOS builds
4. ✅ Verify plugin structure

---

## 🤖 Run Android (Old Architecture)

### Terminal 1: Start Metro

```bash
npm start
```

### Terminal 2: Run Android

```bash
npm run android:old
# or simply
npm run android
```

### Verify Old Architecture

```bash
# Check gradle.properties
cat android/gradle.properties | grep newArchEnabled
# Expected: newArchEnabled=false ✅
```

---

## 🍎 Run iOS (Old Architecture)

### Terminal 1: Start Metro

```bash
npm start
```

### Terminal 2: Run iOS

```bash
npm run ios:old
# or simply
npm run ios
```

---

## 🔧 Manual Setup (if script fails)

### Step 1: Link Plugin

```bash
cd example

# Remove old plugin
rm -rf node_modules/omikit-plugin

# Create symlink
ln -s "$(cd .. && pwd)" node_modules/omikit-plugin

# Verify
ls -la node_modules/omikit-plugin
```

### Step 2: Install Dependencies

Edit `package.json` to ensure compatible versions:

```json
{
  "dependencies": {
    "react-native": "0.76.2",
    "react-native-reanimated": "~3.15.0",  // Important!
    "omikit-plugin": "file:../"
  }
}
```

Then install:

```bash
npm install
# or
yarn install
```

### Step 3: Clean Builds

**Android:**
```bash
cd android
./gradlew clean
cd ..
```

**iOS:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

---

## 🧪 Test New Architecture

### Android - Enable New Architecture

```bash
# Edit android/gradle.properties
echo "newArchEnabled=true" > android/gradle.properties

# Clean and rebuild
npm run clean:android
npm run android:new
```

### iOS - Enable New Architecture

```bash
# Run with New Architecture
npm run ios:new
```

This will:
1. Install pods with `RCT_NEW_ARCH_ENABLED=1`
2. Build and run with New Architecture

---

## 🔍 Verify Architecture at Runtime

Add this to `src/App.tsx`:

```typescript
import { NativeModules } from 'react-native';

const isTurboModuleEnabled = global.__turboModuleProxy != null;
console.log('🏗️ Architecture:', isTurboModuleEnabled ? 'NEW' : 'OLD');
console.log('📦 Plugin loaded:', !!NativeModules.OmikitPlugin);
```

**Expected Output:**
- Old Architecture: `🏗️ Architecture: OLD`
- New Architecture: `🏗️ Architecture: NEW`

---

## 🐛 Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues:

- ✅ react-native-reanimated compilation errors
- ✅ Plugin not found errors
- ✅ Gradle build failures
- ✅ iOS pod install issues

---

## 📝 Version Compatibility

| Package | Version | Notes |
|---------|---------|-------|
| react-native | 0.76.2 | Supports both Old + New Architecture |
| react-native-reanimated | ~3.15.0 | Compatible with RN 0.76 |
| omikit-plugin | 4.0.0 | Linked from parent directory |

---

## ✅ Success Checklist

After setup, verify:

- [ ] Metro bundler starts without errors
- [ ] Android app builds successfully
- [ ] iOS app builds successfully (macOS only)
- [ ] Plugin is linked correctly
- [ ] Console shows correct architecture mode
- [ ] All 40 SDK methods are callable
- [ ] Events emit correctly

---

## 🚀 Next Steps

Once the app is running:

1. Test login with user/password or API key
2. Make a test call
3. Verify events are emitted
4. Check camera views (if video call)
5. Test permissions flow

See [TESTING_GUIDE.md](../TESTING_GUIDE.md) for comprehensive testing checklist.

---

## 📞 Need Help?

If you encounter issues:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Verify dependencies are correct
3. Clean builds and reinstall
4. Contact: tranhoaihung05@gmail.com

**Happy Development! 🎉**
