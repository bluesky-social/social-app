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
import shared from '#/config/oauth.shared.json'

/**
 * Prod base URL. Hardcoded to the Cloudflare Pages domain; override at
 * build time with EXPO_PUBLIC_OAUTH_BASE_URL when the real domain lands
 * (Expo inlines EXPO_PUBLIC_* at build, so the value is fixed per build).
 */
export const OAUTH_BASE_URL: string =
  process.env.EXPO_PUBLIC_OAUTH_BASE_URL || shared.defaultBaseUrl

export const OAUTH_CLIENT_NAME: string = shared.clientName
export const OAUTH_SCOPE: string = shared.scope
export const OAUTH_HANDLE_RESOLVER: string = shared.handleResolver
/** PDS the "Create account" flow sends the user to (prompt: 'create'). */
export const OAUTH_SIGNUP_PDS_HOST: string = shared.signupPdsHost
