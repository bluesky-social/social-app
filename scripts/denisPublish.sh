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

# Accept a caller-supplied bundle version so that a dual-write publishes the SAME
# version to every origin. When this script and bundleUpdate.sh each called
# `date +%s` independently they produced versions seconds apart for identical
# bytes -- observed 1785102575 (denis) vs 1785102614 (ota1) for one commit. Since
# the version is part of the asset URL path, the two origins then served
# manifests pointing at paths only one of them had, so the manifest and its
# assets had to come from the same origin or the fetch 404s. Falling back to
# `date +%s` keeps standalone callers (PR previews, `pnpm make-deploy-bundle`)
# working unchanged.
BUNDLE_VERSION="${BUNDLE_VERSION:-$(date +%s)}"
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
