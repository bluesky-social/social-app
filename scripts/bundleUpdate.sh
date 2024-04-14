#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

rm -rf bundleTempDir
rm -rf bundle.tar.gz

echo "Creating tarball..."
node scripts/bundleUpdate.js

if [ -z "$RUNTIME_VERSION" ]; then
  RUNTIME_VERSION=$(cat package.json | jq '.version' -r)
fi

cd bundleTempDir || exit
BUNDLE_VERSION=$(date +%s)
DEPLOYMENT_URL="https://updates.bsky.app/v1/upload?runtime-version=$RUNTIME_VERSION&bundle-version=$BUNDLE_VERSION&channel=$CHANNEL_NAME&ios-build-number=$BSKY_IOS_BUILD_NUMBER&android-build-number=$BSKY_ANDROID_VERSION_CODE"

tar czvf bundle.tar.gz ./*

echo "Deploying to $DEPLOYMENT_URL..."

curl -o - --form "bundle=@./bundle.tar.gz" --user "bsky:$DENIS_API_KEY" --basic "$DEPLOYMENT_URL"

cd ..

rm -rf bundleTempDir
rm -rf bundle.tar.gz
