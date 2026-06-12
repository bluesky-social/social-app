/**
 * Eurosky fork: web OAuth client.
 *
 * Dev/loopback -> public client via the turnkey `BrowserOAuthClient`
 * (loopback is public-only by atproto spec; the 2-week cap is accepted in
 * dev). Prod -> CONFIDENTIAL client: base `OAuthClient` with a
 * `private_key_jwt` keyset whose signing is delegated to the stateless
 * assertion Worker (the private key never reaches the browser). Confidential
 * gets unlimited session lifetime + 180-day refresh tokens.
 *
 * `BrowserOAuthClient` cannot be confidential (it hardcodes
 * `keyset: undefined` in its `super()` call), so prod assembles the base
 * `OAuthClient` with our keyset + a fork-owned runtime + IndexedDB stores.
 *
 * Both paths are exposed through one small interface (`signIn`/`init`/
 * `restore`) so oauth-web-callback.ts and oauth-agent.ts stay untouched.
 */
import {
  OAuthClient,
  type OAuthClientOptions,
  type OAuthSession,
} from '@atproto/oauth-client'
import {
  type AuthorizeOptions,
  BrowserOAuthClient,
} from '@atproto/oauth-client-browser'

import {logger} from '#/logger'
import {
  OAUTH_ASSERTION_URL,
  OAUTH_BASE_URL,
  OAUTH_CLIENT_NAME,
  OAUTH_PUBLIC_JWKS,
  OAUTH_SCOPE,
  OAUTH_SIGNUP_PDS_HOST,
} from '#/config/oauth'
import {createIdentityResolver} from './identity-resolver'
import {
  createEuroskyOAuthRuntime,
  createOAuthSessionStore,
  createOAuthStateStore,
} from './oauthBrowserBackend'
import {createOAuthRemoteKey} from './oauthRemoteKey'

/**
 * The only surface the rest of the app consumes. Both the dev (public) and
 * prod (confidential) clients are normalized to this.
 */
export interface WebOAuthClient {
  signIn(input: string, options?: AuthorizeOptions): Promise<void>
  init(): Promise<{session: OAuthSession; state?: string | null} | undefined>
  restore(sub: string, refresh?: boolean): Promise<OAuthSession>
}

function isLoopback(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host === '::1'
  )
}

// Session lifecycle hooks. @atproto/oauth-client-browser ^0.3 exposes
// onDelete/onUpdate via constructor SessionHooks. "Telemetry dropped" means
// Blacksky's bespoke OAuth growthbook telemetry was NOT ported - it does NOT
// mean this logger is inert: logger.* feeds the live Sentry transport, so we
// must keep PII (DID/sub) and raw error objects out of it (MED-1).
const sessionHooks = {
  onDelete(_sub: string, cause: unknown) {
    logger.warn('oauth: session deleted', {
      safeMessage:
        cause instanceof Error
          ? cause.message
          : typeof cause === 'string'
            ? cause
            : 'unknown',
    })
  },
  onUpdate(_sub: string) {},
}

/** Callback params arrive in the hash fragment (response_mode=fragment) or query. */
function readCallbackParams(): URLSearchParams | null {
  if (typeof window === 'undefined') return null
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const query = new URLSearchParams(window.location.search)
  const params = hash.has('state') ? hash : query
  if (params.has('state') && (params.has('code') || params.has('error'))) {
    return params
  }
  return null
}

// -- Dev / loopback: public BrowserOAuthClient -------------------------------

function createLoopbackClient(): WebOAuthClient {
  // The atproto authorization server uses hardcoded metadata for
  // `http://localhost` client_ids; scope + redirect_uri must be encoded into
  // the client_id query or only the bare "atproto" scope is granted (which
  // breaks appview/chat).
  const port =
    typeof window !== 'undefined' && window.location.port
      ? `:${window.location.port}`
      : ''
  const redirectUri = `http://127.0.0.1${port}/`
  const clientId =
    `http://localhost` +
    `?redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(OAUTH_SCOPE)}`
  const client = new BrowserOAuthClient({
    clientMetadata: {
      client_id: clientId,
      redirect_uris: [redirectUri],
      scope: OAUTH_SCOPE,
      token_endpoint_auth_method: 'none',
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      application_type: 'web',
      dpop_bound_access_tokens: true,
    },
    identityResolver: createIdentityResolver(),
    ...sessionHooks,
  })
  return {
    async signIn(input, options) {
      await client.signIn(input, options)
    },
    init: () => client.init(),
    restore: (sub, refresh) => client.restore(sub, refresh),
  }
}

// -- Prod: confidential base OAuthClient -------------------------------------

/**
 * LOW-3: the metadata object needs an `as unknown as` cast (the library's
 * generated union type is impractical to satisfy by hand), which disables
 * compile-time checking on the most security-sensitive object. Replace that
 * silent hole with a loud, fail-closed runtime assertion - in particular,
 * refuse to ever ship private key material (`d`) in the advertised JWKS.
 */
function assertConfidentialMetadata(m: Record<string, unknown>): void {
  const jwks = m.jwks as {keys?: Array<Record<string, unknown>>} | undefined
  const k0 = jwks?.keys?.[0]
  const fail = (why: string): never => {
    throw new Error(`oauth: refusing to start - bad client metadata: ${why}`)
  }
  if (m.token_endpoint_auth_method !== 'private_key_jwt')
    fail('token_endpoint_auth_method must be private_key_jwt')
  if (m.token_endpoint_auth_signing_alg !== 'ES256')
    fail('signing alg must be ES256')
  if (!jwks || !Array.isArray(jwks.keys) || jwks.keys.length < 1)
    fail('jwks missing')
  if (!k0 || typeof k0.kid !== 'string' || !k0.kid) fail('jwks key missing kid')
  if (k0 && 'd' in k0) fail('PRIVATE key material (d) present in jwks')
  if (m.client_id !== `${OAUTH_BASE_URL}/oauth-client-metadata.json`)
    fail('client_id not on OAUTH_BASE_URL')
  const ru = m.redirect_uris as unknown[] | undefined
  if (!Array.isArray(ru) || ru[0] !== `${OAUTH_BASE_URL}/`)
    fail('redirect_uris not pinned to OAUTH_BASE_URL root')
}

function createConfidentialClient(): WebOAuthClient {
  const metadataObj = {
    client_id: `${OAUTH_BASE_URL}/oauth-client-metadata.json`,
    client_name: OAUTH_CLIENT_NAME,
    client_uri: OAUTH_BASE_URL,
    redirect_uris: [`${OAUTH_BASE_URL}/`],
    scope: OAUTH_SCOPE,
    token_endpoint_auth_method: 'private_key_jwt',
    token_endpoint_auth_signing_alg: 'ES256',
    response_types: ['code'],
    grant_types: ['authorization_code', 'refresh_token'],
    application_type: 'web',
    dpop_bound_access_tokens: true,
    // Public key only (no `d`); kept identical to the generated static
    // oauth-client-metadata.json by reading the same committed file.
    jwks: OAUTH_PUBLIC_JWKS,
  }
  assertConfidentialMetadata(metadataObj)
  // Cast is unavoidable (huge generated union); the assertion above is the
  // real guard - it has already validated every security-sensitive field.
  const clientMetadata =
    metadataObj as unknown as OAuthClientOptions['clientMetadata']

  const client = new OAuthClient({
    clientMetadata,
    responseMode: 'fragment',
    keyset: [createOAuthRemoteKey(OAUTH_PUBLIC_JWKS.keys[0])],
    identityResolver: createIdentityResolver(),
    runtimeImplementation: createEuroskyOAuthRuntime(),
    stateStore: createOAuthStateStore(),
    sessionStore: createOAuthSessionStore(),
  })

  client.addEventListener('deleted', ({detail: {cause}}) => {
    // No `sub` (DID) - this reaches the live Sentry transport (MED-1).
    logger.warn('oauth: session deleted', {
      safeMessage:
        cause instanceof Error
          ? cause.message
          : typeof cause === 'string'
            ? cause
            : 'unknown',
    })
  })

  return {
    async signIn(input, options) {
      const url = await client.authorize(input, options)
      window.location.assign(url.href)
      // Navigation is underway; never resolve so callers don't act further.
      await new Promise<never>(() => {})
    },
    async init() {
      const params = readCallbackParams()
      if (!params) return undefined
      const {session, state} = await client.callback(params)
      return {session, state}
    },
    restore: (sub, refresh) => client.restore(sub, refresh),
  }
}

let assertionUrlChecked = false
function assertConfidentialConfigured(): void {
  if (assertionUrlChecked) return
  assertionUrlChecked = true
  if (!OAUTH_ASSERTION_URL || !/^https:\/\//.test(OAUTH_ASSERTION_URL)) {
    logger.error(
      'oauth: confidential client requires a valid OAUTH_ASSERTION_URL ' +
        '(set EXPO_PUBLIC_OAUTH_ASSERTION_URL to the deployed Worker). ' +
        'Token refresh will fail until this is configured.',
    )
  }
}

function createWebOAuthClient(): WebOAuthClient {
  if (isLoopback()) return createLoopbackClient()
  assertConfidentialConfigured()
  return createConfidentialClient()
}

const WEB_OAUTH_CLIENT = createWebOAuthClient()

export function getWebOAuthClient(): WebOAuthClient {
  return WEB_OAUTH_CLIENT
}

/**
 * Start the "Sign in" flow. Redirects to the user's auth server and does
 * not resolve normally - the callback returns to the site root where
 * App.web.tsx finishes login.
 */
export async function oauthSignIn(handle: string): Promise<void> {
  await getWebOAuthClient().signIn(handle.trim())
}

/**
 * OAuth `state` marker we set on the create-account flow so the callback can
 * tell a fresh signup apart from a plain sign-in (and kick off onboarding,
 * which the external PDS signup page can't do for us).
 */
export const OAUTH_SIGNUP_STATE = 'signup'

/**
 * Start the "Create account" flow: straight to the Eurosky signup PDS with
 * prompt=create. Same callback path as sign-in.
 */
export async function oauthCreateAccount(): Promise<void> {
  await getWebOAuthClient().signIn(OAUTH_SIGNUP_PDS_HOST, {
    prompt: 'create',
    state: OAUTH_SIGNUP_STATE,
  })
}
