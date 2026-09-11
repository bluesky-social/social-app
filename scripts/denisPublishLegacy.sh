#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

# Frozen numeric-runtime publication path. Remove only after legacy client support ends.
rm -rf bundleTempDir
node scripts/ota/package-legacy-export.js
RUNTIME_VERSION="${RUNTIME_VERSION:-$(jq -r .version package.json)}"
BUNDLE_VERSION="${BUNDLE_VERSION:-$(date +%s)000}"
denis publish --bundle-dir bundleTempDir --runtime-version "$RUNTIME_VERSION" --bundle-version "$BUNDLE_VERSION" --channel "$CHANNEL_NAME" --ios-build-number "$BSKY_IOS_BUILD_NUMBER" --android-build-number "$BSKY_ANDROID_VERSION_CODE" --cdn-domain "${DENIS_CDN_DOMAIN:-updates.bsky.app}" --s3-bucket "${DENIS_S3_BUCKET:-bsky-denis-ota-prod}"
rm -rf bundleTempDir
