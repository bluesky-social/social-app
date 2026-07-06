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

cd "$ANDROID_DIR"
./gradlew assembleRelease

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
