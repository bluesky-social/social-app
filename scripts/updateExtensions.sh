#!/bin/bash
IOS_SHARE_EXTENSION_DIRECTORY="./ios/Share-with-Bluesky"
EXPO_EXTENSIONS_DIRECTORY="./extensions"

if [ ! -d $IOS_SHARE_EXTENSION_DIRECTORY ]; then
  echo "$IOS_SHARE_EXTENSION_DIRECTORY not found inside of your iOS project."
  exit 1
else
  cp -R $IOS_SHARE_EXTENSION_DIRECTORY $EXPO_EXTENSIONS_DIRECTORY
fi
