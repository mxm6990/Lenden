#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Lenden iOS setup check"
echo

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "✗ Xcode command-line tools are missing."
  echo "  Install Xcode from the App Store, then run: xcode-select --install"
  exit 1
fi

echo "✓ Xcode found: $(xcodebuild -version | head -1)"

SDK_VERSION="$(xcodebuild -showsdks 2>/dev/null | sed -n 's/.*-sdk iphonesimulator\([0-9.]*\)/\1/p' | head -1)"
if [[ -z "$SDK_VERSION" ]]; then
  SDK_VERSION="$(xcodebuild -showsdks 2>/dev/null | awk '/Simulator - iOS/ {print $4; exit}')"
fi
if [[ -z "$SDK_VERSION" ]]; then
  echo "✗ No iOS Simulator SDK found."
  exit 1
fi

echo "✓ iOS Simulator SDK: $SDK_VERSION"

if xcrun simctl list runtimes 2>/dev/null | grep -qE "iOS (26|${SDK_VERSION%%.*})"; then
  echo "✓ Compatible iOS simulator runtime is installed"
elif xcrun simctl list runtimes 2>/dev/null | grep -q "iOS $SDK_VERSION"; then
  echo "✓ Matching iOS $SDK_VERSION simulator runtime is installed"
else
  INSTALLED="$(xcrun simctl list runtimes 2>/dev/null | awk '/^iOS / {print $2}' | paste -sd ', ' -)"
  echo "✗ Missing iOS $SDK_VERSION simulator runtime"
  if [[ -n "$INSTALLED" ]]; then
    echo "  Installed runtimes: $INSTALLED"
  fi
  echo
  echo "Your Xcode version expects iOS $SDK_VERSION simulators, but only older runtimes are installed."
  echo "Capacitor sync can succeed while Run still fails in Xcode with:"
  echo "  \"iOS $SDK_VERSION is not installed\""
  echo
  echo "Fix (pick one):"
  echo "  1. Xcode → Settings → Platforms → download iOS $SDK_VERSION"
  echo "  2. Terminal: xcodebuild -downloadPlatform iOS"
  echo
  echo "After the download finishes, run:"
  echo "  npm run ios:run"
  exit 1
fi

if [[ ! -f "$ROOT/ios/App/App.xcworkspace/contents.xcworkspacedata" ]]; then
  echo "✗ ios/App/App.xcworkspace is missing. Run: npx cap add ios"
  exit 1
fi

echo "✓ Capacitor iOS workspace present"

if [[ ! -f "$ROOT/ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme" ]]; then
  echo "⚠ Shared App scheme missing (Run may fail). Re-run npm run ios:sync."
else
  echo "✓ Shared App scheme present"
fi

echo
echo "Available iPhone simulators:"
xcrun simctl list devices available 2>/dev/null | grep "iPhone" | head -6 || true

echo
echo "All checks passed. Launch with:"
echo "  npm run ios:run"
