import {
  ageAssuranceRuleIDs as ids,
  type AppBskyAgeassuranceDefs,
} from '@atproto/api'

import {AgeAssuranceAccess} from '#/ageAssurance/types'

/**
 * Minimum age required to access the app at all.
 */
export const MIN_ACCESS_AGE = 13

export const FALLBACK_REGION_CONFIG: AppBskyAgeassuranceDefs.ConfigRegion = {
  countryCode: '*',
  regionCode: undefined,
  minAccessAge: MIN_ACCESS_AGE,
  rules: [
    {
      $type: ids.IfDeclaredOverAge,
      age: MIN_ACCESS_AGE,
      access: AgeAssuranceAccess.Full,
    },
    {
      $type: ids.Default,
      access: AgeAssuranceAccess.None,
    },
  ],
}
