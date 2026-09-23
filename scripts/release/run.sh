#!/usr/bin/env bash
set -euo pipefail
source tooling/scripts/release/common.sh
[[ "$PREPARED_SHA" =~ ^[0-9a-f]{40}$ ]] || fail 'Expected full prepared SHA.'
[[ "$(git -C source rev-parse HEAD)" == "$PREPARED_SHA" ]] || fail 'Checkout does not match prepared SHA.'
[[ "$(git -C source show -s --format=%P HEAD)" == "$BASE_SHA" ]] || fail 'Prepared commit must have exactly the selected source as its parent.'
[[ "$(git -C source diff-tree --no-commit-id --name-status -r HEAD)" == $'A\t'"$FILE" ]] || fail 'Prepared commit must only add the release document.'
[[ "$(git -C source ls-tree HEAD -- "$FILE" | cut -d ' ' -f 1)" == 100644 ]] || fail 'Release document must be a regular file.'
validate_source prepared
verify_prepared
# Validate all reservations before any write or dispatch.
for platform in ios android web; do
  reservation=$(ref_sha "heads/release-build-$VERSION-$platform")
  [[ -z "$reservation" || "$reservation" == "$PREPARED_SHA" ]] || fail "Conflicting $platform build reservation."
done
summary "Validated $BRANCH at $PREPARED_SHA (source $BASE_SHA)."
generate_notes
verify_prepared
if [[ -z "$(ref_sha "tags/$VERSION")" ]]; then
  api git/refs -X POST -f "ref=refs/tags/$VERSION" -f "sha=$PREPARED_SHA" >/dev/null
  summary "Created tag $VERSION at $PREPARED_SHA."
fi
REQUIRE_TAG=true
verify_prepared
if [[ "$RELEASES" == '[]' ]]; then
  gh release create "$VERSION" --verify-tag --target "$PREPARED_SHA" --draft \
    --title "Release $VERSION" --notes-file "$RUNNER_TEMP/notes.md"
else
  gh release edit "$VERSION" --notes-file "$RUNNER_TEMP/notes.md"
fi
REQUIRE_DRAFT=true
verify_prepared
summary "Draft notes updated for $VERSION."

if [[ "$START_BUILDS" != true ]]; then
  summary 'Build dispatch disabled. Existing builds were not changed.'
  exit 0
fi
platforms=(ios android web)
for index in 0 1 2; do
  platform=${platforms[$index]}
  workflow=${WORKFLOWS[$index]}
  verify_prepared
  reservation="heads/release-build-$VERSION-$platform"
  if [[ -n "$(ref_sha "$reservation")" ]]; then
    summary "$platform dispatch was previously reserved. No new build started; inspect Actions and rerun failed build jobs if needed."
    continue
  fi
  api "actions/workflows/$workflow" | jq -e '.state == "active"' >/dev/null
  # Reserve before dispatch: a timeout must never cause an automatic duplicate build.
  api git/refs -X POST -f "ref=refs/$reservation" -f "sha=$PREPARED_SHA" >/dev/null
  summary "$platform dispatch reserved for $PREPARED_SHA. If no run link follows, inspect Actions before recovery."
  verify_prepared
  case "$platform" in
    ios) inputs='{"profile":"production","submit":"false","testFlightGroup":"none"}' ;;
    android) inputs='{"profile":"production","submit":"false"}' ;;
    web) inputs='{}' ;;
  esac
  jq -n --arg ref "$VERSION" --arg sha "$PREPARED_SHA" --argjson inputs "$inputs" \
    '{ref: $ref, inputs: ($inputs + {sourceRef: $sha}), return_run_details: true}' > "$RUNNER_TEMP/dispatch.json"
  api "actions/workflows/$workflow/dispatches" -X POST --input "$RUNNER_TEMP/dispatch.json" > "$RUNNER_TEMP/run.json"
  jq -e '.workflow_run_id > 0 and (.html_url | type == "string")' "$RUNNER_TEMP/run.json" >/dev/null || fail 'Dispatch outcome uncertain; inspect Actions before retrying.'
  summary "$platform build: $(jq -r .html_url "$RUNNER_TEMP/run.json"). Dispatched does not mean successful."
done
