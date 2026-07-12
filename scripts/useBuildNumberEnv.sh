#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

outputIos=$(eas build:version:get -p ios)
outputAndroid=$(eas build:version:get -p android)
BSKY_IOS_BUILD_NUMBER=${outputIos#*buildNumber - }
BSKY_ANDROID_VERSION_CODE=${outputAndroid#*versionCode - }

# Export the build-number vars and exec the wrapped command directly. Using
# `exec "$@"` preserves argument boundaries; the old `bash -c "... $*"` flattened
# every argument into one string that a nested shell re-parsed, which mangled
# arguments containing spaces, `#`, or newlines (e.g. the multi-line `--message`
# passed to `eoas publish`).
export BSKY_IOS_BUILD_NUMBER BSKY_ANDROID_VERSION_CODE
exec "$@"
