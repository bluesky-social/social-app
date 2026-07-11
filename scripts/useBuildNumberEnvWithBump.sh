#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

outputIos=$(eas build:version:get -p ios)
outputAndroid=$(eas build:version:get -p android)
currentIosVersion=${outputIos#*buildNumber - }
currentAndroidVersion=${outputAndroid#*versionCode - }

BSKY_IOS_BUILD_NUMBER=$((currentIosVersion+1))
BSKY_ANDROID_VERSION_CODE=$((currentAndroidVersion+1))

# Export the build-number vars and exec the wrapped command directly. Using
# `exec "$@"` preserves argument boundaries; the old `bash -c "... $*"` flattened
# every argument into one string that a nested shell re-parsed, which mangled
# arguments containing spaces, `#`, or newlines.
export BSKY_IOS_BUILD_NUMBER BSKY_ANDROID_VERSION_CODE
exec "$@"

