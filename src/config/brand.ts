/**
 * Brand configuration - typed adapter over src/config/brand.json (the single
 * source of truth; field docs in brand.schema.json).
 *
 * Exposes the non-Lingui, non-colour brand values the app reads. Colours come
 * from brand-theme.ts and OAuth from oauth.ts (both also read brand.json);
 * user-facing "Bluesky" -> name copy lives in src/config/brandStrings.ts.
 *
 * Constraints:
 * - Import-free (no #/state, #/lib, RN APIs) so it can be imported anywhere,
 *   including low-level utils, without cycles.
 * - Env overrides (EXPO_PUBLIC_*) are layered HERE, not in the JSON.
 *
 * `links`   - brand-owned web pages (legal/support/download); point at your own.
 * `services`- atproto network endpoints; default to Bluesky's, override what you
 *             self-host. Staging/dev variants + wrappers live in lib/constants.ts.
 * `verification` - trusted-verifier lists (members + creators are honored).
 * `ageAssurance` - the mu age-assurance backend (serviceDid is the JWT audience).
 */
import brand from '#/config/brand.json'

export const BRAND = {
  /** Display name used in page/tab titles and in-app brand text. */
  name: brand.name,
  web: {
    /**
     * First-party web hostnames (bare host, no scheme). A link to one of these
     * renders as a rich embed, like a bsky.app link. bsky.app is always
     * first-party in addition to these.
     */
    hosts: brand.hosts,
  },
  links: brand.links,
  services: brand.services,
  verification: brand.verification,
  ageAssurance: {
    serviceUrl:
      process.env.EXPO_PUBLIC_AGE_SERVICE_URL || brand.ageAssurance.serviceUrl,
    serviceDid:
      process.env.EXPO_PUBLIC_AGE_SERVICE_DID || brand.ageAssurance.serviceDid,
  },
} as const
