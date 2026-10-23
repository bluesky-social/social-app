#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

# Exports the iOS and Android OTA bundles into dist/, in the layout that
# scripts/bundleUpdate.js and the Sentry source map upload read.
#
# Each platform gets its own `expo export`, so that its Hermes compile can use
# that platform's embedded bundle as a delta base (see hermescDelta.sh). That
# keeps bsdiff patches from the embedded bundle in the tens of KB rather than
# ~1.6 MB. expo export clears its output directory and writes a metadata.json
# for just the platforms it exported, so the two exports are merged here.
#
# Optional:
#   HERMES_BASE_BYTECODE_IOS, HERMES_BASE_BYTECODE_ANDROID
#     The embedded bundle (Hermes bytecode) of the native build the update
#     targets. Without one, that platform compiles normally. A base hermesc
#     can't use falls back to a normal compile with a warning.

cd "$(dirname "$0")/.."
OUT_DIR=dist

warn() {
  if [ "${GITHUB_ACTIONS:-}" = true ]; then
    echo "::warning title=Hermes delta compile::$1"
  else
    echo "warning: $1" >&2
  fi
}

work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT

# The hermesc expo export would otherwise use: same lookup order as
# importHermesCommandFromProject in @expo/metro-config's exportHermes.js.
hermesc_real=$(
  node -e '
    const fs = require("fs")
    const path = require("path")
    const exe = {darwin: "osx-bin/hermesc", linux: "linux64-bin/hermesc"}[process.platform]
    const rnRoot = path.dirname(
      require.resolve("react-native/package.json", {paths: [process.cwd()]}),
    )
    const compilerRoot = path.dirname(
      require.resolve("hermes-compiler/package.json", {paths: [rnRoot]}),
    )
    const found = [
      path.join(rnRoot, "ReactAndroid/hermes-engine/build/hermes/bin/hermesc"),
      path.join(compilerRoot, "hermesc", exe),
      path.join(rnRoot, "sdks/hermesc", exe),
    ].find(p => fs.existsSync(p))
    if (!found) throw new Error("Cannot find the hermesc executable")
    console.log(found)
  '
)

# Expo runs <REACT_NATIVE_OVERRIDE_HERMES_DIR>/build/bin/hermesc.
override_dir="$work_dir/hermesc-override"
mkdir -p "$override_dir/build/bin"
ln -s "$PWD/scripts/hermescDelta.sh" "$override_dir/build/bin/hermesc"

for platform in ios android; do
  case "$platform" in
    ios) base=${HERMES_BASE_BYTECODE_IOS:-} ;;
    android) base=${HERMES_BASE_BYTECODE_ANDROID:-} ;;
  esac
  status_file="$work_dir/hermes-$platform.status"
  touch "$status_file"

  echo "Exporting $platform..."
  (
    if [ -n "$base" ]; then
      export REACT_NATIVE_OVERRIDE_HERMES_DIR="$override_dir"
      export HERMESC_REAL="$hermesc_real"
      export HERMES_BASE_BYTECODE="$base"
      export HERMES_DELTA_STATUS_FILE="$status_file"
    fi
    pnpm exec expo export \
      --platform "$platform" \
      --output-dir "$work_dir/$platform" \
      --source-maps
  )

  if [ -z "$base" ]; then
    echo "$platform: no delta base given, compiled normally"
  elif grep -q '^fallback' "$status_file"; then
    warn "$platform: $(grep '^fallback' "$status_file" | head -1). Patches for this update will be larger."
  elif grep -q '^delta' "$status_file"; then
    echo "$platform: $(grep '^delta' "$status_file" | head -1)"
  else
    warn "$platform: the hermesc wrapper never ran, so Expo may have changed how it finds hermesc. Compiled without a base."
  fi
done

jq -s '.[0] * {fileMetadata: .[1].fileMetadata}' \
  "$work_dir/ios/metadata.json" "$work_dir/android/metadata.json" \
  > "$work_dir/metadata.json"
jq -e '.fileMetadata.ios.bundle and .fileMetadata.android.bundle' \
  "$work_dir/metadata.json" > /dev/null

# Bundles, source maps and assets have content-hashed names, so apart from
# metadata.json the two trees only overlap in identical files.
rm -rf "$OUT_DIR"
mv "$work_dir/ios" "$OUT_DIR"
cp -R "$work_dir/android/." "$OUT_DIR/"
mv "$work_dir/metadata.json" "$OUT_DIR/metadata.json"
echo "Exported both platforms to $OUT_DIR"
