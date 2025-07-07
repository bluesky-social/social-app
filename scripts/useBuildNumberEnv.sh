#!/bin/bash
outputIos=$(eas build:version:get -p ios)
outputAndroid=$(eas build:version:get -p android)
GNDR_IOS_BUILD_NUMBER=${outputIos#*buildNumber - }
GNDR_ANDROID_VERSION_CODE=${outputAndroid#*versionCode - }

bash -c "GNDR_IOS_BUILD_NUMBER=$GNDR_IOS_BUILD_NUMBER GNDR_ANDROID_VERSION_CODE=$GNDR_ANDROID_VERSION_CODE $*"
