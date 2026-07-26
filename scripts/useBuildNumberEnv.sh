#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

# Build numbers already present in the environment take precedence over the
# global EAS counters. Production OTA deploys rely on this to target the
# specific native build they are for, since the counters advance with every
# testflight build.
if [ -z "${BSKY_IOS_BUILD_NUMBER:-}" ]; then
  outputIos=$(eas build:version:get -p ios)
  BSKY_IOS_BUILD_NUMBER=${outputIos#*buildNumber - }
fi

if [ -z "${BSKY_ANDROID_VERSION_CODE:-}" ]; then
  outputAndroid=$(eas build:version:get -p android)
  BSKY_ANDROID_VERSION_CODE=${outputAndroid#*versionCode - }
fi

export BSKY_IOS_BUILD_NUMBER BSKY_ANDROID_VERSION_CODE
exec "$@"
