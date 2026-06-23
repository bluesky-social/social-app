import {useMemo} from 'react'
import type * as AgeRange from 'expo-age-range'
import {
  type AppBskyAgeassuranceDefs,
  getAgeAssuranceRegionConfig,
  type ModerationPrefs,
} from '@atproto/api'

import {getAge} from '#/lib/strings/time'
import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/const'
import {FALLBACK_REGION_CONFIG, MIN_ACCESS_AGE} from '#/ageAssurance/const'
import {useAgeAssuranceServerDataContext} from '#/ageAssurance/data'
import {
  AgeAssuranceAccess,
  type AgeAssuranceConfigRegion,
  type AgeAssuranceFlags,
  type AgeAssuranceMetadata,
  type AgeAssuranceState,
  type AgeAssuranceVerificationMethod,
} from '#/ageAssurance/types'
import {type Geolocation, useGeolocation} from '#/geolocation'

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

  return region || FALLBACK_REGION_CONFIG
}

/**
 * Returns the verification methods permitted for a region, defaulting to
 * `['kws']` when the region doesn't specify any (the historical behavior).
 *
 * NOTE: `verificationMethods` is not yet part of the lexicon, so we read it via
 * {@link AgeAssuranceConfigRegion}. See that type for the migration note.
 */
export function getRegionVerificationMethods(
  region: AppBskyAgeassuranceDefs.ConfigRegion,
): AgeAssuranceVerificationMethod[] {
  const methods = (region as AgeAssuranceConfigRegion).verificationMethods
  return methods && methods.length > 0 ? methods : ['kws']
}

/**
 * Whether a region permits satisfying age assurance via the native on-device
 * age APIs (Apple Declared Age Range / Google Play Age Signals).
 */
export function regionAllowsDeviceVerification(
  region: AppBskyAgeassuranceDefs.ConfigRegion,
): boolean {
  return getRegionVerificationMethods(region).includes('device')
}

/**
 * Builds the cache key for a region's device signals — a `country[-region]`
 * string (e.g. `US-TX` or `GB`). This is the key under which on-device
 * assurance is stored and read back, which is what binds a grant to its capture
 * region.
 */
export function createRegionKey(region: {
  countryCode: string
  regionCode?: string
}): string {
  return region.regionCode
    ? `${region.countryCode}-${region.regionCode}`
    : region.countryCode
}

/**
 * Derives age assurance data from native device signals for the given region,
 * but only when the region permits device verification. The signals are
 * expected to already be resolved to the user's current region (see
 * `getDeviceSignalsFromCacheForCurrentRegion`), so a grant captured in another
 * region won't reach here.
 *
 * The OS-provided `lowerBound` is the minimum age the platform will attest to,
 * which maps onto the `assuredAge` input of the rule engine (i.e.
 * `IfAssuredOverAge`/`IfAssuredUnderAge` rules).
 *
 * Always returns an object (so callers can spread it unconditionally); fields
 * are populated only when device verification applies and the OS provided
 * usable data.
 */
export function getAgeAssuranceDataFromDeviceSignals(
  region: AppBskyAgeassuranceDefs.ConfigRegion,
  deviceSignals: AgeRange.AgeRangeResponse | undefined,
): {
  assuredAge?: number
} {
  if (!regionAllowsDeviceVerification(region)) return {}
  const lowerBound = deviceSignals?.lowerBound
  return {
    assuredAge: typeof lowerBound === 'number' ? lowerBound : undefined,
  }
}

/**
 * Hook to get the age assurance region config based on current geolocation.
 * Does not fall-back to our app defaults. If no config is found, returns
 * undefined, which indicates no regional age assurance rules apply.
 */
export function useAgeAssuranceRegionConfig() {
  const geolocation = useGeolocation()
  const {config} = useAgeAssuranceServerDataContext()
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
 * Hook to get the age assurance region config based on current geolocation.
 * Falls back to our app defaults if no region config is found.
 */
export function useAgeAssuranceRegionConfigWithFallback() {
  return useAgeAssuranceRegionConfig() || FALLBACK_REGION_CONFIG
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
 * Returns whether the date (converted to an age as a whole integer) is under
 * the provided minimum age.
 */
export function isUnderAge(birthDate: string, age: number) {
  return getAge(new Date(birthDate)) < age
}

export function getBirthdateStringFromAge(age: number) {
  const today = new Date()
  return new Date(
    today.getFullYear() - age,
    today.getMonth(),
    today.getDate() - 1, // set to day before to ensure age is reached
  ).toISOString()
}

export const makeAgeRestrictedModerationPrefs = (
  prefs: ModerationPrefs,
): ModerationPrefs => ({
  ...prefs,
  adultContentEnabled: false,
  labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
})

export function computeAgeAssuranceFlags({
  state,
  regionConfig,
  metadata,
}: {
  state: AgeAssuranceState
  regionConfig: AppBskyAgeassuranceDefs.ConfigRegion
  metadata?: AgeAssuranceMetadata
}): AgeAssuranceFlags {
  const isAgeRestricted = state.access !== AgeAssuranceAccess.Full
  const chatDisabled = isAgeRestricted
  const isDeclaredUnderAdultAge = metadata?.declaredAge
    ? metadata.declaredAge < 18
    : true
  const groupChatDisabled = chatDisabled || isDeclaredUnderAdultAge
  const isOverRegionMinAccessAge = metadata?.declaredAge
    ? metadata.declaredAge >= regionConfig.minAccessAge
    : false
  const isOverAppMinAccessAge = metadata?.declaredAge
    ? metadata.declaredAge >= MIN_ACCESS_AGE
    : false
  const adultContentDisabled =
    state.access !== AgeAssuranceAccess.Full || isDeclaredUnderAdultAge

  return {
    isAgeRestricted,
    adultContentDisabled,
    chatDisabled,
    groupChatDisabled,
    isDeclaredUnderAdultAge,
    isOverRegionMinAccessAge,
    isOverAppMinAccessAge,
  }
}
