#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

error() {
  echo "::error::$*"
  exit 1
}

is_version() {
  [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
}

is_build_number() {
  [[ "$1" =~ ^[1-9][0-9]*$ ]]
}

if [ "${CHANNEL:-testflight}" != "production" ]; then
  if [ -n "${INPUT_RUNTIME_VERSION:-}" ] && ! is_version "$INPUT_RUNTIME_VERSION"; then
    error "runtimeVersion must use x.y.z format"
  fi
  echo "runtime-version=${INPUT_RUNTIME_VERSION:-}" >> "$GITHUB_OUTPUT"
  echo "ios-build-number=" >> "$GITHUB_OUTPUT"
  echo "android-version-code=" >> "$GITHUB_OUTPUT"
  exit 0
fi

[ "${GITHUB_REF_TYPE:-}" = "tag" ] ||
  error "Production OTAs must be dispatched from an immutable OTA tag, not '${GITHUB_REF_NAME:-unknown}'."

if [[ ! "${GITHUB_REF_NAME:-}" =~ ^ota-([0-9]+\.[0-9]+\.[0-9]+)-([1-9][0-9]*)$ ]]; then
  error "Production OTA tag must use ota-<version>-<sequence>, for example ota-1.131.1-1."
fi

tag_version="${BASH_REMATCH[1]}"
sequence="${BASH_REMATCH[2]}"
manifest=".ota/${tag_version}-${sequence}.json"
[ -f "$manifest" ] || error "The OTA tag must contain its reviewed manifest at $manifest."

jq -e '
  type == "object" and
  (keys | sort) == ["androidVersionCode", "iosBuildNumber", "runtimeVersion"] and
  (.runtimeVersion | type == "string") and
  (.iosBuildNumber | type == "number" and floor == .) and
  (.androidVersionCode | type == "number" and floor == .)
' "$manifest" >/dev/null || error "$manifest has an invalid schema."

runtime_version="$(jq -r '.runtimeVersion' "$manifest")"
ios_build_number="$(jq -r '.iosBuildNumber' "$manifest")"
android_version_code="$(jq -r '.androidVersionCode' "$manifest")"
package_version="$(jq -r '.version' package.json)"

is_version "$runtime_version" || error "Manifest runtimeVersion must use x.y.z format."
is_build_number "$ios_build_number" || error "Manifest iosBuildNumber must be a positive integer."
is_build_number "$android_version_code" || error "Manifest androidVersionCode must be a positive integer."
[ "$runtime_version" = "$tag_version" ] ||
  error "Manifest runtimeVersion '$runtime_version' does not match OTA tag version '$tag_version'."
[ "$runtime_version" = "$package_version" ] ||
  error "Manifest runtimeVersion '$runtime_version' does not match package.json version '$package_version'."

# The native release tag is both the fingerprint baseline and proof that this
# OTA was built on top of the native release it targets.
git rev-parse --verify --quiet "refs/tags/$runtime_version^{commit}" >/dev/null ||
  error "Native release tag '$runtime_version' does not exist."
git merge-base --is-ancestor "$runtime_version" HEAD ||
  error "OTA commit $(git rev-parse HEAD) is not descended from native release $runtime_version."

echo "Production OTA target validated:"
echo "  source: $(git rev-parse HEAD) ($GITHUB_REF_NAME)"
echo "  runtime: $runtime_version"
echo "  iOS build: $ios_build_number"
echo "  Android build: $android_version_code"

echo "runtime-version=$runtime_version" >> "$GITHUB_OUTPUT"
echo "ios-build-number=$ios_build_number" >> "$GITHUB_OUTPUT"
echo "android-version-code=$android_version_code" >> "$GITHUB_OUTPUT"
