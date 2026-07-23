#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset
set -o xtrace

# Resolve paths relative to the repo root, regardless of where this is run from.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$REPO_ROOT/android"
APK_OUTPUT_DIR="$ANDROID_DIR/app/build/outputs/apk/release"
SETTINGS_GRADLE="$ANDROID_DIR/settings.gradle"

# Guard against building with the wrong app identity. The New Arch build must
# use a distinct rootProject.name so it installs alongside the store app rather
# than overwriting it.
EXPECTED_APP_NAME="rootProject.name = 'Bluesky (New Arch)'"
if ! grep -qF "$EXPECTED_APP_NAME" "$SETTINGS_GRADLE"; then
  echo "Error: expected \"$EXPECTED_APP_NAME\" in $SETTINGS_GRADLE" >&2
  echo "(Set the app name in settings.gradle before building the New Arch release.)" >&2
  exit 1
fi

BRANCH_NAME="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"
COMMIT_HASH="$(git -C "$REPO_ROOT" rev-parse --short=6 HEAD)"

# Sanitize the branch name so it is safe to use in a filename (e.g. ob/new-arch -> ob-new-arch).
SAFE_BRANCH="$(echo "$BRANCH_NAME" | tr '/ ' '-')"

echo "Building Android release APK..."
echo "  branch: $BRANCH_NAME"
echo "  commit: $COMMIT_HASH"

# Marker used to detect which APK was produced by THIS build. Anything with an
# older mtime (e.g. a stale app-release.apk from a prior or interrupted run) is
# ignored, so we never mislabel it with the current commit.
BUILD_MARKER="$(mktemp)"
trap 'rm -f "$BUILD_MARKER"' EXIT

# Make sure the bundled JS ships with up-to-date compiled translations.
pnpm intl:compile

cd "$ANDROID_DIR"
# Build only arm64: Apple Silicon Macs run arm64 emulator images and all modern
# devices are arm64, so the other three ABIs just quadruple the NDK compile.
./gradlew assembleRelease --max-workers=2 --no-daemon -PreactNativeArchitectures=arm64-v8a

# Grab the freshly built APK: not an already-renamed bsky-* file, and newer than
# the marker so it is guaranteed to be this run's output. There are no ABI splits
# or flavors, so expect a single file.
APK_PATH="$(find "$APK_OUTPUT_DIR" -maxdepth 1 -name '*.apk' -not -name 'bsky-*' -newer "$BUILD_MARKER" | head -n 1)"

if [ -z "$APK_PATH" ]; then
  echo "Error: no freshly built APK found in $APK_OUTPUT_DIR" >&2
  echo "(Gradle may have been up-to-date and produced no new APK - run a clean build.)" >&2
  exit 1
fi

PREV_NAME="$(basename "$APK_PATH" .apk)"
NEW_NAME="bsky-${PREV_NAME}-${SAFE_BRANCH}-${COMMIT_HASH}.apk"
NEW_PATH="$APK_OUTPUT_DIR/$NEW_NAME"

mv "$APK_PATH" "$NEW_PATH"

echo "Renamed APK:"
echo "  $APK_PATH"
echo "  -> $NEW_PATH"
