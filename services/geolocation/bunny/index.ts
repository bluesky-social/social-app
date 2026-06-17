/**
 * Eurosky IP geolocation endpoint (Bunny.net Edge Scripting).
 *
 * First-party replacement for Bluesky's https://ip.bsky.app/geolocation, which
 * is CORS-locked to https://bsky.app (so a web build on our domain cannot call
 * it) and would report every visitor's IP to Bluesky infrastructure anyway.
 *
 * WHY THIS EXISTS: on startup the app fetches GET <GEOLOCATION_URL>/geolocation
 * (see ../../src/geolocation/service.ts) and uses the country code to subscribe
 * only the regional moderation labelers legally required in the user's
 * jurisdiction. When the country is unknown the app fails closed and
 * force-subscribes EVERY regional labeler (see
 * ../../src/state/session/additional-moderation-authorities.ts) - which is what
 * users see when this endpoint is missing or geolocation is disabled.
 *
 * Bunny resolves the visitor's IP to a two-letter ISO country code at every PoP
 * and hands it to the script as the CDN-RequestCountryCode header. No lookup
 * happens here and no third party is involved: the IP never goes anywhere it
 * wasn't already (Bunny terminates all traffic for the app).
 *
 * The response shape matches ip.bsky.app ({"countryCode":"DE"}). Bunny has no
 * region-level data, so regionCode is omitted - the app reads it as undefined,
 * and it is only used for US state-level age-assurance logic.
 *
 * Config (Bunny dashboard -> script -> Env Configuration), optional:
 *   ALLOWED_ORIGIN   value for Access-Control-Allow-Origin (default *). The
 *                    body is derived from the caller's own IP, so a wildcard
 *                    discloses nothing a site couldn't infer server-side;
 *                    tighten to https://<app-host> if preferred.
 */
import * as BunnySDK from 'https://esm.sh/@bunny.net/edgescript-sdk@0.11.2'

const COUNTRY_HEADER = 'CDN-RequestCountryCode'

function baseHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    // Never cache: the body is per-visitor. A copy cached at the PoP or in the
    // browser would serve one user's country to another (or go stale across
    // travel). Belt and braces - keep caching off on the pull zone too.
    'Cache-Control': 'no-store',
  }
}

BunnySDK.net.http.serve(async (req: Request): Promise<Response> => {
  const {pathname} = new URL(req.url)
  if (pathname !== '/geolocation') {
    return new Response(null, {status: 404, headers: baseHeaders()})
  }
  if (req.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: baseHeaders()})
  }
  if (req.method !== 'GET') {
    return new Response(null, {status: 405, headers: baseHeaders()})
  }

  const countryCode = req.headers.get(COUNTRY_HEADER)?.toUpperCase()
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) {
    // The app treats any non-2xx as a failure (src/geolocation/service.ts):
    // it retries 3x in the background and otherwise proceeds fail-closed.
    // Returning 200 without a countryCode would be worse - the app would
    // cache "location unknown" on the device as a successful response.
    return new Response(null, {status: 503, headers: baseHeaders()})
  }

  return new Response(JSON.stringify({countryCode}), {
    status: 200,
    headers: {...baseHeaders(), 'Content-Type': 'application/json'},
  })
})
