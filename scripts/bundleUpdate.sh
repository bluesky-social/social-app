#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

rm -rf bundleTempDir
rm -rf bundle.tar.gz

echo "Creating tarball..."
node scripts/bundleUpdate.js

cd bundleTempDir || exit

BUNDLE_VERSION=$(date +%s)
DEPLOYMENT_URL="https://updates.bsky.app/v1/upload?runtime-version=$RUNTIME_VERSION&bundle-version=$BUNDLE_VERSION"

tar czvf bundle.tar.gz ./*

echo "Deploying to $DEPLOYMENT_URL..."

curl -o - --form "bundle=@./bundle.tar.gz" --user "bsky:$DENIS_API_KEY" --basic "$DEPLOYMENT_URL"

cd ..

rm -rf bundleTempDir
rm -rf bundle.tar.gz
