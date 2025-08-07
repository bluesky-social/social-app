#!/bin/bash
outputIos=$(eas build:version:get -p ios)
outputAndroid=$(eas build:version:get -p android)
GNDR_IOS_BUILD_NUMBER=${outputIos#*buildNumber - }
GNDR_ANDROID_VERSION_CODE=${outputAndroid#*versionCode - }

echo PACKAGE_VERSION="$(jq -r '.version' package.json)" > "$GITHUB_OUTPUT"
echo GNDR_IOS_BUILD_NUMBER=$GNDR_IOS_BUILD_NUMBER >> "$GITHUB_OUTPUT"
echo GNDR_ANDROID_VERSION_CODE=$GNDR_ANDROID_VERSION_CODE >> "$GITHUB_OUTPUT"
