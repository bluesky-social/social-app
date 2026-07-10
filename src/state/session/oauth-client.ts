import {ExpoOAuthClient} from '@atproto/oauth-client-expo'

import {logger} from '#/logger'
import {
  categorizeOauthError,
  emitOauthTelemetry,
} from '#/state/session/oauth-telemetry'
import {OAUTH_BASE_URL, OAUTH_CLIENT_NAME, OAUTH_SCOPE} from './oauth-config'

const NATIVE_REDIRECT_URI = 'community.blacksky:/oauth/callback'

// Debug fetch wrapper — logs all OAuth-related network requests to Metro console
const debugFetch: typeof fetch = async (input, init) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url
  const method = init?.method?.toUpperCase() ?? 'GET'
  console.log(`[OAuth fetch] ${method} ${url}`)
  try {
    const res = await fetch(input, init)
    const cloned = res.clone()
    let body: string | undefined
    try {
      body = await cloned.text()
    } catch {}
    console.log(`[OAuth fetch] ${res.status} ${url}`, body?.slice(0, 500))
    return res
  } catch (err) {
    console.error(`[OAuth fetch] FAILED ${url}`, err)
    throw err
  }
}

// Session lifecycle hooks. Mirrors the web client at parity so production
// debugging surfaces the same telemetry events on both platforms. The OAuth
// client base class invokes onUpdate after each refresh and onDelete when a
// session is invalidated (refresh/revocation/expiry).
const sessionHooks = {
  onDelete(sub: string, cause: unknown) {
    const category = categorizeOauthError(cause)
    const message =
      cause instanceof Error
        ? cause.message
        : typeof cause === 'string'
          ? cause
          : undefined
    logger.warn('oauth: session deleted', {sub, cause: category, message})
    emitOauthTelemetry({
      type: 'oauth:sessionDeleted',
      payload: {cause: category, message: message?.slice(0, 200)},
    })
  },
  onUpdate(_sub: string) {
    emitOauthTelemetry({type: 'oauth:sessionRefreshed', payload: {}})
  },
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- package constructor type does not resolve in Linux CI
const BSKY_OAUTH_CLIENT = new ExpoOAuthClient({
  clientMetadata: {
    client_id: `${OAUTH_BASE_URL}/oauth-client-metadata-native.json`,
    client_name: OAUTH_CLIENT_NAME,
    client_uri: OAUTH_BASE_URL,
    redirect_uris: [NATIVE_REDIRECT_URI],
    scope: OAUTH_SCOPE,
    token_endpoint_auth_method: 'none',
    response_types: ['code'],
    grant_types: ['authorization_code', 'refresh_token'],
    application_type: 'native',
    dpop_bound_access_tokens: true,
  },
  handleResolver: 'https://blacksky.app',
  fetch: debugFetch,
  ...sessionHooks,
})

export function getOAuthClient() {
  return BSKY_OAUTH_CLIENT
}
