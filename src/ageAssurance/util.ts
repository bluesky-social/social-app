import {useMemo} from 'react'
import type * as AgeRange from 'expo-age-range'
import {
  AppBskyAgeassuranceDefs,
  computeAgeAssuranceRegionAccess,
  getAgeAssuranceRegionConfig,
  type ModerationPrefs,
} from '@atproto/api'

import {getAge} from '#/lib/strings/time'
import {regionName} from '#/locale/helpers'
import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/const'
import {
  DEVICE_SIGNALS_SUPPORTED,
  FALLBACK_REGION_CONFIG,
  MIN_ACCESS_AGE,
} from '#/ageAssurance/const'
import {useAgeAssuranceServerDataContext} from '#/ageAssurance/data'
import {
  AgeAssuranceAccess,
  type AgeAssuranceFlags,
  type AgeAssuranceMetadata,
  type AgeAssuranceState,
} from '#/ageAssurance/types'
import {type Geolocation, useGeolocation} from '#/geolocation'
import {USRegionNameToRegionCode} from '#/geolocation/util'

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
 * Returns the verification methods permitted for a region *in addition to* the
 * always-supported KWS flow. Empty when the region doesn't specify any (the
 * historical KWS-only behavior).
 */
export function getRegionAdditionalVerificationMethods(
  region: AppBskyAgeassuranceDefs.ConfigRegion,
): NonNullable<
  AppBskyAgeassuranceDefs.ConfigRegion['additionalVerificationMethods']
> {
  return region.additionalVerificationMethods ?? []
}

/**
 * Whether a region permits satisfying age assurance via the native on-device
 * age APIs (Apple Declared Age Range / Google Play Age Signals).
 */
export function regionAllowsDeviceVerification(
  region: AppBskyAgeassuranceDefs.ConfigRegion,
): boolean {
  return getRegionAdditionalVerificationMethods(region).includes('device')
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
 * `getDeviceSignalsFromCacheForRegion`), so a grant captured in another region
 * won't reach here.
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
 * Ranks access levels from most to least restrictive so we can compare two
 * outcomes. Higher number = more access.
 */
const ACCESS_RANK: Record<string, number> = {
  [AgeAssuranceAccess.None]: 0,
  [AgeAssuranceAccess.Safe]: 1,
  [AgeAssuranceAccess.Full]: 2,
  // `unknown` isn't a real granted level; treat it as the floor.
  [AgeAssuranceAccess.Unknown]: -1,
}

/**
 * Whether correcting the user's declared age (i.e. updating their birthdate)
 * could meaningfully improve their standing in the current region.
 *
 * There are two ways a birthdate update can help:
 *
 * 1. Raising the rule-engine access level. Some regions grant `safe`/`full` off
 *    a sufficient *declared* age, so a user whose birthdate is wrong (too young)
 *    can unlock more by correcting it. Other regions gate higher access purely
 *    on an *assured* age (or account date), where a declared age changes
 *    nothing.
 * 2. Crossing the region's `minAccessAge`. Below it the user is hard-blocked
 *    with no verify path (see `isOverRegionMinAccessAge` gating in the
 *    NoAccessScreen); crossing it unlocks the verify flow, which is itself a
 *    path to more access even when the rule-engine level would still be `none`.
 *
 * We answer by simulating the real rule engine: hold `accountCreatedAt` and
 * `assuredAge` fixed and re-run access for a set of candidate declared ages
 * drawn from the region's declared-age rule thresholds and its `minAccessAge`.
 * If any candidate yields strictly more access, or crosses `minAccessAge` when
 * the current declared age doesn't, a birthdate update could help. Simulating
 * rather than statically inspecting rules means first-match precedence (e.g. an
 * assured/account rule pre-empting a declared rule) is handled correctly for
 * free.
 */
export function canBirthdateUpdateIncreaseAccess({
  region,
  metadata,
}: {
  region: AppBskyAgeassuranceDefs.ConfigRegion
  metadata?: AgeAssuranceMetadata
}): boolean {
  const baseline = computeAgeAssuranceRegionAccess(region, {
    accountCreatedAt: metadata?.accountCreatedAt,
    declaredAge: metadata?.declaredAge,
    assuredAge: metadata?.assuredAge,
  })
  const baselineRank =
    ACCESS_RANK[baseline?.access ?? AgeAssuranceAccess.Unknown]
  const baselineOverMin =
    metadata?.declaredAge !== undefined &&
    metadata.declaredAge >= region.minAccessAge

  /*
   * Candidate declared ages to probe: each declared-age rule's threshold and
   * the region's `minAccessAge`, plus one below each (to cover
   * `IfDeclaredUnderAge` and the min-age boundary). Anything a birthdate edit
   * could achieve is captured by crossing one of these thresholds, so we don't
   * need to sweep every integer.
   */
  const thresholds = new Set<number>([region.minAccessAge])
  for (const rule of region.rules) {
    if (
      AppBskyAgeassuranceDefs.isConfigRegionRuleIfDeclaredOverAge(rule) ||
      AppBskyAgeassuranceDefs.isConfigRegionRuleIfDeclaredUnderAge(rule)
    ) {
      thresholds.add(rule.age)
    }
  }
  const candidates = new Set<number>()
  for (const threshold of thresholds) {
    candidates.add(threshold)
    candidates.add(Math.max(0, threshold - 1))
  }

  for (const declaredAge of candidates) {
    const result = computeAgeAssuranceRegionAccess(region, {
      accountCreatedAt: metadata?.accountCreatedAt,
      declaredAge,
      assuredAge: metadata?.assuredAge,
    })
    const rank = ACCESS_RANK[result?.access ?? AgeAssuranceAccess.Unknown]
    const overMin = declaredAge >= region.minAccessAge
    if (rank > baselineRank || (overMin && !baselineOverMin)) return true
  }

  return false
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
  const allowsDeviceVerification =
    DEVICE_SIGNALS_SUPPORTED && regionAllowsDeviceVerification(regionConfig)

  return {
    isAgeRestricted,
    adultContentDisabled,
    chatDisabled,
    groupChatDisabled,
    hasDeclaredAge: metadata?.declaredAge !== undefined,
    isDeclaredUnderAdultAge,
    isOverRegionMinAccessAge,
    isOverAppMinAccessAge,
    allowsDeviceVerification,
  }
}

const USRegionCodeToRegionName: {[regionCode: string]: string} =
  Object.fromEntries(
    Object.entries(USRegionNameToRegionCode).map(([name, code]) => [
      code,
      name,
    ]),
  )
export function createGeolocationString(
  geolocation: Geolocation,
  appLang: string,
): string | undefined {
  const {countryCode, regionCode} = geolocation
  if (!countryCode) return undefined
  const country = regionName(countryCode, appLang)
  // If `regionName` couldn't resolve a real name and fell through to the raw
  // code, we'd rather show nothing than a bare ISO code in the prose.
  if (country === countryCode) return undefined
  if (regionCode && countryCode === 'US') {
    const state = USRegionCodeToRegionName[regionCode]
    if (state) return `${state}, ${country}`
  }
  return country
}
