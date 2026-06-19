#!/usr/bin/env bash
#
# Deploy a (branded) build to Cloudflare WORKERS: the web Worker (SPA +
# /geolocation + OG, services/web/cloudflare) and, for a confidential OAuth
# client, the assertion Worker (services/oauth/cloudflare).
#
# This is the Workers path, which folds OG + geolocation into one deploy
# (matching the Bunny edge feature set). It is distinct from scripts/bunny_build.sh,
# the pre-existing Cloudflare *Pages* build (static only, no OG/geolocation).
#
# Brand name + host come from src/config/brand.json (the same source the
# app and Workers read). This script only wires the deployment-specific bits:
# build env, Worker names, and the OAuth assertion URL.
#
# Prereqs: deps installed (pnpm install), `wrangler login`, and Node 24 (the
# repo + latest wrangler require it; on Node 22 set WRANGLER="npx wrangler@4.20.0").
#
# Usage:
#   OAUTH_ASSERTION_URL=https://oauth.<brand> [OAUTH_PRIVATE_JWK='{...}'] \
#     scripts/deploy-cloudflare.sh                 # confidential client (default)
#   scripts/deploy-cloudflare.sh --public-client   # no oauth Worker / key
#   SITE_URL=https://staging.<brand> scripts/deploy-cloudflare.sh   # override host
#   scripts/deploy-cloudflare.sh --no-build        # redeploy existing web-build/
#
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

WRANGLER="${WRANGLER:-npx wrangler}"
PUBLIC_CLIENT=0
BUILD=1
for arg in "$@"; do
  case "$arg" in
  --public-client) PUBLIC_CLIENT=1 ;;
  --no-build) BUILD=0 ;;
  -h | --help)
    sed -n '2,29p' "$0"
    exit 0
    ;;
  *)
    echo "unknown arg: $arg (try --help)" >&2
    exit 2
    ;;
  esac
done

# Brand identity from the single source. Slugify the display name for the CF
# Worker resource names (lowercase, alphanumeric + hyphens).
BRAND_SLUG="$(node -p 'require("./src/config/brand.json").name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")')"
PRIMARY_HOST="$(node -p 'require("./src/config/brand.json").hosts[0]')"
SITE_URL="${SITE_URL:-https://${PRIMARY_HOST}}"
WEB_WORKER="${BRAND_SLUG}-web"
OAUTH_WORKER="${BRAND_SLUG}-oauth-assertion"

echo "Brand '${BRAND_SLUG}' -> site ${SITE_URL}"
if [ "$PUBLIC_CLIENT" = 1 ]; then
  echo "(public OAuth client: skipping the oauth Worker)"
else
  : "${OAUTH_ASSERTION_URL:?confidential client needs OAUTH_ASSERTION_URL (the oauth Worker URL, e.g. a custom domain) or pass --public-client}"
fi

# 1. OAuth assertion Worker first, so the web build can point at it ------------
if [ "$PUBLIC_CLIENT" = 0 ]; then
  echo "==> Deploying ${OAUTH_WORKER}"
  (cd services/oauth/cloudflare && $WRANGLER deploy --name "$OAUTH_WORKER")
  if [ -n "${OAUTH_PRIVATE_JWK:-}" ]; then
    echo "==> Setting OAUTH_PRIVATE_JWK secret"
    (cd services/oauth/cloudflare &&
      printf '%s' "$OAUTH_PRIVATE_JWK" |
      $WRANGLER secret put OAUTH_PRIVATE_JWK --name "$OAUTH_WORKER")
  else
    echo "    NOTE: set the signing key once (not in env):"
    echo "    (cd services/oauth/cloudflare && $WRANGLER secret put OAUTH_PRIVATE_JWK --name $OAUTH_WORKER)"
  fi
fi

# 2. Build the web bundle (Cloudflare env; no Plausible, no _redirects) --------
if [ "$BUILD" = 1 ]; then
  echo "==> Building web bundle"
  export EXPO_PUBLIC_ENABLE_GEOLOCATION=true
  # /geolocation is served by the web Worker on the main host.
  export EXPO_PUBLIC_GEOLOCATION_URL="$SITE_URL"
  export EXPO_PUBLIC_ENABLE_LIVE_EVENTS=false
  export EXPO_PUBLIC_ENABLE_APP_CONFIG=false
  export EXPO_PUBLIC_ENABLE_METRICS=false
  export EXPO_PUBLIC_OAUTH_BASE_URL="$SITE_URL"
  if [ "$PUBLIC_CLIENT" = 0 ]; then
    export EXPO_PUBLIC_OAUTH_ASSERTION_URL="$OAUTH_ASSERTION_URL"
  fi
  # build-web = expo export:web + post-web-build + gen-oauth-metadata (emits
  # oauth-client-metadata.json into web-build/). No Plausible env -> disabled.
  pnpm build-web
  # Absolute asset paths so deep routes (/profile/x/post/y) load under the
  # Worker SPA fallback. (_redirects is unneeded: wrangler not_found_handling
  # does the SPA routing.)
  sed -i'' -E 's#"static/#"/static/#g' web-build/index.html
  rm -f web-build/index.html-E
fi
[ -d web-build ] || {
  echo "no web-build/ - run without --no-build to build it" >&2
  exit 1
}

# 3. Deploy the web Worker (serves web-build/ + /geolocation + OG) -------------
echo "==> Deploying ${WEB_WORKER}"
(cd services/web/cloudflare && $WRANGLER deploy --name "$WEB_WORKER")

echo ""
echo "Done. Attach your domain(s):"
echo "  web:   ${WEB_WORKER}   -> ${SITE_URL}"
if [ "$PUBLIC_CLIENT" = 0 ]; then
  echo "  oauth: ${OAUTH_WORKER} -> ${OAUTH_ASSERTION_URL}"
fi
