/**
 * Eurosky OAuth configuration - single source of truth.
 *
 * Primitive values live in `oauth.shared.json` so this module (the browser
 * client) and `scripts/gen-oauth-metadata.js` (the build-time static
 * `oauth-client-metadata.json` emitter) read identical `scope` /
 * `client_id` / `redirect_uris`. They cannot drift: change the domain or
 * scope in the JSON only.
 *
 * `client_id` MUST equal the HTTPS URL the metadata document is served at,
 * and every `redirect_uri` MUST share that origin. We use the site ROOT as
 * the redirect (no callback route) - callback params are detected at
 * startup in App.web.tsx.
 *
 * Import-free (no RN / #/state) so it is safe to import anywhere. The
 * actual client-metadata objects are built inline in oauth-web-client.ts
 * so their literal types match the library's expected input.
 */
import publicJwks from '#/config/oauth.public-jwks.json'
import shared from '#/config/oauth.shared.json'

/**
 * Prod base URL. Defaults to the app's hosting domain (mu.social); override at
 * build time with EXPO_PUBLIC_OAUTH_BASE_URL when needed (Expo inlines
 * EXPO_PUBLIC_* at build, so the value is fixed per build).
 */
export const OAUTH_BASE_URL: string =
  process.env.EXPO_PUBLIC_OAUTH_BASE_URL || shared.defaultBaseUrl

export const OAUTH_CLIENT_NAME: string = shared.clientName
/** Scope NEW authorization requests ask for. Kept minimal (transition + handle). */
export const OAUTH_SCOPE: string = shared.scope
/**
 * Scope advertised in the client metadata document (and the confidential
 * client's local metadata). MUST be a superset of OAUTH_SCOPE. We DECLARE more
 * than we REQUEST so older cached web bundles - built when prod requested
 * account:email/status - keep authorizing instead of failing with
 * `invalid_scope` against the current metadata. New logins still request only
 * OAUTH_SCOPE. Trim this back once those old bundles have aged out of caches.
 */
export const OAUTH_DECLARED_SCOPE: string = shared.declaredScope

/**
 * Granular scope that authorizes `com.atproto.identity.updateHandle`. Not in
 * OAUTH_SCOPE (initial logins stay transitional-only); acquired on demand by
 * the handle step-up. Must remain within OAUTH_DECLARED_SCOPE.
 */
export const OAUTH_HANDLE_GRANT_SCOPE = 'identity:handle'
/** Scope a handle step-up requests: the transitional base plus the handle grant. */
export const OAUTH_HANDLE_SCOPE = `${OAUTH_SCOPE} ${OAUTH_HANDLE_GRANT_SCOPE}`

export const OAUTH_HANDLE_RESOLVER: string = shared.handleResolver
/** PDS the "Create account" flow sends the user to (prompt: 'create'). */
export const OAUTH_SIGNUP_PDS_HOST: string = shared.signupPdsHost

/**
 * Public JWKS for the confidential client. Inlined into the generated
 * `oauth-client-metadata.json` (by gen-oauth-metadata.js) AND advertised by
 * the running prod client - same file, so they cannot drift. Public key
 * only (no `d`); the private key lives solely in the assertion Worker.
 */
export const OAUTH_PUBLIC_JWKS: {keys: Record<string, unknown>[]} = publicJwks

/**
 * Stateless edge script that signs the `private_key_jwt` client assertion
 * (confidential client; the private key never reaches the browser). Deployed
 * as a Bunny Edge Script - see ../../services/oauth. Prod-only; loopback/dev
 * stays a public client and never calls this. Override per deployment with
 * EXPO_PUBLIC_OAUTH_ASSERTION_URL (Expo inlines EXPO_PUBLIC_* at build).
 * Default points at a conventional subdomain route - set it to wherever the
 * script is actually deployed.
 */
export const OAUTH_ASSERTION_URL: string =
  process.env.EXPO_PUBLIC_OAUTH_ASSERTION_URL ||
  'https://oauth.mu.social/client-assertion'
