# eurosky-og-worker

Bunny.net Edge Script that injects per-route Open Graph / Twitter card metadata
into the static web build, so a shared post or profile link unfurls with that
post's text and image instead of the one generic default card.

## Why it matters

The web app is a static SPA (uploaded to Bunny Edge Storage by
`../bunny_upload.sh`, served from the `mu.social` pull zone). A static SPA has
no per-route server rendering, so every link - a post, a profile, the homepage -
unfurls with the single default card baked into `../web/index.html`.

Upstream Bluesky avoids this by serving its HTML through the Go `bskyweb` server,
which queries the appview and templates per-post / per-profile `og:*` tags (see
`../bskyweb/templates/post.html` and `profile.html`). That server is not in our
request path. This script reproduces that metadata role at the Bunny edge.

It only sets metadata. The `og:image` reuses media that already exists (post
thumbnails, profile banners, avatars); there is no card-image generation here,
matching what `bskyweb` does for posts and profiles.

## How it works

Unlike the other services (`services/geolocation`, `services/plausible`,
`services/oauth`), which are standalone services on their own subdomains, this one
runs as **middleware on the existing `mu.social` pull zone**. It uses
`BunnySDK.net.http.servePullZone(...).onOriginResponse(...)`: the origin (the
static build) is served as normal, and this script inspects the response on the
way out.

For an HTML response on a handled route it:

1. fetches the post/profile from the appview
   (`app.bsky.feed.getPostThread` / `app.bsky.actor.getProfile`),
2. strips the default `og:*` / `twitter:*` / `<title>` tags from `<head>`,
3. injects per-route tags built from that data, and
4. lets the pull zone cache the result per-URL.

### SPA fallback status (important)

Deep links (`/profile/...`, `/post/...`) are not real files in storage. The
storage zone is configured with **404 File path = `/index.html`**, which serves
the SPA shell for unknown paths - but with a **404 status code**. Browsers
render the body regardless, so the app works; however link-preview crawlers and
search bots **ignore non-200 responses**, so an enriched 404 produces no card
and gets no SEO. This script therefore **rewrites these SPA-shell 404s to 200**
for all HTML routes (whether or not they are enriched). The storage `404 File
path` setting is a required dependency - without it there is no shell to serve.

Routes handled (mirrors `../bskyweb/cmd/bskyweb/server.go`):

```
/profile/<actor>               -> profile card
/profile/<actor>/post/<rkey>   -> post card
```

`<actor>` may be a handle or a DID. Every other request - assets, the homepage,
unmatched routes - passes through untouched and keeps the static default card.

**It fails open.** Any appview/parse/runtime error, or a not-found / blocked
post, returns the unmodified origin response, which still carries the static
default card from `index.html`. The default tags in `index.html` are the
fallback and should stay.

## Deploy

This is a **middleware** Edge Script (`servePullZone` + `onOriginResponse`), not
a standalone one. The other workers here are standalone (each got its own
`ip.` / `events.` / `oauth.` subdomain); this one instead wraps the origin of
the pull zone that serves `mu.social`. Do NOT try to wire it through an Edge Rule
- there is no "Run Edge Script" Edge Rule action in current Bunny (Edge Rules
explicitly point you to Middleware Scripts for response transformation).

1. Create an Edge Script in the Bunny dashboard, choose the **Middleware** type
   (not Standalone), and paste `bunny/index.ts`.
2. Set that script's pull zone **origin to the existing Edge Storage static
   build** - the same storage zone `../bunny_upload.sh` uploads to and that the
   current `mu.social` pull zone already serves.
3. Point the **`mu.social` hostname at the middleware script's pull zone** (move
   it off the current static-only pull zone). If your dashboard instead offers
   linking the script to the existing `mu.social` pull zone directly, use that
   and skip the hostname move. The `url` in `servePullZone({url})` is only used
   by `bunny dev` locally; deployed, traffic proxies to the pull zone's
   configured origin, so that literal is ignored in production.
4. Make sure the pull zone is allowed to **cache `text/html`** so enriched pages
   are reused. The script sets `Cache-Control: public, s-maxage=600,
   stale-while-revalidate=86400` on enriched responses; the output is a pure
   function of the URL, so per-URL caching is safe.

   Validate on a staging hostname first (a middleware script over the staging
   build) before moving prod `mu.social`.
5. Env Configuration:
   - `SITE_URL` - **set this per deployment** (e.g. `https://staging.mu.social`
     on staging, `https://mu.social` on prod; default `https://mu.social`). Used
     for the canonical `og:url` and the absolute `og:logo`. It cannot be derived
     from the request: inside `onOriginResponse` the request URL is the proxied
     origin (an internal IP:port), not the public hostname - so without this,
     `og:url` ends up pointing at the origin IP and unfurlers that resolve the
     favicon against `og:url` (e.g. Discord) show no site logo.
   - `APPVIEW_URL` - atproto appview base, no trailing slash
     (default `https://public.api.bsky.app`).
   - `SITE_NAME` - `og:site_name` value (default `mu`).
   - `BOTS_ONLY` - set to `1` to enrich only known crawler user-agents and pass
     humans straight through. Default enriches everyone (cheap, since the result
     caches per-URL).

## Verify

```
# Post: expect og:title with the author, og:description with the post text,
# og:image pointing at the post's image (or the author avatar if textonly).
curl -s -A 'facebookexternalhit/1.1' \
  https://mu.social/profile/<handle>/post/<rkey> | grep -iE 'og:|twitter:|<title'

# Profile: expect og:title "<name> (@handle)" and og:image = banner (or avatar).
curl -s -A 'Twitterbot/1.0' \
  https://mu.social/profile/<handle> | grep -iE 'og:|twitter:|<title'

# Homepage / unmatched route: unchanged static default card.
curl -s https://mu.social/ | grep -iE 'og:title'
```

Validate the rendered card with the platform debuggers:

- Facebook/Open Graph: https://developers.facebook.com/tools/debug/
- Twitter/X: https://cards-dev.twitter.com/validator
- Generic: https://www.opengraph.xyz/

Run a post URL twice and check the second hit is a pull-zone cache `HIT` - proof
the enriched HTML is being reused rather than re-querying the appview per
request.

## Scope / extending

Posts and profiles cover the common share targets. Feeds, lists, and starter
packs are not handled (starter-pack cards upstream use a separate image-render
service, `OGCARD_HOST`, which is out of scope here). Adding a route is a new
regex plus a `build…Tags` function in `bunny/index.ts`.
