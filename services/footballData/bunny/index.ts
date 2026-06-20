/**
 * football-data.org API proxy (Bunny.net Edge Scripting).
 *
 * First-party front for api.football-data.org, used by the live sports widget
 * in the Discover tab (see ../../src/features/liveSports/). It exists for two
 * reasons:
 *
 * 1. CORS: football-data.org sends no Access-Control-Allow-Origin header, so a
 *    web build cannot call it directly from the browser.
 * 2. Secrecy: the X-Auth-Token must not ship in the client bundle. It is held
 *    here as an env var and injected server-side.
 *
 * The app points EXPO_PUBLIC_FOOTBALLDATA_API_URL at <this host>/v4 and sends
 * no token (see src/features/liveSports/config.ts).
 *
 * Lockdown: only GET /v4/competitions/<code>/... is forwarded, and only for the
 * allowed competition codes, so a leaked endpoint cannot drain the API quota on
 * arbitrary resources. Responses are briefly cached so N viewers cost roughly
 * one upstream call per interval.
 *
 * Config (Bunny dashboard -> script -> Env Configuration):
 *   FOOTBALLDATA_TOKEN       required. The football-data.org API token.
 *   ALLOWED_COMPETITIONS     optional, comma-separated codes. Defaults to "WC".
 *   ALLOWED_ORIGIN           optional. Access-Control-Allow-Origin (default *).
 *   CACHE_SECONDS            optional. Edge/browser cache TTL (default 30).
 */
import * as BunnySDK from 'https://esm.sh/@bunny.net/edgescript-sdk@0.11.2'

const UPSTREAM = 'https://api.football-data.org'
const COMPETITIONS_PREFIX = '/v4/competitions/'

function env(name: string): string | undefined {
  return Deno.env.get(name) || undefined
}

function baseHeaders(): Record<string, string> {
  const cacheSeconds = Number(env('CACHE_SECONDS') || '30')
  return {
    'Access-Control-Allow-Origin': env('ALLOWED_ORIGIN') || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type, X-Auth-Token',
    'Cache-Control': `public, max-age=${cacheSeconds}`,
  }
}

function allowedCompetitions(): Set<string> {
  const raw = env('ALLOWED_COMPETITIONS') || 'WC'
  return new Set(
    raw
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean),
  )
}

/** Pull the competition code from /v4/competitions/<code>/... */
function competitionCode(pathname: string): string | null {
  const rest = pathname.slice(COMPETITIONS_PREFIX.length)
  const code = rest.split('/')[0]
  return code ? code.toUpperCase() : null
}

BunnySDK.net.http.serve(async (req: Request): Promise<Response> => {
  const headers = baseHeaders()

  if (req.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers})
  }
  if (req.method !== 'GET') {
    return new Response(null, {status: 405, headers})
  }

  const token = env('FOOTBALLDATA_TOKEN')
  if (!token) {
    return new Response(null, {status: 500, headers})
  }

  const url = new URL(req.url)
  if (!url.pathname.startsWith(COMPETITIONS_PREFIX)) {
    return new Response(null, {status: 404, headers})
  }

  // Enforce the configured competitions so the proxy can't be used to pull
  // arbitrary resources on our quota.
  const code = competitionCode(url.pathname)
  if (!code || !allowedCompetitions().has(code)) {
    return new Response(null, {status: 403, headers})
  }

  const target = new URL(UPSTREAM + url.pathname)
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v))

  const upstream = await fetch(target.toString(), {
    headers: {Accept: 'application/json', 'X-Auth-Token': token},
  })
  const body = await upstream.text()
  return new Response(body, {
    status: upstream.status,
    headers: {...headers, 'Content-Type': 'application/json'},
  })
})
