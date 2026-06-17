/**
 * Brand configuration - non-Lingui brand values.
 *
 * Single source of truth for brand identity that is NOT user-facing Lingui
 * copy (those are handled by src/config/brandStrings.ts). Editing values
 * here is the recommended way to rebrand; the goal is to keep the diff
 * against upstream small so merges stay easy.
 *
 * Layout:
 * - `name` / `web`         identity (display name, web hosts)
 * - `links`                brand-owned web pages (legal, support, download)
 * - `services`             atproto network endpoints (default to Bluesky's)
 * - `ageAssurance`         our age-assurance backend
 *
 * Constraints:
 * - Keep this module import-free (no #/state, #/lib, RN APIs) so it can be
 *   imported from anywhere - including low-level utils - without cycles.
 * - Native-build values (bundle id, app display name, scheme, Sentry/EAS)
 *   live in app.config.js, which runs in Node at Expo config time and
 *   cannot import this TS. That rebrand is a separate, later pass; this
 *   file currently only covers what the running app reads.
 *
 * `name` + `web.hosts` come from `brand-meta.json` (shared with app.config.js
 * and the web codegen so the brand name/host never drift); the rest is inline.
 */
import brandMeta from '#/config/brand-meta.json'

export const BRAND = {
  /** Display name used in page/tab titles and in-app brand text. */
  name: brandMeta.name,
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
    hosts: brandMeta.hosts,
  },
  /**
   * Brand-owned web pages linked from the UI. A new brand should host its own
   * versions and point these at them.
   *
   * `tos` / `privacy` / `community` are already brand-hosted. The support and
   * remaining legal pages still point at Bluesky's pages as a fallback so the
   * links keep working; replace them when the brand has its own. Keeping them
   * here (rather than hardcoded across screens) makes that a single edit.
   */
  links: {
    // Legal - brand-hosted.
    tos: 'https://hello.mu.social/terms',
    privacy: 'https://hello.mu.social/privacy',
    community: 'https://hello.mu.social/guidelines',
    // Support + remaining legal - still Bluesky's, replace per brand.
    copyright: 'https://bsky.social/about/support/copyright',
    support: 'https://bsky.social/about/support',
    faq: 'https://bsky.social/about/faq',
    // Help-center article explaining what content is public on the network.
    dataPrivacy:
      'https://blueskyweb.zendesk.com/hc/en-us/articles/15835264007693-Data-Privacy',
    helpDesk: 'https://blueskyweb.zendesk.com/hc/en-us',
    supportRequest: 'https://blueskyweb.zendesk.com/hc/requests/new',
    // App download + service status.
    download: 'https://bsky.app/download',
    statusPage: 'https://status.bsky.app/',
  },
  /**
   * atproto network endpoints. These default to the public Bluesky network: a
   * brand that runs as a client *on* Bluesky keeps them as-is, and overrides
   * only the ones it self-hosts. Staging/dev variants and the helper functions
   * that wrap these live in src/lib/constants.ts.
   */
  services: {
    pds: 'https://bsky.social',
    pdsDid: 'did:web:bsky.social',
    publicApi: 'https://public.api.bsky.app',
    appView: 'https://api.bsky.app',
    appViewDid: 'did:web:api.bsky.app',
    chat: 'https://api.bsky.chat',
    embed: 'https://embed.bsky.app',
    gif: 'https://gifs.bsky.app',
    video: 'https://video.bsky.app',
    videoDid: 'did:web:video.bsky.app',
  },
  /**
   * mu age-assurance backend (the `mu-age-service` XRPC service). Stores
   * self-declared age threshold flags per DID so age gating works over OAuth
   * AND password sessions uniformly - without touching app.bsky preferences.
   *
   * `serviceDid` is the audience of the service-auth JWTs the app mints via
   * `com.atproto.server.getServiceAuth`; `serviceUrl` is where the XRPC ops
   * (`social.mu.age.getStatus` / `setStatus`) are served.
   *
   * Overridable at build time for testing against a non-prod deployment (e.g.
   * a Bunny test domain): set EXPO_PUBLIC_AGE_SERVICE_URL +
   * EXPO_PUBLIC_AGE_SERVICE_DID. The DID must match the deployed script's
   * SERVICE_DID env var.
   */
  ageAssurance: {
    serviceUrl:
      process.env.EXPO_PUBLIC_AGE_SERVICE_URL || 'https://age.mu.social',
    serviceDid:
      process.env.EXPO_PUBLIC_AGE_SERVICE_DID || 'did:web:age.mu.social',
  },
} as const
