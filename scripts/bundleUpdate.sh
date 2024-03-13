#!/bin/bash

rm -rf bundleTempDir
rm -rf bundle.tar.gz

echo "Creating tarball..."
node scripts/bundleUpdate.js

cd bundleTempDir || exit

RUNTIME_VERSION=$(cat metadata.json | jq -r '.runtimeVersion')
BUNDLE_VERSION=$(date +%s)
DEPLOYMENT_URL="https://updates.bsky.app/v1/upload?runtime-version=$RUNTIME_VERSION&bundle-version=$BUNDLE_VERSION"


tar czvf bundle.tar.gz ./*

echo "Deploying to $DEPLOYMENT_URL..."

curl -o - -I --form 'bundle=@./bundle.tar.gz' \
--user "bsky:$DENNIS_API_KEY" \
--basic "$DEPLOYMENT_URL" \
/

cd ..

rm -rf bundleTempDir
rm -rf bundle.tar.gz
