#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

DENIS_CDN_DOMAIN="${DENIS_CDN_DOMAIN:-updates.bsky.app}"
DENIS_S3_BUCKET="${DENIS_S3_BUCKET:-bsky-denis-ota-prod}"
PUBLISH_MODE="${DENIS_PUBLISH_MODE:-legacy}"

if [ "$PUBLISH_MODE" = "structured" ]; then
  RELEASE_FILE="${1:?Usage: denisPublish.sh ota-export.json}"
  node scripts/ota/validate-release.mjs --release-file "$RELEASE_FILE"
  PACKAGED_RELEASE_FILE="$(node scripts/bundleUpdate.js --release-file "$RELEASE_FILE")"
  node scripts/ota/validate-release.mjs --release-file "$PACKAGED_RELEASE_FILE"
  denis publish --release-file "$PACKAGED_RELEASE_FILE" --cdn-domain "$DENIS_CDN_DOMAIN" --s3-bucket "$DENIS_S3_BUCKET"
  # Retain the unique packaged output for debugging and idempotent CLI retries.
elif [ "$PUBLISH_MODE" = "legacy" ]; then
  : "${CHANNEL_NAME:?CHANNEL_NAME is required}"
  : "${BSKY_IOS_BUILD_NUMBER:?BSKY_IOS_BUILD_NUMBER is required}"
  : "${BSKY_ANDROID_VERSION_CODE:?BSKY_ANDROID_VERSION_CODE is required}"
  : "Legacy mode is retained by scripts/denisPublishLegacy.sh during rollout"
  exec bash scripts/denisPublishLegacy.sh
else
  echo "DENIS_PUBLISH_MODE must be structured or legacy" >&2
  exit 1
fi
