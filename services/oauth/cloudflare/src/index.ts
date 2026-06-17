/**
 * Brand OAuth client-assertion Worker (Cloudflare).
 *
 * Cloudflare port of ../../bunny/index.ts - the SAME "strict reconstructing
 * minter" on Web Crypto. Only two things differ from the Bunny version:
 *   - entrypoint: `export default { fetch }` instead of BunnySDK.net.http.serve
 *   - config source: `env` bindings instead of Deno.env.get(...)
 * The validation + minting + signing logic is identical; see ../../bunny/index.ts
 * for the full SECURITY MODEL (TL;DR: this is defense-in-depth, not an auth
 * boundary - PKCE + redirect_uri pinning + DPoP do the real work).
 *
 * Config:
 *   OAUTH_PRIVATE_JWK  secret - private ES256/P-256 JWK JSON incl. kid
 *                              (`wrangler secret put OAUTH_PRIVATE_JWK`)
 *   CLIENT_ID          var    - exact iss/sub, e.g.
 *                              https://<domain>/oauth-client-metadata.json
 *   ALLOWED_ORIGIN     var    - exact browser Origin, e.g. https://<domain>
 *
 * Request:  POST { header, payload }   (built by @atproto/oauth-client)
 * Response: { jws: "<compact JWS>" }
 */

import brandMeta from '../../../../src/config/brand-meta.json'

// Defaults derived from the brand's primary host (src/config/brand-meta.json,
// bundled at build); the env vars below override per deployment (e.g. staging).
const BRAND_ORIGIN = `https://${brandMeta.hosts[0]}`

interface Env {
  OAUTH_PRIVATE_JWK: string
  CLIENT_ID?: string
  ALLOWED_ORIGIN?: string
}

// `iat`/`exp` are stamped from this edge node's clock (NTP-synced), not the
// caller's, and `iat` is backdated slightly to absorb edge<->AS skew.
const IAT_BACKDATE_S = 30
const ASSERTION_LIFETIME_S = 120
const MAX_BODY_BYTES = 8 * 1024

function b64url(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array
  if (typeof input === 'string') bytes = new TextEncoder().encode(input)
  else if (input instanceof Uint8Array) bytes = input
  else bytes = new Uint8Array(input)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function deny(status: number, message: string, origin: string): Response {
  return new Response(JSON.stringify({error: message}), {
    status,
    headers: {'content-type': 'application/json', ...corsHeaders(origin)},
  })
}

/**
 * The client assertion `aud` is the authorization server issuer, which in
 * atproto is an origin-shaped https URL. We cannot allowlist it (sign-in
 * resolves an arbitrary user handle -> their PDS -> their AS), but we can
 * reject anything that is not a clean https origin: no userinfo, no query,
 * no fragment, root path only.
 */
function validAudience(aud: unknown): aud is string {
  if (typeof aud !== 'string' || aud.length > 512) return false
  let u: URL
  try {
    u = new URL(aud)
  } catch {
    return false
  }
  return (
    u.protocol === 'https:' &&
    u.hostname !== '' &&
    u.username === '' &&
    u.password === '' &&
    u.search === '' &&
    u.hash === '' &&
    (u.pathname === '/' || u.pathname === '')
  )
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const allowed = env.ALLOWED_ORIGIN || BRAND_ORIGIN
    const clientId =
      env.CLIENT_ID || `${BRAND_ORIGIN}/oauth-client-metadata.json`
    const privateJwkRaw = env.OAUTH_PRIVATE_JWK ?? ''

    const origin = req.headers.get('Origin') ?? ''

    if (req.method === 'OPTIONS') {
      return new Response(null, {status: 204, headers: corsHeaders(allowed)})
    }
    // Defense-in-depth only - NOT authentication (see SECURITY MODEL above).
    if (origin !== allowed) {
      return deny(403, 'origin not allowed', allowed)
    }
    if (req.method !== 'POST') {
      return deny(405, 'method not allowed', allowed)
    }

    // Body-size cap (cheap abuse/DoS guard; real rate limiting is operator-side).
    const cl = req.headers.get('content-length')
    if (cl && Number(cl) > MAX_BODY_BYTES) {
      return deny(413, 'request too large', allowed)
    }
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) {
      return deny(413, 'request too large', allowed)
    }

    let body: {header?: unknown; payload?: unknown}
    try {
      body = JSON.parse(raw)
    } catch {
      return deny(400, 'invalid JSON', allowed)
    }
    const header = body.header as Record<string, unknown> | undefined
    const payload = body.payload as Record<string, unknown> | undefined
    if (
      !header ||
      !payload ||
      typeof header !== 'object' ||
      typeof payload !== 'object'
    ) {
      return deny(400, 'missing header/payload', allowed)
    }

    let privateJwk: JsonWebKey & {kid?: string}
    try {
      privateJwk = JSON.parse(privateJwkRaw)
    } catch {
      return deny(500, 'worker key misconfigured', allowed)
    }
    // Fail closed if the secret has no kid (kid is authoritative below).
    if (typeof privateJwk.kid !== 'string' || !privateJwk.kid) {
      return deny(500, 'worker key misconfigured (missing kid)', allowed)
    }

    // -- Validate the request (reject confused/hostile callers clearly) ------
    const now = Math.floor(Date.now() / 1000)
    const errors: string[] = []
    if (header.alg !== 'ES256') errors.push('alg must be ES256')
    if (payload.iss !== clientId) errors.push('iss must be client_id')
    if (payload.sub !== clientId) errors.push('sub must be client_id')
    if (!validAudience(payload.aud)) {
      errors.push('aud must be a clean https origin')
    }
    if (
      typeof payload.jti !== 'string' ||
      !payload.jti ||
      payload.jti.length > 256
    ) {
      errors.push('jti required')
    }
    // Note: we deliberately do NOT validate the caller's iat/exp - they are
    // discarded and re-stamped from this node's clock below (see IAT_BACKDATE_S).
    if (errors.length) {
      return deny(400, `invalid assertion: ${errors.join('; ')}`, allowed)
    }

    // -- RECONSTRUCT from the whitelist - never sign caller-supplied JWT
    //    material. Anything the caller put in header/payload beyond the
    //    fields validated above is discarded here. -------------------------
    const outHeader = {alg: 'ES256', kid: privateJwk.kid, typ: 'JWT'}
    const outPayload = {
      iss: clientId,
      sub: clientId,
      aud: payload.aud as string,
      jti: payload.jti as string,
      iat: now - IAT_BACKDATE_S,
      exp: now + ASSERTION_LIFETIME_S,
    }

    // -- Sign (ES256 = ECDSA P-256 / SHA-256; WebCrypto returns P1363 r||s,
    //    which is exactly the JWS ES256 signature format) -------------------
    let key: CryptoKey
    try {
      key = await crypto.subtle.importKey(
        'jwk',
        privateJwk,
        {name: 'ECDSA', namedCurve: 'P-256'},
        false,
        ['sign'],
      )
    } catch {
      return deny(500, 'worker key import failed', allowed)
    }
    const signingInput = `${b64url(JSON.stringify(outHeader))}.${b64url(
      JSON.stringify(outPayload),
    )}`
    const sig = await crypto.subtle.sign(
      {name: 'ECDSA', hash: 'SHA-256'},
      key,
      new TextEncoder().encode(signingInput),
    )
    const jws = `${signingInput}.${b64url(sig)}`

    return new Response(JSON.stringify({jws}), {
      headers: {'content-type': 'application/json', ...corsHeaders(allowed)},
    })
  },
}
