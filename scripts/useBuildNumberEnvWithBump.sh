#!/bin/bash
outputIos=$(eas build:version:get -p ios)
outputAndroid=$(eas build:version:get -p android)
currentIosVersion=${outputIos#*buildNumber - }
currentAndroidVersion=${outputAndroid#*versionCode - }

GNDR_IOS_BUILD_NUMBER=$((currentIosVersion+1))
GNDR_ANDROID_VERSION_CODE=$((currentAndroidVersion+1))

bash -c "GNDR_IOS_BUILD_NUMBER=$GNDR_IOS_BUILD_NUMBER GNDR_ANDROID_VERSION_CODE=$GNDR_ANDROID_VERSION_CODE $*"

