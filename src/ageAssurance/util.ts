import {useMemo} from 'react'
import {
  ageAssuranceRuleIDs as ids,
  type AppBskyAgeassuranceDefs,
  getAgeAssuranceRegionConfig,
} from '@atproto/api'

import {getAge} from '#/lib/strings/time'
import {useAgeAssuranceDataContext} from '#/ageAssurance/data'
import {AgeAssuranceAccess} from '#/ageAssurance/types'
import {type Geolocation, useGeolocation} from '#/geolocation'

const DEFAULT_MIN_AGE = 13

/**
 * Get age assurance region config based on geolocation, with fallback to
 * app defaults if no region config is found.
 *
 * See {@link getAgeAssuranceRegionConfig} for the generic option, which can
 * return undefined if the geolocation does not match any AA region.
 */
export function getAgeAssuranceRegionConfigWithFallback(
  config: AppBskyAgeassuranceDefs.Config,
  geolocation: Geolocation,
): AppBskyAgeassuranceDefs.ConfigRegion {
  const region = getAgeAssuranceRegionConfig(config, {
    countryCode: geolocation.countryCode ?? '',
    regionCode: geolocation.regionCode,
  })

  return (
    region || {
      countryCode: '*',
      regionCode: undefined,
      rules: [
        {
          $type: ids.IfDeclaredOverAge,
          age: DEFAULT_MIN_AGE,
          access: AgeAssuranceAccess.Full,
        },
        {
          $type: ids.Default,
          access: AgeAssuranceAccess.None,
        },
      ],
    }
  )
}

/**
 * Hook to get the age assurance region config based on current geolocation.
 * Does not fall-back to our app defaults. If no config is found, returns
 * undefined, which indicates no regional age assurance rules apply.
 */
export function useAgeAssuranceRegionConfig() {
  const geolocation = useGeolocation()
  const {config} = useAgeAssuranceDataContext()
  return useMemo(() => {
    if (!config) return
    // use generic helper, we want to potentially return undefined
    return getAgeAssuranceRegionConfig(config, {
      countryCode: geolocation.countryCode ?? '',
      regionCode: geolocation.regionCode,
    })
  }, [config, geolocation])
}

/**
 * Some users may have erroneously set their birth date to the current date
 * if one wasn't set on their account. We previously didn't do validation on
 * the bday dialog, and it defaulted to the current date. This bug _has_ been
 * seen in production, so we need to check for it where possible.
 */
export function isLegacyBirthdateBug(birthDate: string) {
  return ['2025', '2024', '2023'].includes((birthDate || '').slice(0, 4))
}

/**
 * Returns whether the user is under the minimum age required to use the app.
 * This applies to all regions.
 */
export function isUserUnderMinimumAge(birthDate: string) {
  return getAge(new Date(birthDate)) < DEFAULT_MIN_AGE
}

export function isUserUnderAdultAge(birthDate: string) {
  return getAge(new Date(birthDate)) < 18
}
