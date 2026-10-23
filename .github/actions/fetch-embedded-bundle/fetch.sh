#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

# Downloads and verifies the embedded-bundle-<platform>-<buildNumber> artifact
# into DESTINATION, then writes the action's outputs. See action.yml.
#
# Expects PLATFORM, BUILD_NUMBER, DESTINATION and GH_TOKEN, plus the runner's
# GITHUB_REPOSITORY, GITHUB_REPOSITORY_ID, GITHUB_OUTPUT and RUNNER_TEMP.

PLATFORM=${PLATFORM:?}
BUILD_NUMBER=${BUILD_NUMBER:-}
DESTINATION=${DESTINATION:?}

case "$PLATFORM" in
  ios | android) ;;
  *)
    echo "::error::platform must be ios or android, got '$PLATFORM'"
    exit 1
    ;;
esac

if [ -e "$DESTINATION" ] && [ -n "$(ls -A "$DESTINATION")" ]; then
  echo "::error::destination $DESTINATION is not empty"
  exit 1
fi

name="embedded-bundle-$PLATFORM-$BUILD_NUMBER"

not_found() {
  echo "::warning::No usable $name artifact: $1"
  echo "found=false" >> "$GITHUB_OUTPUT"
  exit 0
}

[[ "$BUILD_NUMBER" =~ ^[0-9]+$ ]] || not_found "build number '$BUILD_NUMBER' is not numeric"

work_dir=$(mktemp -d "${RUNNER_TEMP:-/tmp}/embedded-bundle.XXXXXX")
trap 'rm -rf "$work_dir"' EXIT

# Trust only runs whose head is this repository, never a fork's pull request
# run. Don't filter on branch: production builds run from release tags.
# shellcheck disable=SC2016 # $ENV is jq's, not the shell's
if ! artifact=$(
  gh api "repos/$GITHUB_REPOSITORY/actions/artifacts?name=$name&per_page=100" \
    --jq '[.artifacts[] | select(
      .expired == false and
      .workflow_run.head_repository_id == ($ENV.GITHUB_REPOSITORY_ID | tonumber)
    )] | max_by(.created_at) // empty
      | "\(.archive_download_url) \(.workflow_run.id)"' \
    2> "$work_dir/api-error"
); then
  not_found "listing artifacts failed: $(cat "$work_dir/api-error")"
fi
[ -n "$artifact" ] || not_found "none found (never uploaded, or expired after 90 days)"
read -r url run_id <<< "$artifact"

if ! curl -fsSL -H "Authorization: Bearer $GH_TOKEN" -o "$work_dir/artifact.zip" "$url"; then
  not_found "download from run $run_id failed"
fi
unzip -q "$work_dir/artifact.zip" -d "$work_dir/files" || not_found "could not unzip the artifact from run $run_id"

files="$work_dir/files"
jq -e \
  --arg platform "$PLATFORM" \
  --arg buildNumber "$BUILD_NUMBER" \
  '.version == 1 and
    .platform == $platform and
    .buildNumber == $buildNumber and
    (.bundleFile | type == "string" and test("^[A-Za-z0-9][A-Za-z0-9._-]*$")) and
    (.sha256 | type == "string")' \
  "$files/embedded.json" > /dev/null 2>&1 ||
  not_found "embedded.json from run $run_id is missing or doesn't match"

bundle_file=$(jq -r '.bundleFile' "$files/embedded.json")
[ -f "$files/$bundle_file" ] || not_found "$bundle_file is missing from run $run_id's artifact"
sha256=$(sha256sum "$files/$bundle_file" | cut -d' ' -f1)
[ "$sha256" = "$(jq -r '.sha256' "$files/embedded.json")" ] ||
  not_found "$bundle_file from run $run_id doesn't match its sha256"

mkdir -p "$DESTINATION"
cp -R "$files/." "$DESTINATION/"
dir=$(cd "$DESTINATION" && pwd)
update_id=$(jq -r '.updateId' "$dir/embedded.json")

echo "Fetched $name from run $run_id:"
cat "$dir/embedded.json"
{
  echo "found=true"
  echo "dir=$dir"
  echo "bundle-path=$dir/$bundle_file"
  echo "update-id=$update_id"
} >> "$GITHUB_OUTPUT"
