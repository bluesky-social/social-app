#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

# Publishes the just-exported Expo bundle to the denis OTA service (S3) via the
# `denis publish` CLI.
# Expects: the `denis` binary on PATH (setup-denis action), ambient AWS creds
# (configure-aws-credentials OIDC), and BSKY_IOS_BUILD_NUMBER /
# BSKY_ANDROID_VERSION_CODE from the use-build-number wrapper.

# Set when bundleTempDir was assembled by a separate job and handed over as an
# artifact, as the PR OTA flow does so the bundle can be built in parallel with
# the fingerprint check. Without it, assemble the directory from ./dist here.
if [ -n "${SKIP_BUNDLE_ASSEMBLY:-}" ]; then
  echo "Using pre-assembled bundle directory..."
  if [ ! -f bundleTempDir/metadata.json ]; then
    echo "bundleTempDir/metadata.json is missing; nothing to publish" >&2
    exit 1
  fi
else
  rm -rf bundleTempDir

  echo "Assembling bundle directory..."
  node scripts/bundleUpdate.js
fi

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
