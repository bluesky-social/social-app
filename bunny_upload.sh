#!/usr/bin/env bash
# Eurosky fork: upload the static web build to a Bunny.net Edge Storage zone.
#
# Reads from the environment (or ./.env if not already set):
#   BUNNY_STORAGE_ZONE      full base URL incl. zone name, e.g.
#                           https://storage.bunnycdn.com/eurosky-app
#   BUNNY_STORAGE_PASSWORD  storage zone password (sent as the AccessKey header)
#
# Usage: ./bunny_upload.sh [build-dir]     (default: web-build)
#
# This only uploads files. It does not delete stale objects or purge the pull
# zone cache - that comes with the CI step. Hashed assets are immutable so
# leftover old chunks are harmless; index.html overwrites in place.
set -euo pipefail

DIR="${1:-web-build}"

# Load .env only if the vars aren't already provided by the environment (CI).
if [[ -z "${BUNNY_STORAGE_ZONE:-}" || -z "${BUNNY_STORAGE_PASSWORD:-}" ]]; then
  if [[ -f .env ]]; then
    set -a; . ./.env; set +a
  fi
fi
: "${BUNNY_STORAGE_ZONE:?set BUNNY_STORAGE_ZONE}"
: "${BUNNY_STORAGE_PASSWORD:?set BUNNY_STORAGE_PASSWORD}"

BASE="${BUNNY_STORAGE_ZONE%/}" # strip any trailing slash
[[ -d "$DIR" ]] || { echo "no $DIR/ - build first (./pages_build.sh)"; exit 1; }

total=$(find "$DIR" -type f | wc -l | tr -d ' ')
echo "Uploading $total files from $DIR/ -> $BASE ..."

export BASE BUNNY_STORAGE_PASSWORD DIR

# Upload a single file; print only on failure. Bunny returns 201 on success.
upload_one() {
  local file="$1"
  local rel="${file#"$DIR"/}"
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' -X PUT \
    "$BASE/$rel" \
    -H "AccessKey: $BUNNY_STORAGE_PASSWORD" \
    --data-binary @"$file") || { echo "ERR   $rel (curl failed)"; return 1; }
  if [[ "$code" != "201" && "$code" != "200" ]]; then
    echo "FAIL  $code  $rel"
    return 1
  fi
}
export -f upload_one

fails=0
find "$DIR" -type f -print0 \
  | xargs -0 -P 8 -I{} bash -c 'upload_one "$@"' _ {} \
  || fails=1

if [[ "$fails" != "0" ]]; then
  echo "Completed WITH ERRORS (see FAIL/ERR lines above)." >&2
  exit 1
fi
echo "Done: uploaded $total files to $BASE"

# Optional: purge the pull zone cache so the new build is served immediately.
# Needs the account-level API key (NOT the storage password) and the pull
# zone id. Skipped silently if either is missing (e.g. plain local upload).
if [[ -n "${BUNNY_API_KEY:-}" && -n "${BUNNY_PULLZONE_ID:-}" ]]; then
  echo "Purging pull zone $BUNNY_PULLZONE_ID cache ..."
  pcode=$(curl -sS -o /dev/null -w '%{http_code}' -X POST \
    "https://api.bunny.net/pullzone/${BUNNY_PULLZONE_ID}/purgeCache" \
    -H "AccessKey: ${BUNNY_API_KEY}") || { echo "purge: curl failed" >&2; exit 1; }
  if [[ "$pcode" == "204" || "$pcode" == "200" ]]; then
    echo "Purged."
  else
    echo "purge returned HTTP $pcode" >&2
    exit 1
  fi
else
  echo "(skipping cache purge: set BUNNY_API_KEY + BUNNY_PULLZONE_ID to enable)"
fi
