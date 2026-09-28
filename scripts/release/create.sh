#!/usr/bin/env bash
set -euo pipefail
source tooling/scripts/release/common.sh
BASE_SHA=$(git -C source rev-parse HEAD)
validate_source source
[[ ! -e "source/$FILE" ]] || fail 'Source already contains this release document.'
require_new_release
# Check the handoff before creating anything.
api actions/workflows/run-release.yml | jq -e '.state == "active" and .path == ".github/workflows/run-release.yml"' >/dev/null

generate_notes
{
  printf '%s\n' '---' "releaseVersion: $VERSION" '---' '' "# Release $VERSION" '' '<!-- public-changelog:start -->' '' '## Initial release' ''
  # Nest GitHub headings under the release document's Initial release section.
  sed 's/^## /### /' "$RUNNER_TEMP/notes.md"
  printf '\n%s\n' '<!-- public-changelog:end -->'
} > "$RUNNER_TEMP/$FILE"
summary "Source: $BASE_SHA. Version, runtime, ancestry, workflows, and release conflicts checked."
if [[ "$DRY_RUN" == true ]]; then
  summary 'Preview only: no branch, tag, release, or builds created.'
  cat "$RUNNER_TEMP/$FILE" >> "$GITHUB_STEP_SUMMARY"
  exit 0
fi

require_new_release
base_tree=$(api "git/commits/$BASE_SHA" --jq .tree.sha)
jq -n --arg tree "$base_tree" --arg path "$FILE" --rawfile content "$RUNNER_TEMP/$FILE" \
  '{base_tree: $tree, tree: [{path: $path, mode: "100644", type: "blob", content: $content}]}' > "$RUNNER_TEMP/tree.json"
tree=$(api git/trees -X POST --input "$RUNNER_TEMP/tree.json" --jq .sha)
jq -n --arg tree "$tree" --arg parent "$BASE_SHA" --arg message "Prepare release $VERSION" \
  '{tree: $tree, parents: [$parent], message: $message}' > "$RUNNER_TEMP/commit.json"
PREPARED_SHA=$(api git/commits -X POST --input "$RUNNER_TEMP/commit.json" --jq .sha)
require_new_release
# Create the branch directly at the prepared commit; never advance or force a ref.
api git/refs -X POST -f "ref=refs/heads/$BRANCH" -f "sha=$PREPARED_SHA" >/dev/null
summary "Created $BRANCH at $PREPARED_SHA (source $BASE_SHA)."
verify_prepared
{
  echo "source-sha=$BASE_SHA"
  echo "prepared-sha=$PREPARED_SHA"
} >> "$GITHUB_OUTPUT"
