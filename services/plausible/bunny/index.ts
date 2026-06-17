/**
 * Eurosky Plausible analytics proxy (Bunny.net Edge Scripting).
 *
 * Bunny port of Plausible's recommended Cloudflare Worker proxy, trimmed to what
 * this app actually needs. Only the runtime shell differs from the original:
 *   - entry: BunnySDK.net.http.serve(handler)   (was: addEventListener('fetch'))
 *   - config: Deno.env.get(...)                 (was: top-level constants)
 * URL, Request, Response, fetch are standard Web APIs in Bunny's Deno runtime.
 *
 * WHY THIS EXISTS: routing Plausible through a first-party domain stops
 * content/ad blockers (which blocklist plausible.io) from dropping events. Set
 * the app's EXPO_PUBLIC_PLAUSIBLE_API_HOST to this script's pull-zone host so the
 * tracker posts to `https://<your-host>/api/event` instead of plausible.io.
 *
 * The web build is a single-page app using the @plausible-analytics/tracker npm
 * package (see ../../src/analytics/plausible/index.web.ts): it bundles its own
 * script and only POSTs events. It never requests a remote /js/script.js, so this
 * proxy only forwards /api/event - no script-proxying branch is needed.
 *
 * Config (Bunny dashboard -> script -> Env Configuration), all optional:
 *   PLAUSIBLE_HOST   upstream Plausible host (default https://plausible.io;
 *                    set to your self-hosted instance if applicable)
 *   EVENT_PATH       inbound event path to proxy (default /api/event)
 */
import * as BunnySDK from 'https://esm.sh/@bunny.net/edgescript-sdk@0.11.2'

function env(name: string, fallback: string): string {
  const v = Deno.env.get(name)
  return v && v.length ? v : fallback
}

BunnySDK.net.http.serve(async (req: Request): Promise<Response> => {
  const plausibleHost = env('PLAUSIBLE_HOST', 'https://plausible.io')
  const eventPath = env('EVENT_PATH', '/api/event')

  const {pathname} = new URL(req.url)
  if (pathname !== eventPath && !pathname.endsWith(eventPath)) {
    return new Response(null, {status: 404})
  }

  try {
    // Clone so we can strip the cookie (Plausible is cookieless; forwarding it
    // would leak first-party cookies upstream for no benefit). Every other
    // header is preserved so the visitor IP (X-Forwarded-For, set by Bunny on
    // the inbound request) and User-Agent still reach Plausible - both are
    // required for correct unique-visitor counting.
    const forwarded = new Request(`${plausibleHost}/api/event`, req)
    forwarded.headers.delete('cookie')
    return await fetch(forwarded)
  } catch {
    // Fail open: a dropped analytics event must never surface as an error to the
    // page. (Cloudflare's passThroughOnException has no Bunny equivalent.)
    return new Response(null, {status: 202})
  }
})
