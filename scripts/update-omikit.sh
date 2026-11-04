#!/usr/bin/env bash
# Usage: scripts/update-omikit.sh [omikit-git-tag]   e.g. 1.12.4 (default: latest tag)
# Replaces the vendored ios/Frameworks/OmiKit.xcframework with the one from the given OmiKit tag,
# then syncs omikit-plugin.podspec (vendored-version comment + SPM minimumVersion) and the
# README version table, and prints the OmiKit changelog since the previous vendored version.
set -euo pipefail
REPO_URL=https://github.com/VIHATTeam/OmiKit.git
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PODSPEC="$ROOT/omikit-plugin.podspec"
DEST="$ROOT/ios/Frameworks"

VERSION="${1:-$(git ls-remote --tags --refs "$REPO_URL" | sed 's|.*refs/tags/||' | sort -V | tail -1)}"
OLD_VERSION="$(sed -n 's/.*# Vendored version: \([0-9.]*\)\..*/\1/p' "$PODSPEC")"
echo "OmiKit: vendored $OLD_VERSION -> $VERSION"

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
git -c advice.detachedHead=false clone --quiet --depth 1 --branch "$VERSION" "$REPO_URL" "$TMP/OmiKit"

# Refuse a tag whose binary was built for another version (e.g. tag pushed before the release commit).
for slice in ios-arm64 ios-arm64-simulator; do
  if ! strings "$TMP/OmiKit/OmiKit.xcframework/$slice/OmiKit.framework/OmiKit" | grep -x "$VERSION" >/dev/null; then
    echo "error: tag $VERSION does not contain an OmiKit $VERSION binary ($slice); fix the OmiKit release first" >&2
    exit 1
  fi
done

mkdir -p "$DEST"; rm -rf "$DEST/OmiKit.xcframework"
cp -R "$TMP/OmiKit/OmiKit.xcframework" "$DEST/"
sed -i '' -E "s/(# Vendored version: )[0-9.]+\./\1$VERSION./; s/(minimumVersion: \")[0-9.]+\"/\1$VERSION\"/" "$PODSPEC"
sed -i '' -E "s/^(\| iOS \| OmiKit \| )[0-9.]+/\1$VERSION/" "$ROOT/README.md"
echo "Vendored OmiKit $VERSION; updated omikit-plugin.podspec and README.md"

echo
echo "===== OmiKit changes since $OLD_VERSION ====="
awk -v old="## [$OLD_VERSION]" 'index($0, old) == 1 { exit } { print }' "$TMP/OmiKit/CHANGELOG.md" | sed -n '/^## \[/,$p'
echo "===== Review the changes above, then: CHANGELOG.md, package.json version, pod install ====="
