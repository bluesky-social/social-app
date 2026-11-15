#!/usr/bin/env bash
set -euo pipefail

fail() { echo "::error::$*" >&2; exit 1; }
summary() { echo "$*" | tee -a "$GITHUB_STEP_SUMMARY"; }
api() { gh api "repos/$GH_REPO/$@"; }

[[ "$VERSION" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]] || fail 'Expected strict x.y.z version.'
BRANCH="release-$VERSION"
FILE="RELEASE-$VERSION.md"
WORKFLOWS=(build-submit-ios.yml build-submit-android.yml build-and-push-bskyweb-aws.yaml)

# Empty results mean absent; authentication and network failures still abort.
ref_sha() {
  api "git/matching-refs/$1" | jq -er --arg ref "refs/$1" '
    [.[] | select(.ref == $ref)] |
    if length == 0 then "" elif length == 1 and .[0].object.type == "commit"
    then .[0].object.sha else error("Unexpected ref type or count") end'
}

releases() {
  api 'releases?per_page=100' --paginate --slurp |
    jq -c --arg tag "$VERSION" '[.[][] | select(.tag_name == $tag)]'
}

validate_source() {
  [[ "$BASE_SHA" =~ ^[0-9a-f]{40}$ ]] || fail 'Expected full source SHA.'
  git -C source merge-base --is-ancestor "$BASE_SHA" "$TOOLING_SHA" || fail 'Source is not in the trusted main history.'
  [[ "$(git -C source rev-parse --is-shallow-repository)" == false ]] || fail 'Full source history is required.'
  [[ -z "$(git -C source status --porcelain)" ]] || fail 'Source checkout is dirty.'
  node tooling/scripts/release/validate.cjs source "$VERSION" "$1"
  api '' | jq -e '.permissions.push == true' >/dev/null || fail 'Cannot establish visibility of all draft releases.'
  for workflow in "${WORKFLOWS[@]}"; do
    cmp "tooling/.github/workflows/$workflow" "source/.github/workflows/$workflow" || fail "Unreviewed build workflow: $workflow"
    api "actions/workflows/$workflow" | jq -e --arg path ".github/workflows/$workflow" \
      '.state == "active" and .path == $path' >/dev/null || fail "Build workflow is not active: $workflow"
  done
}

require_new_release() {
  [[ -z "$(ref_sha "heads/$BRANCH")" ]] || fail 'Release branch already exists; use Run Release for recovery.'
  [[ -z "$(ref_sha "tags/$VERSION")" ]] || fail 'Release tag already exists.'
  [[ "$(releases)" == '[]' ]] || fail 'GitHub Release already exists.'
  for platform in ios android web; do
    [[ -z "$(ref_sha "heads/release-build-$VERSION-$platform")" ]] || fail 'Build reservation already exists.'
  done
}

verify_prepared() {
  [[ "$(ref_sha "heads/$BRANCH")" == "$PREPARED_SHA" ]] || fail 'Release branch moved.'
  local tag
  tag=$(ref_sha "tags/$VERSION")
  [[ -z "$tag" || "$tag" == "$PREPARED_SHA" ]] || fail 'Release tag points to another commit.'
  if [[ "${REQUIRE_TAG:-false}" == true ]]; then
    [[ "$tag" == "$PREPARED_SHA" ]] || fail 'Release tag is missing.'
  fi
  RELEASES=$(releases)
  jq -e --arg sha "$PREPARED_SHA" --arg name "Release $VERSION" '
    length == 0 or (length == 1 and .[0].draft == true and
    .[0].prerelease == false and .[0].name == $name and .[0].target_commitish == $sha)
  ' <<< "$RELEASES" >/dev/null || fail 'Existing release is published or has a different identity.'
  if [[ "${REQUIRE_DRAFT:-false}" == true ]]; then
    [[ "$(jq length <<< "$RELEASES")" == 1 ]] || fail 'Draft release is missing.'
  fi
}

generate_notes() {
  local previous_tag
  previous_tag=$(git -C source tag --merged "$BASE_SHA" --sort=-version:refname |
    awk -v version="$VERSION" '/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/ && $0 != version {print; exit}')
  local args=(-f "tag_name=$VERSION" -f "target_commitish=$BASE_SHA")
  if [[ -n "$previous_tag" ]]; then args+=(-f "previous_tag_name=$previous_tag"); fi
  api releases/generate-notes -X POST "${args[@]}" --jq .body > "$RUNNER_TEMP/notes.md"
  [[ -s "$RUNNER_TEMP/notes.md" ]] || fail 'GitHub generated empty notes.'
}
