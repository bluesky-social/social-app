#!/bin/bash
outputIos=$(eas build:version:get -p ios)
outputAndroid=$(eas build:version:get -p android)
BSKY_IOS_BUILD_NUMBER=${outputIos#*buildNumber - }
BSKY_ANDROID_VERSION_CODE=${outputAndroid#*versionCode - }

echo PACKAGE_VERSION="$(jq -r '.version' package.json)" > "$GITHUB_OUTPUT"
echo BSKY_IOS_BUILD_NUMBER=$BSKY_IOS_BUILD_NUMBER >> "$GITHUB_OUTPUT"
echo BSKY_ANDROID_VERSION_CODE=$BSKY_ANDROID_VERSION_CODE >> "$GITHUB_OUTPUT"
