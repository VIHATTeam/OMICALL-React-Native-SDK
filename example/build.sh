#!/bin/bash

# Màu cho log
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧹 Cleaning project...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/android" || exit
./gradlew clean
./gradlew clean cleanBuildCache

# Auto bump Android versionCode and versionName
echo -e "${GREEN}🔢 Bumping Android version...${NC}"
BUILD_GRADLE_FILE="app/build.gradle"
CURRENT_VERSION_CODE=$(grep versionCode "$BUILD_GRADLE_FILE" | head -n 1 | awk '{print $2}')
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))
sed -i '' "s/versionCode $CURRENT_VERSION_CODE/versionCode $NEW_VERSION_CODE/" "$BUILD_GRADLE_FILE"

CURRENT_VERSION_NAME=$(grep versionName "$BUILD_GRADLE_FILE" | head -n 1 | sed -E 's/.*versionName "([0-9]+\.[0-9]+\.[0-9]+)".*/\1/')
IFS='.' read -r -a ver <<< "$CURRENT_VERSION_NAME"
ver[2]=$((ver[2] + 1))
NEW_VERSION_NAME="${ver[0]}.${ver[1]}.${ver[2]}"
sed -i '' "s/versionName \"$CURRENT_VERSION_NAME\"/versionName \"$NEW_VERSION_NAME\"/" "$BUILD_GRADLE_FILE"

# Auto generate keystore if missing
KEY_ALIAS="androiddebugkey"
STORE_PASSWORD="android"
KEY_PASSWORD="android"
KEYSTORE_PATH="app/debug.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
  echo -e "${GREEN}🔐 Generating debug keystore...${NC}"
  mkdir -p "$(dirname "$KEYSTORE_PATH")"
  keytool -genkeypair -v -keystore "$KEYSTORE_PATH" \
    -alias "$KEY_ALIAS" \
    -storepass "$STORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US"
fi

echo -e "${GREEN}⚙️ Assembling APK (Release)...${NC}"
./gradlew :app:assembleRelease

APK_PATH="app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
  echo -e "${GREEN}✅ APK build thành công: $APK_PATH${NC}"
else
  echo -e "${RED}❌ APK build thất bại.${NC}"
fi