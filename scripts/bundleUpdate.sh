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

# Shared with denisPublish.sh when both run in one job -- see the note there.
# Both origins must receive the same bundle version for the same bytes, because
# the version is part of the asset URL path.
BUNDLE_VERSION="${BUNDLE_VERSION:-$(date +%s)}"

# This MUST address ota1's own origin hostname, never updates.bsky.app.
#
# Since the 2026-07-26 cutover updates.bsky.app resolves to denis on EKS, which
# deliberately has no /v1/upload route -- publishing there is out-of-band via
# `denis publish` (see denisPublish.sh). Posting to the CDN hostname therefore
# returns 404, which is what broke this step the first time it ran after the
# flip. The dual-write was never independent of the cutover precisely because it
# addressed the hostname being cut over.
#
# This upload exists only to keep ota1 carrying current bundles so a rollback of
# the Bunny origin remains useful. It goes away with this whole script when ota1
# is decommissioned (Phase 5).
OTA1_ORIGIN="${OTA1_ORIGIN:-https://ota1.us-east.updates.bsky.network}"
DEPLOYMENT_URL="$OTA1_ORIGIN/v1/upload?runtime-version=$RUNTIME_VERSION&bundle-version=$BUNDLE_VERSION&channel=$CHANNEL_NAME&ios-build-number=$BSKY_IOS_BUILD_NUMBER&android-build-number=$BSKY_ANDROID_VERSION_CODE"

tar czvf bundle.tar.gz ./*

echo "Deploying to $DEPLOYMENT_URL..."
echo "  runtime-version: $RUNTIME_VERSION"
echo "  bundle-version: $BUNDLE_VERSION"
echo "  channel: $CHANNEL_NAME"
echo "  ios-build-number: $BSKY_IOS_BUILD_NUMBER"
echo "  android-build-number: $BSKY_ANDROID_VERSION_CODE"

curl --fail-with-body -o - --form "bundle=@./bundle.tar.gz" --user "bsky:$DENIS_API_KEY" --basic "$DEPLOYMENT_URL"

cd ..

rm -rf bundleTempDir
rm -rf bundle.tar.gz
