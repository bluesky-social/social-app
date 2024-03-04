#!/bin/bash
DIST_DIRECTORY="./dist"
IOS_BUNDLE="$DIST_DIRECTORY/_expo/static/js/ios/*.hbc"
ANDROID_BUNDLE="$DIST_DIRECTORY/_expo/static/js/android/*.hbc"
ASSETS="$DIST_DIRECTORY/assets/*"
METADATA="$DIST_DIRECTORY/metadata.json"

rm -rf bundleTempDir
rm -rf bundle.tar.gz

mkdir bundleTempDir
mkdir bundleTempDir/bundles
mkdir bundleTempDir/assets

cp $IOS_BUNDLE bundleTempDir/bundles/
cp $ANDROID_BUNDLE bundleTempDir/bundles/
cp $ASSETS bundleTempDir/assets/
cp $METADATA bundleTempDir/

cd bundleTempDir

tar czvf bundle.tar.gz *

curl \
-H "deploy-secret: SUPER_SECRET_PASSWORD_YOU_WONT_GUESS_IT" \
-H "runtime-version: 1.71" \
-F 'data=@./bundle.tar.gz' http://updates-test.haileyok.com/deploy \
/

cd ..

rm -rf bundleTempDir
rm -rf bundle.tar.gz
