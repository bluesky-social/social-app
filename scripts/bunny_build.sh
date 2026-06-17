#!/usr/bin/env bash
# Build the static web bundle (web-build/) for the Bunny deploy.
#
# Paired with scripts/bunny_upload.sh; run by the Bunny deploy workflows
# (.github/workflows/deploy-web-bunny.yml and deploy-web-staging-bunny.yml).
# The Cloudflare *Workers* path builds inline in scripts/deploy-cloudflare.sh
# and does NOT use this script.
#
# Needs Node >=24.15. Local run:
#   bash -lc '. "$HOME/.nvm/nvm.sh"; nvm use 24; ./scripts/bunny_build.sh'
set -euo pipefail

# Eurosky defaults for web builds. These can still be overridden by explicitly
# exporting different values in CI or local shells.
# Geolocation stays ON, served first-party from Bunny (see services/geolocation/)
# instead of Bluesky's CORS-locked ip.bsky.app. It decides which regional
# moderation labelers are required; without it the app fail-closes and
# subscribes ALL of them for every user.
: "${EXPO_PUBLIC_ENABLE_GEOLOCATION:=true}"
: "${EXPO_PUBLIC_GEOLOCATION_URL:=https://ip.mu.social}"
: "${EXPO_PUBLIC_ENABLE_LIVE_EVENTS:=false}"
: "${EXPO_PUBLIC_ENABLE_APP_CONFIG:=false}"
: "${EXPO_PUBLIC_PLAUSIBLE_DOMAIN:=mu.social}"
# Route analytics through the first-party Bunny proxy (see services/plausible/)
# so ad/content blockers that blocklist plausible.io stop dropping events. The
# tracker posts to ${EXPO_PUBLIC_PLAUSIBLE_API_HOST}/api/event, so this must
# include the scheme (unlike the bare PLAUSIBLE_DOMAIN above).
: "${EXPO_PUBLIC_PLAUSIBLE_API_HOST:=https://events.mu.social}"
export EXPO_PUBLIC_ENABLE_GEOLOCATION
export EXPO_PUBLIC_GEOLOCATION_URL
export EXPO_PUBLIC_ENABLE_LIVE_EVENTS
export EXPO_PUBLIC_ENABLE_APP_CONFIG
export EXPO_PUBLIC_PLAUSIBLE_DOMAIN
export EXPO_PUBLIC_PLAUSIBLE_API_HOST

# Use frozen lockfile in CI (mirrors GitHub Actions); allow regeneration locally.
if [[ -n "${CI:-}" ]]; then
  pnpm install --frozen-lockfile
else
  pnpm install
fi

# Eurosky: extract + compile i18n catalogs before bundling. Upstream relies
# on a nightly CI job for this; the fork deploys without it, so without this
# step any fork-added/changed string ships as its raw message ID (the
# compiled catalogs would be stale). build-web bundles the compiled output.
pnpm intl:build

# Build the web bundle. Output lands in ./web-build/.
pnpm build-web

# Webpack injects script/css tags with RELATIVE paths (`src="static/..."`).
# When a user opens a non-root URL like /profile/x/post/y in a fresh tab, the
# browser resolves those against the current path and 404s; Bunny's SPA fallback
# (storage-zone "404 file path" serves index.html) then returns HTML for the
# JS/CSS requests. Rewrite to absolute root paths so any URL works.
sed -i'' -E 's#"static/#"/static/#g' web-build/index.html
# Clean up the BSD sed backup file if any
rm -f web-build/index.html-E

echo "Build complete. Output: web-build/"
