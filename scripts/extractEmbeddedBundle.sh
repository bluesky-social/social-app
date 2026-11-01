#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

# Copies the JS bundle and expo-updates manifest embedded in a native build out
# of its IPA or AAB, plus an embedded.json describing them. The native build
# workflows upload the result as the embedded-bundle-<platform>-<buildNumber>
# artifact, which the OTA pipeline uses as the base for Hermes delta compiles
# and bsdiff patches. Fetch it with .github/actions/fetch-embedded-bundle.
#
# Expects:
#   PLATFORM      ios or android
#   ARCHIVE       path to the .ipa (ios) or .aab (android)
#   OUT_DIR       directory to write into; must not exist yet
#   BUILD_NUMBER  CFBundleVersion (ios) or versionCode (android)
#   PROFILE       EAS build profile, used to look up the channel in eas.json
#   COMMIT        full SHA of the commit the build was made from
# Optional:
#   RUNTIME_VERSION  defaults to the package.json version (appVersion policy)
#   CHANNEL          defaults to the profile's channel in eas.json
#
# A build without an embedded app.manifest is skipped with a notice and leaves
# OUT_DIR untouched, so callers check for OUT_DIR/embedded.json.

PLATFORM=${PLATFORM:?}
ARCHIVE=${ARCHIVE:?}
OUT_DIR=${OUT_DIR:?}
BUILD_NUMBER=${BUILD_NUMBER:?}
PROFILE=${PROFILE:?}
COMMIT=${COMMIT:?}
RUNTIME_VERSION=${RUNTIME_VERSION:-$(jq -r '.version' package.json)}
CHANNEL=${CHANNEL:-$(jq -r --arg profile "$PROFILE" '.build[$profile].channel // empty' eas.json)}

fail() {
  echo "::error::$1"
  exit 1
}

case "$PLATFORM" in
  ios)
    bundle_file=main.jsbundle
    # Anchored on Payload/<App>.app/ so nested bundles (App Clips, extensions)
    # never match.
    bundle_pattern='^Payload/[^/]+\.app/main\.jsbundle$'
    manifest_pattern='^Payload/[^/]+\.app/EXUpdates\.bundle/app\.manifest$'
    ;;
  android)
    bundle_file=index.android.bundle
    bundle_pattern='^base/assets/index\.android\.bundle$'
    manifest_pattern='^base/assets/app\.manifest$'
    ;;
  *)
    fail "PLATFORM must be ios or android, got '$PLATFORM'"
    ;;
esac

[[ "$BUILD_NUMBER" =~ ^[0-9]+$ ]] || fail "BUILD_NUMBER must be numeric, got '$BUILD_NUMBER'"
[[ "$COMMIT" =~ ^[0-9a-f]{40}$ ]] || fail "COMMIT must be a full lowercase SHA, got '$COMMIT'"
[ -n "$RUNTIME_VERSION" ] || fail "Could not determine the runtime version"
[ -n "$CHANNEL" ] || fail "No channel for EAS profile '$PROFILE' in eas.json"
[ -f "$ARCHIVE" ] || fail "Archive not found: $ARCHIVE"
[ ! -e "$OUT_DIR" ] || fail "OUT_DIR already exists: $OUT_DIR"

entries=$(unzip -Z1 "$ARCHIVE")
manifest_entry=$(grep -E "$manifest_pattern" <<< "$entries" || true)
bundle_entry=$(grep -E "$bundle_pattern" <<< "$entries" || true)

# Expect at most one match each, so a layout change fails here instead of
# picking the wrong file.
for entry in "$manifest_entry" "$bundle_entry"; do
  if [ "$(grep -c . <<< "$entry")" -gt 1 ]; then
    fail "More than one entry in $ARCHIVE matches: $(tr '\n' ' ' <<< "$entry")"
  fi
done

if [ -z "$manifest_entry" ]; then
  # expo-updates writes app.manifest for every release build, so this means
  # the build has no expo-updates resources at all.
  echo "::notice::No embedded app.manifest in $ARCHIVE, so there is no embedded update to save."
  exit 0
fi

[ -n "$bundle_entry" ] || fail "$ARCHIVE has an app.manifest but no embedded bundle matching $bundle_pattern"

work_dir="$OUT_DIR.tmp"
rm -rf "$work_dir"
mkdir -p "$work_dir"
unzip -p "$ARCHIVE" "$manifest_entry" > "$work_dir/app.manifest"
unzip -p "$ARCHIVE" "$bundle_entry" > "$work_dir/$bundle_file"

update_id=$(jq -r '.id // empty' "$work_dir/app.manifest" | tr '[:upper:]' '[:lower:]')
[[ "$update_id" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]] ||
  fail "app.manifest in $ARCHIVE has no valid update id"

sha256=$(sha256sum "$work_dir/$bundle_file" | cut -d' ' -f1)

jq -n \
  --arg platform "$PLATFORM" \
  --arg updateId "$update_id" \
  --arg bundleFile "$bundle_file" \
  --arg sha256 "$sha256" \
  --arg runtimeVersion "$RUNTIME_VERSION" \
  --arg buildNumber "$BUILD_NUMBER" \
  --arg channel "$CHANNEL" \
  --arg profile "$PROFILE" \
  --arg commit "$COMMIT" \
  '{
    version: 1,
    platform: $platform,
    updateId: $updateId,
    bundleFile: $bundleFile,
    sha256: $sha256,
    runtimeVersion: $runtimeVersion,
    buildNumber: $buildNumber,
    channel: $channel,
    profile: $profile,
    commit: $commit
  }' > "$work_dir/embedded.json"

mv "$work_dir" "$OUT_DIR"

# Hermes bytecode starts with an 8-byte magic, then a little-endian uint32
# bytecode version. Logged to make base mismatches easy to spot later.
magic=$(od -An -tx1 -N8 "$OUT_DIR/$bundle_file" | tr -d ' \n')
if [ "$magic" = "c61fbc03c103191f" ]; then
  read -r b0 b1 b2 b3 < <(od -An -tu1 -j8 -N4 "$OUT_DIR/$bundle_file")
  echo "Embedded bundle is Hermes bytecode version $((b0 | b1 << 8 | b2 << 16 | b3 << 24))"
else
  echo "::warning::The embedded $bundle_file in $ARCHIVE is not Hermes bytecode, so it can't be a delta base."
fi

echo "Saved the embedded $PLATFORM bundle of build $BUILD_NUMBER to $OUT_DIR:"
cat "$OUT_DIR/embedded.json"
