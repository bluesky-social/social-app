import {BrowserOAuthClient} from '@atproto/oauth-client-browser'

import {logger} from '#/logger'
import {
  OAUTH_BASE_URL,
  OAUTH_CLIENT_NAME,
  OAUTH_HANDLE_RESOLVER,
  OAUTH_SCOPE,
  OAUTH_SIGNUP_PDS_HOST,
} from '#/config/oauth'

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

// Session lifecycle hooks. @atproto/oauth-client-browser ^0.3 removed the
// post-construction addEventListener surface; the base client exposes
// onDelete/onUpdate via constructor SessionHooks instead. We only log
// (telemetry was deliberately dropped from the Eurosky port).
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

function createWebOAuthClient(): BrowserOAuthClient {
  // Built inline so the literal field types match BrowserOAuthClient's
  // expected metadata input (extracting to a helper widened them).
  if (isLoopback()) {
    // The atproto authorization server uses hardcoded metadata for
    // `http://localhost` client_ids; scope + redirect_uri must be encoded
    // into the client_id query or only the bare "atproto" scope is granted
    // (which breaks appview/chat).
    const port =
      typeof window !== 'undefined' && window.location.port
        ? `:${window.location.port}`
        : ''
    const redirectUri = `http://127.0.0.1${port}/`
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
      handleResolver: OAUTH_HANDLE_RESOLVER,
      ...sessionHooks,
    })
  }

  return new BrowserOAuthClient({
    clientMetadata: {
      client_id: `${OAUTH_BASE_URL}/oauth-client-metadata.json`,
      client_name: OAUTH_CLIENT_NAME,
      client_uri: OAUTH_BASE_URL,
      redirect_uris: [`${OAUTH_BASE_URL}/`],
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
}

const WEB_OAUTH_CLIENT = createWebOAuthClient()

export function getWebOAuthClient(): BrowserOAuthClient {
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
