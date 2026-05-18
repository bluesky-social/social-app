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
import {type Jwk} from '@atproto/jwk'
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
  OAUTH_HANDLE_RESOLVER,
  OAUTH_PUBLIC_JWKS,
  OAUTH_SCOPE,
  OAUTH_SIGNUP_PDS_HOST,
} from '#/config/oauth'
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
  init(): Promise<{session: OAuthSession} | undefined>
  restore(sub: string, refresh?: boolean | 'auto'): Promise<OAuthSession>
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
// onDelete/onUpdate via constructor SessionHooks. We only log (telemetry was
// deliberately dropped from the Eurosky port).
const sessionHooks = {
  onDelete(sub: string, cause: unknown) {
    logger.warn('oauth: session deleted', {
      sub,
      message:
        cause instanceof Error
          ? cause.message
          : typeof cause === 'string'
            ? cause
            : undefined,
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
    handleResolver: OAUTH_HANDLE_RESOLVER,
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

function createConfidentialClient(): WebOAuthClient {
  const clientMetadata = {
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
    // The generated metadata cannot be confidential without a keyset.
  } as unknown as OAuthClientOptions['clientMetadata']

  const client = new OAuthClient({
    clientMetadata,
    responseMode: 'fragment',
    keyset: [createOAuthRemoteKey(OAUTH_PUBLIC_JWKS.keys[0] as Jwk)],
    handleResolver: OAUTH_HANDLE_RESOLVER,
    runtimeImplementation: createEuroskyOAuthRuntime(),
    stateStore: createOAuthStateStore(),
    sessionStore: createOAuthSessionStore(),
  })

  client.addEventListener('deleted', ({detail: {sub, cause}}) => {
    logger.warn('oauth: session deleted', {
      sub,
      message:
        cause instanceof Error
          ? cause.message
          : typeof cause === 'string'
            ? cause
            : undefined,
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
      const {session} = await client.callback(params)
      return {session}
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
 * Start the "Create account" flow: straight to the Eurosky signup PDS with
 * prompt=create. Same callback path as sign-in.
 */
export async function oauthCreateAccount(): Promise<void> {
  await getWebOAuthClient().signIn(OAUTH_SIGNUP_PDS_HOST, {prompt: 'create'})
}
