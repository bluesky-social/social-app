/**
 * Eurosky OAuth client-assertion Worker (stateless).
 *
 * The Eurosky web app is a CONFIDENTIAL atproto OAuth client. Confidential
 * clients authenticate at the token endpoint with a `private_key_jwt` client
 * assertion signed by the client's private key. That key must never reach
 * the browser, so this Worker holds it (as the `OAUTH_PRIVATE_JWK` secret)
 * and signs assertions on request. It stores nothing - no DB, no KV.
 *
 * SECURITY MODEL - read this before trusting it:
 *
 * This endpoint is internet-reachable and the `Origin` header is NOT an
 * authentication boundary (any non-browser caller sets it freely). A SPA
 * cannot hold a client secret, so `private_key_jwt` client authentication
 * here is, in practice, ~no stronger than a public client. It is NOT relied
 * on as a security boundary. What actually protects users is: atproto's
 * mandatory PKCE, the `redirect_uri` pinned to the app origin, and DPoP
 * sender-constrained tokens (the per-session DPoP key is non-extractable).
 * A minted assertion is useless without a grant the attacker cannot obtain.
 *
 * Given that, this Worker is a STRICT RECONSTRUCTING MINTER (not a signer):
 * it never signs caller-supplied JWT material. It validates the request,
 * then builds the header and payload itself from a fixed whitelist
 * (alg/kid/typ; iss/sub/aud/jti/iat/exp) so no extra header params
 * (crit/jku/x5u/jwk/cnf) or extra claims can ever be injected into a
 * production-key signature. This bounds blast radius; it does not (and
 * cannot, for a SPA) make the endpoint authenticated. Rate limiting and the
 * domain/DNS binding are operator responsibilities (see README).
 *
 * NOTE: the claim whitelist mirrors @atproto/oauth-client's
 * createClientCredentialsFactory. If a future atproto version adds a
 * required client-assertion claim, it MUST be added here or refresh breaks.
 *
 * Request:  POST { header, payload }  (built by @atproto/oauth-client)
 * Response: { jws: "<compact JWS>" }
 */

export interface Env {
  /** The client's PRIVATE JWK (ES256/P-256), as a JSON string. Secret. Must include `kid`. */
  OAUTH_PRIVATE_JWK: string
  /** Exact expected `iss`/`sub`, e.g. https://mu.social/oauth-client-metadata.json */
  CLIENT_ID: string
  /** Exact allowed browser Origin (defense-in-depth only), e.g. https://mu.social */
  ALLOWED_ORIGIN: string
}

const MAX_ASSERTION_LIFETIME_S = 300
const CLOCK_SKEW_S = 120
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
    const allowed = env.ALLOWED_ORIGIN
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
      privateJwk = JSON.parse(env.OAUTH_PRIVATE_JWK)
    } catch {
      return deny(500, 'worker key misconfigured', allowed)
    }
    // LOW-1: fail closed if the secret has no kid (kid is authoritative below).
    if (typeof privateJwk.kid !== 'string' || !privateJwk.kid) {
      return deny(500, 'worker key misconfigured (missing kid)', allowed)
    }

    // -- Validate the request (reject confused/hostile callers clearly) ------
    const now = Math.floor(Date.now() / 1000)
    const errors: string[] = []
    if (header.alg !== 'ES256') errors.push('alg must be ES256')
    if (payload.iss !== env.CLIENT_ID) errors.push('iss must be client_id')
    if (payload.sub !== env.CLIENT_ID) errors.push('sub must be client_id')
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
    if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
      errors.push('iat/exp required')
    } else {
      if (payload.exp <= now) errors.push('already expired')
      if (payload.iat > now + CLOCK_SKEW_S) errors.push('iat in the future')
      if (payload.exp - payload.iat > MAX_ASSERTION_LIFETIME_S) {
        errors.push('lifetime too long')
      }
    }
    if (errors.length) {
      return deny(400, `invalid assertion: ${errors.join('; ')}`, allowed)
    }

    // -- RECONSTRUCT from the whitelist - never sign caller-supplied JWT
    //    material. Anything the caller put in header/payload beyond the
    //    fields validated above is discarded here. -------------------------
    const outHeader = {alg: 'ES256', kid: privateJwk.kid, typ: 'JWT'}
    const outPayload = {
      iss: env.CLIENT_ID,
      sub: env.CLIENT_ID,
      aud: payload.aud as string,
      jti: payload.jti as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
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
