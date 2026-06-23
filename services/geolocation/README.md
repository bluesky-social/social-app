# eurosky-geolocation-worker

Bunny.net Edge Script that answers `GET /geolocation` with the visitor's
two-letter country code, e.g. `{"countryCode":"DE"}`.

It is a first-party replacement for Bluesky's `https://ip.bsky.app/geolocation`,
which the web app cannot use (CORS-locked to `https://bsky.app`) and which we
would not want to use anyway (reports every visitor's IP to Bluesky).

## Why it matters

On startup the app resolves the visitor's country
(`src/geolocation/service.ts`) and subscribes only the regional moderation
labelers legally required there
(`src/state/session/additional-moderation-authorities.ts`). When the country is
unknown - which is every user, while `EXPO_PUBLIC_ENABLE_GEOLOCATION=false` -
the app fails closed and force-subscribes **all ~11 regional labelers** (Brazil,
Russia, Turkey, India, ...), shown as "Required in your region" in moderation
settings, and applies every jurisdiction's takedown labels to everyone.

## How it works

Bunny's PoPs resolve the connecting IP to a country and pass it to the script
as the `CDN-RequestCountryCode` header. The script echoes it back as JSON. No
GeoIP database, no third party, no logging - the IP never goes anywhere it
wasn't already (Bunny terminates all traffic for the app).

Bunny has no region/state data, so `regionCode` is omitted. The app only uses
it for US state-level age-assurance logic.

## Deploy

1. Create an Edge Script in the Bunny dashboard and paste `bunny/index.ts`
   (or wire it to this repo).
2. Attach a pull zone / hostname, e.g. `ip.<your-domain>`.
3. Make sure caching is **disabled** on that pull zone - the response is
   per-visitor. (The script also sends `Cache-Control: no-store`.)
4. (Optional) Env Configuration:
   - `ALLOWED_ORIGIN` - value for `Access-Control-Allow-Origin`
     (default `*`; the body is derived from the caller's own IP, so a
     wildcard discloses nothing a site couldn't infer server-side).

## Wire the app to it

Set both at build time (see `.github/workflows/deploy-web-bunny.yml` and
`scripts/bunny_build.sh`):

```
EXPO_PUBLIC_ENABLE_GEOLOCATION=true
EXPO_PUBLIC_GEOLOCATION_URL=https://ip.<your-domain>
```

The app appends `/geolocation` itself (`src/geolocation/const.ts`).

## Failure behavior

If Bunny ever omits the country header, the script returns 503. The app
retries 3x in the background and otherwise proceeds fail-closed (all regional
labelers) - the same as today's behavior, never less moderation than required.
Returning 200 without a `countryCode` would be worse: the app would cache
"location unknown" on the device as a successful response.

## Verify

```
curl -i https://ip.<your-domain>/geolocation
# expect: {"countryCode":"<your country>"}
```

Run it twice and check `CDN-Cache: MISS` both times - that is the proof the
PoP is not caching the (per-visitor) body. Bunny may rewrite the script's
`Cache-Control: no-store` to `no-cache` in the response; that is harmless.

In the deployed app, Settings -> Moderation -> Advanced should show only the
labeler(s) for your region (e.g. in Germany: the EU labeler and the German
one), not the full list.
