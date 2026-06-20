# web (Cloudflare)

The brand's **web surface** as one Cloudflare Worker with Static Assets. It
replaces, on Cloudflare, what Bunny did with a pull zone + two separate edge
scripts:

| Route | Handled by | Was (Bunny) |
| --- | --- | --- |
| `GET /geolocation` | `request.cf.country` / `regionCode` | `services/geolocation` |
| `/profile/<actor>[/post/<rkey>]` | OG/Twitter tags from appview data | `services/og` |
| everything else | static asset, or `index.html` (SPA fallback) | pull zone |

OG enrichment is a faithful port of `../../og/bunny` (same appview queries, same
tag set, fail-open). `/geolocation` ports `../../geolocation/bunny` and is
strictly better here: Cloudflare provides the country *and* the ISO 3166-2
region code (Bunny had no region), so US state-level age logic works.

## Deploy

1. Build the web bundle (writes `web-build/`). Easiest is the deploy script
   `pnpm deploy:cloudflare` (builds + deploys both Workers); to build manually:

   ```bash
   pnpm build-web
   ```

2. Edit `wrangler.jsonc`: just the worker `name`. `SITE_URL` / `SITE_NAME` /
   `ALLOWED_ORIGIN` are derived from `src/config/brand.json` at build (a
   rebrand is one edit there); add a `vars` block only to override per
   deployment - e.g. a staging `SITE_URL`, or a self-hosted `APPVIEW_URL`.
3. Deploy:

   ```bash
   cd services/web/cloudflare && wrangler deploy
   ```

4. Put it on the brand's domain (Workers custom domain / route).

## Wire the app to it

Because `/geolocation` now lives on the main host (not a subdomain), point the
app at the site origin at build time:

```
EXPO_PUBLIC_ENABLE_GEOLOCATION=true
EXPO_PUBLIC_GEOLOCATION_URL=https://<site>   # app fetches <url>/geolocation
```

No `nodejs_compat` / bindings beyond `ASSETS` - the Worker uses only fetch +
Web APIs. OAuth (confidential) stays its own Worker: see `../../oauth/cloudflare`.
