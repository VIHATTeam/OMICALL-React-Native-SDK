#!/usr/bin/env bash
# Sync plugin sources into example/node_modules/omikit-plugin so the example
# app sees the latest local changes without running `yarn install` again.
#
# Yarn's `file:..` protocol copies the package into node_modules at install
# time and does NOT track future edits. This script bridges that gap.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$ROOT_DIR/example/node_modules/omikit-plugin"

if [ ! -d "$TARGET" ]; then
  echo "❌ $TARGET not found — run 'yarn install' in example first"
  exit 1
fi

echo "📦 Building TS to lib/..."
( cd "$ROOT_DIR" && npx bob build > /dev/null )

echo "🔄 Syncing source files into example/node_modules..."

# JS / TS sources (Metro reads from here)
mkdir -p "$TARGET/src/types"
cp "$ROOT_DIR/src/omikit.tsx" "$TARGET/src/omikit.tsx"
cp "$ROOT_DIR/src/index.tsx" "$TARGET/src/index.tsx"
cp "$ROOT_DIR/src/NativeOmikitPlugin.ts" "$TARGET/src/NativeOmikitPlugin.ts"
cp "$ROOT_DIR/src/types/index.d.ts" "$TARGET/src/types/index.d.ts"
for f in "$ROOT_DIR"/src/omi_*.tsx; do
  [ -e "$f" ] || continue
  cp "$f" "$TARGET/src/$(basename "$f")"
done

# Built lib/ (some tools fall back to lib/commonjs or lib/module)
rm -rf "$TARGET/lib"
cp -R "$ROOT_DIR/lib" "$TARGET/lib"

# Native iOS
rm -rf "$TARGET/ios"
cp -R "$ROOT_DIR/ios" "$TARGET/ios"

# Native Android
rm -rf "$TARGET/android"
cp -R "$ROOT_DIR/android" "$TARGET/android"

# Podspec
cp "$ROOT_DIR/omikit-plugin.podspec" "$TARGET/omikit-plugin.podspec"

echo "✅ Sync done."
echo ""
echo "Next steps depending on what you changed:"
echo "  • Only JS/TS  → restart Metro with: cd example && yarn start --reset-cache"
echo "  • iOS native  → rebuild iOS:        cd example && yarn ios"
echo "  • Android     → rebuild Android:    cd example && yarn android"
echo "  • Podspec     → reinstall pods:     cd example/ios && pod install"
