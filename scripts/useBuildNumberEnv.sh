#!/bin/bash
outputIos=$(eas build:version:get -p ios)
outputAndroid=$(eas build:version:get -p android)
currentIosVersion=${outputIos#*buildNumber - }
currentAndroidVersion=${outputAndroid#*versionCode - }

BSKY_IOS_BUILD_NUMBER=$((currentIosVersion+1))
BSKY_ANDROID_VERSION_CODE=$((currentAndroidVersion+1))

bash -c "BSKY_IOS_BUILD_NUMBER=$BSKY_IOS_BUILD_NUMBER BSKY_ANDROID_VERSION_CODE=$BSKY_ANDROID_VERSION_CODE $*"

