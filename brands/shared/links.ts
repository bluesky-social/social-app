/**
 * Default brand-page links. These point at coseeker.org (the default
 * community's PDS host) the same way Bluesky's point at bsky.social. Brands
 * spread this into their `links` and override individual entries as needed
 * (see `brands/bluesky/brand.ts`). The fallback for any brand that does not
 * override is coseeker.org.
 */
/**
 * Where the "Request Invite Code" CTA in the web welcome modal points. Shared
 * by the invite-only community brands (coseeker, k4m2a, mdparivaar); Bluesky
 * does not use it (open signup). See `welcomeModal` in `src/brand/types.ts`.
 */
export const BRAND_INVITE_REQUEST_URL = 'https://forms.gle/Kob45PoNdLo2NrWm8'

export const DEFAULT_BRAND_PAGE_LINKS = {
  helpDesk: 'https://coseeker.org/help.html',
  feedbackForm: 'https://forms.gle/XnFKKop2tExwZbUe6',
  tos: 'https://coseeker.org/terms.html',
  privacy: 'https://coseeker.org/privacy.html',
  community: 'https://coseeker.org/guidelines.html',
  communityDeprecated: 'https://coseeker.org/guidelines.html',
  copyright: 'https://coseeker.org/guidelines.html',
}
