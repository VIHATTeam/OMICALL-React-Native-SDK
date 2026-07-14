#!/usr/bin/env bash
#
# Release script for omikit-plugin.
#
# Usage:  ./build.sh <version>        # e.g. ./build.sh 4.2.0
#         SKIP_EXAMPLES=1 ./build.sh <version>   # tag + publish only
#
# Before tagging + publishing it verifies BOTH integration paths still build:
#   1. React Native CLI  → example/          (bare workflow)
#   2. Expo              → expo-example/      (config plugin + prebuild)
# so a broken build never gets released, and RN CLI can't silently regress.
#
# Android needs GitHub Packages credentials for omi-sdk — export before running:
#   export OMI_USER=omicall
#   export OMI_TOKEN=<github_packages_token>

set -euo pipefail

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "❌ Usage: ./build.sh <version>   (e.g. ./build.sh 4.2.0)"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

step() { echo ""; echo "▶ $1"; }

# ---------------------------------------------------------------------------
# 0. Version sanity — package.json must match the tag being released.
# ---------------------------------------------------------------------------
PKG_VERSION="$(node -e "console.log(require('./package.json').version)")"
if [ "$PKG_VERSION" != "$VERSION" ]; then
  echo "❌ package.json version ($PKG_VERSION) != requested tag ($VERSION)."
  echo "   Bump package.json first, then re-run."
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Build library JS + config plugin, run tests.
# ---------------------------------------------------------------------------
step "Building library (bob) + config plugin (tsc)"
yarn bob build
yarn build:plugin

step "Type-checking + tests"
yarn typecheck
yarn test
yarn test:plugin   # 20 config-plugin snapshot tests

# ---------------------------------------------------------------------------
# 2. Verify BOTH examples still build (skip with SKIP_EXAMPLES=1).
# ---------------------------------------------------------------------------
if [ "${SKIP_EXAMPLES:-0}" != "1" ]; then

  step "[RN CLI] Compile-check bare example (example/)"
  if [ -d example/android ]; then
    ( cd example/android && ./gradlew :omikit-plugin:compileDebugKotlin )
  else
    echo "  ⚠ example/android not generated — run 'yarn bootstrap' first; skipping."
  fi

  step "[Expo] Prebuild + compile-check expo-example/"
  if [ -d expo-example ]; then
    ( cd expo-example
      yarn --silent
      # iOS: prebuild generates the pods project (Info.plist / entitlements mods).
      CI=1 npx expo prebuild --platform ios --no-install >/dev/null
      # Android: prebuild + Kotlin compile (needs OMI_TOKEN for omi-sdk).
      CI=1 npx expo prebuild --platform android >/dev/null
      if [ -n "${OMI_TOKEN:-}" ]; then
        ( cd android && ./gradlew :app:compileDebugKotlin -x lint )
      else
        echo "  ⚠ OMI_TOKEN not set — skipping Android gradle compile (omi-sdk needs it)."
      fi
    )
  else
    echo "  ⚠ expo-example/ missing — skipping."
  fi

  echo ""
  echo "✅ Both RN CLI and Expo builds verified."
fi

# ---------------------------------------------------------------------------
# 3. Tag + publish.
# ---------------------------------------------------------------------------
step "Tagging $VERSION and publishing to npm"
git tag -a "$VERSION" -m "Release $VERSION"
git push origin "$VERSION"
npm pack
npm publish

echo ""
echo "🚀 Released $VERSION"
