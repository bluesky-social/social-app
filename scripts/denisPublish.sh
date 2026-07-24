#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

# Publishes the just-exported Expo bundle to the denis OTA service (S3) via the
# `denis publish` CLI. Mirrors bundleUpdate.sh's inputs (runtime version, bundle
# version, build numbers) but targets denis instead of the legacy ota1 upload.
# Expects: the `denis` binary on PATH (setup-denis action), ambient AWS creds
# (configure-aws-credentials OIDC), and BSKY_IOS_BUILD_NUMBER /
# BSKY_ANDROID_VERSION_CODE from the use-build-number wrapper.

rm -rf bundleTempDir

echo "Assembling bundle directory..."
node scripts/bundleUpdate.js

if [ -z "$RUNTIME_VERSION" ]; then
  RUNTIME_VERSION=$(cat package.json | jq '.version' -r)
fi

BUNDLE_VERSION=$(date +%s)
DENIS_CDN_DOMAIN="${DENIS_CDN_DOMAIN:-updates.bsky.app}"
DENIS_S3_BUCKET="${DENIS_S3_BUCKET:-bsky-denis-ota-prod}"

echo "Publishing to denis..."
echo "  runtime-version: $RUNTIME_VERSION"
echo "  bundle-version: $BUNDLE_VERSION"
echo "  channel: $CHANNEL_NAME"
echo "  ios-build-number: $BSKY_IOS_BUILD_NUMBER"
echo "  android-build-number: $BSKY_ANDROID_VERSION_CODE"
echo "  cdn-domain: $DENIS_CDN_DOMAIN"
echo "  s3-bucket: $DENIS_S3_BUCKET"

denis publish \
  --bundle-dir bundleTempDir \
  --runtime-version "$RUNTIME_VERSION" \
  --bundle-version "$BUNDLE_VERSION" \
  --channel "$CHANNEL_NAME" \
  --ios-build-number "$BSKY_IOS_BUILD_NUMBER" \
  --android-build-number "$BSKY_ANDROID_VERSION_CODE" \
  --cdn-domain "$DENIS_CDN_DOMAIN" \
  --s3-bucket "$DENIS_S3_BUCKET"

rm -rf bundleTempDir
