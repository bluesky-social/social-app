/**
 * Eurosky fork configuration - non-Lingui brand values.
 *
 * Single source of truth for brand identity that is NOT user-facing Lingui
 * copy (those are handled by src/config/euroskyStrings.ts). Editing values
 * here is the recommended way to rebrand; the goal is to keep the diff
 * against upstream small so merges stay easy.
 *
 * Constraints:
 * - Keep this module import-free (no #/state, #/lib, RN APIs) so it can be
 *   imported from anywhere - including low-level utils - without cycles.
 * - Native-build values (bundle id, app display name, scheme, Sentry/EAS)
 *   live in app.config.js, which runs in Node at Expo config time and
 *   cannot import this TS. That rebrand is a separate, later pass; this
 *   file currently only covers what the running app reads.
 */
export const EUROSKY = {
  brand: {
    /** Display name used in page/tab titles and in-app brand text. */
    name: 'mu',
  },
  web: {
    /**
     * Web hostnames this app serves its own UI on. A link pasted to one of
     * these hosts (in the composer or a DM) is detected as a first-party
     * record - quote post, feed, list, or starter pack - and rendered as a
     * rich embed, exactly like a bsky.app link, instead of a plain link card.
     *
     * Bare hostnames only: no scheme, no trailing slash, no subdomain wildcard
     * (matching is exact). bsky.app is always treated as first-party in
     * addition to these.
     */
    hosts: ['mu.social'],
  },
  /**
   * mu age-assurance backend (the `mu-age-service` XRPC service). Stores
   * self-declared age threshold flags per DID so age gating works over OAuth
   * AND password sessions uniformly - without touching app.bsky preferences.
   *
   * `serviceDid` is the audience of the service-auth JWTs the app mints via
   * `com.atproto.server.getServiceAuth`; `serviceUrl` is where the XRPC ops
   * (`social.mu.age.getStatus` / `setStatus`) are served.
   */
  ageAssurance: {
    serviceUrl: 'https://age.mu.social',
    serviceDid: 'did:web:age.mu.social',
  },
} as const
