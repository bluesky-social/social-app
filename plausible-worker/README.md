# eurosky-plausible-worker

Bunny.net Edge Script that proxies Plausible analytics through a first-party
domain, so content/ad blockers (which blocklist `plausible.io`) don't drop
events.

The script (`bunny/index.ts`) is a port of Plausible's recommended Cloudflare
Worker proxy to Bunny Edge Scripting (`BunnySDK.net.http.serve` + `Deno.env`).

## What it does

`POST /api/event` -> forwards to `<PLAUSIBLE_HOST>/api/event` (cookie stripped,
visitor `X-Forwarded-For` / `User-Agent` preserved).

That is the whole job. The app is a single-page app using the
`@plausible-analytics/tracker` npm package (see
`../src/analytics/plausible/index.web.ts`), which bundles its own script and only
POSTs events - it never requests a remote `/js/script.js`, so there is no
script-proxying branch.

## Deploy

1. Create an Edge Script in the Bunny dashboard and paste `bunny/index.ts`
   (or wire it to this repo).
2. Attach a pull zone / hostname, e.g. `analytics.<your-domain>`.
3. (Optional) set Env Configuration - all have sane defaults:
   - `PLAUSIBLE_HOST` (default `https://plausible.io`)
   - `EVENT_PATH` (default `/api/event`)

## Wire the app to it

Set the app's Plausible API host at build time to the script's hostname:

```
EXPO_PUBLIC_PLAUSIBLE_API_HOST=https://analytics.<your-domain>
```

The tracker then posts to `https://analytics.<your-domain>/api/event`, which
this script forwards to Plausible. See `EXPO_PUBLIC_PLAUSIBLE_API_HOST` in
`../.env.example` and `../src/env/common.ts`.

## Caveat: visitor IP

Plausible computes unique visitors from the client IP + User-Agent. This script
forwards the inbound headers unchanged (minus `cookie`), so it relies on Bunny
passing the real client IP in `X-Forwarded-For`. Confirm in the Plausible
dashboard that visitor counts look right after deploying; if every event lands
on one IP, configure Bunny to forward the client IP and/or set
`X-Forwarded-For` explicitly in `postEvent`.
