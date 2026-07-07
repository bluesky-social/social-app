import {BrowserOAuthClient} from '@atproto/oauth-client-browser'

import {logger} from '#/logger'
import {
  categorizeOauthError,
  emitOauthTelemetry,
  truncateOauthMessage,
} from '#/state/session/oauth-telemetry'
import {type Metrics} from '#/analytics/metrics'

const OAUTH_SCOPE =
  'atproto transition:generic transition:email transition:chat.bsky identity:handle account:email?action=manage account:status?action=manage'

function getOAuthBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.EXPO_PUBLIC_OAUTH_BASE_URL || 'https://blacksky.community'
}

function getOAuthClientName(): string {
  if (typeof window !== 'undefined' && window.__BRAND_CONFIG__) {
    return window.__BRAND_CONFIG__.metadata.displayName
  }
  return process.env.EXPO_PUBLIC_OAUTH_CLIENT_NAME || 'Blacksky Community'
}

function isLoopback() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host === '::1'
  )
}

// Session hooks passed at construction. @atproto/oauth-client-browser ^0.3
// removed the post-construction `addEventListener('deleted'|'updated', ...)`
// surface; the OAuthClient base class now exposes `onDelete`/`onUpdate`
// callbacks via SessionHooks instead. Functionally equivalent — we still
// observe the same lifecycle events, just wired up earlier.
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

// Lets the debug button mark the next refresh attempt as user-initiated so
// the fetch wrapper can label its telemetry accordingly. Cleared after the
// next /oauth/token round-trip completes.
let pendingRefreshContext: Metrics['oauth:refreshFailed']['triggerContext'] =
  'background'
export function markNextRefreshContext(
  context: Metrics['oauth:refreshFailed']['triggerContext'],
) {
  pendingRefreshContext = context
}

// Wraps the global fetch so we can observe every OAuth-provider round trip
// without depending on the OAuth client's higher-level `deleted`/`updated`
// events. Notably this captures network failures and transient 5xx responses
// that don't cause the client to delete the session — exactly the class of
// failures the higher-level events miss.
const oauthInstrumentedFetch: typeof fetch = async (input, init) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url
  const method =
    init?.method?.toUpperCase() ??
    (input instanceof Request ? input.method.toUpperCase() : undefined)
  const isTokenEndpoint = method === 'POST' && url.includes('/oauth/token')
  if (!isTokenEndpoint) {
    return fetch(input, init)
  }
  const triggerContext = pendingRefreshContext
  pendingRefreshContext = 'background'
  try {
    const res = await fetch(input, init)
    if (!res.ok) {
      // Try to parse the OAuth error response body for categorization.
      // Clone so we don't consume the body the OAuth client will read next.
      let errorBody: string | undefined
      try {
        errorBody = await res.clone().text()
      } catch {}
      // `use_dpop_nonce` is the server's standard request to retry the call
      // with a freshly-issued DPoP nonce — it's expected control flow at the
      // start of every refresh, not a failure. Skip it.
      if (errorBody?.includes('use_dpop_nonce')) {
        return res
      }
      const errorCategory: Metrics['oauth:refreshFailed']['errorCategory'] =
        res.status >= 500
          ? 'serverError'
          : categorizeOauthError(errorBody ?? `HTTP ${res.status}`)
      emitOauthTelemetry({
        type: 'oauth:refreshFailed',
        payload: {
          triggerContext,
          errorCategory,
          httpStatus: res.status,
          message: errorBody?.slice(0, 200),
        },
      })
    }
    return res
  } catch (err) {
    emitOauthTelemetry({
      type: 'oauth:refreshFailed',
      payload: {
        triggerContext,
        errorCategory: categorizeOauthError(err),
        message: truncateOauthMessage(err),
      },
    })
    throw err
  }
}

function createWebOAuthClient() {
  if (isLoopback()) {
    // Loopback client: encode scope and redirect_uri in the client_id URL.
    // The authorization server uses hardcoded metadata for http://localhost
    // client_ids. Without explicit scope, only "atproto" is granted, which
    // lacks the transition:* scopes needed for appview/chat APIs.
    const port = window.location.port ? `:${window.location.port}` : ''
    // The AuthCallback route at /auth/web/callback is what calls
    // client.init() to exchange the auth code. Land there in the loopback
    // flow too — otherwise the fragment params on `/` are never read and
    // the user appears unauthenticated after the redirect.
    const redirectUri = `http://127.0.0.1${port}/auth/web/callback`
    const clientId =
      `http://localhost` +
      `?redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(OAUTH_SCOPE)}`

    return new BrowserOAuthClient({
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
      handleResolver: 'https://blacksky.app',
      fetch: oauthInstrumentedFetch,
      ...sessionHooks,
    })
  }

  const baseUrl = getOAuthBaseUrl()
  const clientName = getOAuthClientName()

  return new BrowserOAuthClient({
    clientMetadata: {
      client_id: `${baseUrl}/oauth-client-metadata.json`,
      client_name: clientName,
      client_uri: baseUrl,
      redirect_uris: [`${baseUrl}/auth/web/callback`],
      scope: OAUTH_SCOPE,
      token_endpoint_auth_method: 'none',
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      application_type: 'web',
      dpop_bound_access_tokens: true,
    },
    handleResolver: 'https://blacksky.app',
    fetch: oauthInstrumentedFetch,
    ...sessionHooks,
  })
}

const BSKY_OAUTH_CLIENT = createWebOAuthClient()

export function getWebOAuthClient() {
  return BSKY_OAUTH_CLIENT
}
