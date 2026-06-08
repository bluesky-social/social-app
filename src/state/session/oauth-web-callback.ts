/**
 * Web OAuth callback glue, kept out of App.web.tsx so that file gains only
 * an import + two call lines (minimal upstream merge surface).
 *
 * No dedicated callback route: redirect_uri is the site root, so the
 * provider returns the user to `/` with params, and we finish sign-in at
 * app startup here.
 */
import * as persisted from '#/state/persisted'
import {type SessionApiContext} from '#/state/session/types'
import {getWebOAuthClient, OAUTH_SIGNUP_STATE} from './oauth-web-client'

/**
 * The OAuth loopback spec requires an IP-based origin (127.0.0.1), not
 * "localhost". The auth server redirects to 127.0.0.1, but IndexedDB is
 * per-origin, so PKCE state stored under "localhost" is unreachable from
 * "127.0.0.1". Force the origin early so signIn() and the callback share
 * it. No-op in production. Call once at module load.
 */
export function maybeRedirectLoopbackHost(): void {
  if (typeof window === 'undefined') return
  if (window.location.hostname === 'localhost') {
    const url = new URL(window.location.href)
    url.hostname = '127.0.0.1'
    window.location.replace(url.href)
  }
}

function hasOAuthCallbackParams(): boolean {
  if (typeof window === 'undefined') return false
  // Params arrive in the hash fragment (response_mode=fragment) or query.
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const query = new URLSearchParams(window.location.search)
  const params = hash.has('state') ? hash : query
  return params.has('state') && (params.has('code') || params.has('error'))
}

/**
 * If the current URL is an OAuth callback, finish the flow and log the user
 * in. Returns true if it handled a callback (caller should stop its normal
 * resume path), false otherwise.
 */
export async function tryFinishWebOAuthSignIn(
  login: SessionApiContext['login'],
): Promise<boolean> {
  if (!hasOAuthCallbackParams()) return false
  const client = getWebOAuthClient()
  const result = await client.init()
  if (result?.session) {
    // A fresh signup (prompt=create) is created on the external PDS page, which
    // never runs our in-app signup wizard - so start onboarding here, the same
    // way that wizard does. Plain sign-ins carry no state and are untouched.
    if (result.state === OAUTH_SIGNUP_STATE) {
      await persisted.write('onboarding', {step: 'Welcome'})
    }
    await login(
      {
        service: '',
        identifier: '',
        password: '',
        oauthSession: result.session,
      },
      'LoginForm',
    )
    // Drop the callback params from the URL.
    window.history.replaceState(null, '', window.location.pathname)
    return true
  }
  return false
}
