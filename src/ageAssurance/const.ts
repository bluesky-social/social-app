import {
  ageAssuranceRuleIDs as ids,
  type AppBskyAgeassuranceDefs,
} from '@atproto/api'

import {AgeAssuranceAccess} from '#/ageAssurance/types'

/**
 * Minimum age required to access the app at all.
 */
export const MIN_ACCESS_AGE = 13

// Fork divergence: in regions with no explicit age-assurance config (i.e. every
// non-regulated country - Germany and most of the world), grant Full access by
// default instead of failing safe to None. Upstream's fallback Default is None,
// which gates anyone without a self-declared birthdate - including OAuth/non-
// Bluesky-signup accounts that have no way to set one. Regulated regions are
// unaffected: they match server-provided rules and never hit this fallback.
export const FALLBACK_REGION_CONFIG: AppBskyAgeassuranceDefs.ConfigRegion = {
  countryCode: '*',
  regionCode: undefined,
  minAccessAge: MIN_ACCESS_AGE,
  rules: [
    {
      $type: ids.Default,
      access: AgeAssuranceAccess.Full,
    },
  ],
}
