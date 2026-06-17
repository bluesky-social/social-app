#!/usr/bin/env bash
# Cloudflare Pages build script.
#
# Cloudflare Pages settings:
#   Build command:           ./pages_build.sh
#   Build output directory:  web-build
#   Environment variables:   NODE_VERSION=24  (or set via .nvmrc — Pages reads it)
#
# Local equivalent:
#   pnpm install && pnpm build-web && cp _redirects web-build/_redirects
#
# Deploy locally with:
#   ./pages_build.sh
#   npx wrangler pages deploy web-build --project-name=eurosky-web --branch=main
#
# --branch=main is REQUIRED to publish to the live eurosky-web.pages.dev.
# wrangler auto-detects the local git branch; anything other than the
# project's production branch (main) deploys as a Preview at a
# deployment-specific URL and the production root keeps the old build.
# Build needs node >=24.15 (see NODE_VERSION above); locally:
#   bash -lc '. "$HOME/.nvm/nvm.sh"; nvm use 24; ./pages_build.sh'
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
# browser resolves those against the current path and 404s back through the
# SPA `_redirects` rule, getting index.html as text/html for the JS/CSS
# requests. Rewrite to absolute root paths so any URL works.
sed -i'' -E 's#"static/#"/static/#g' web-build/index.html
# Clean up the BSD sed backup file if any
rm -f web-build/index.html-E

# SPA fallback: every unmatched route serves index.html so client-side routing
# works (e.g. /profile/foo, /post/bar). Cloudflare Pages reads _redirects from
# the build output directory.
cat > web-build/_redirects <<'EOF'
/*    /index.html    200
EOF

echo "Build complete. Output: web-build/"
