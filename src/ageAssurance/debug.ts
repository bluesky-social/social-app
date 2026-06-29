import type * as AgeRange from 'expo-age-range'
import {
  ageAssuranceRuleIDs as ids,
  type AppBskyAgeassuranceGetState,
} from '@atproto/api'

import {type OtherRequiredData} from '#/ageAssurance/data'
import {type AgeAssuranceConfigRegion} from '#/ageAssurance/types'
import {IS_DEV, IS_E2E} from '#/env'
import {type Geolocation} from '#/geolocation'

/**
 * Debug-only config shape. Mirrors {@link AppBskyAgeassuranceDefs.Config} but
 * uses {@link AgeAssuranceConfigRegion}, which carries the not-yet-in-lexicon
 * `verificationMethods` field so we can prototype on-device verification.
 */
export type DebugConfig = {
  regions: AgeAssuranceConfigRegion[]
}

export const enabled = (IS_DEV && false) || IS_E2E

export const geolocation: Geolocation | undefined = enabled
  ? {
      countryCode: 'AA',
      regionCode: undefined,
    }
  : undefined

const deviceGeolocationEnabled = false || IS_E2E
export const deviceGeolocation: Geolocation | undefined =
  enabled && deviceGeolocationEnabled
    ? {
        countryCode: 'AA',
        regionCode: undefined,
        ...geolocation,
      }
    : undefined

export const otherRequiredData: OtherRequiredData = {
  birthdate: new Date(2000, 12, 1).toISOString(),
}

const serverStateEnabled = false || IS_E2E
export const serverState: AppBskyAgeassuranceGetState.OutputSchema | undefined =
  serverStateEnabled
    ? {
        state: {
          lastInitiatedAt: undefined, // new Date(2025, 1, 1).toISOString(),
          status: 'unknown',
          access: 'unknown',
        },
        metadata: {
          accountCreatedAt: new Date(2023, 1, 1).toISOString(),
        },
      }
    : undefined

export const config: DebugConfig = {
  regions: [
    {
      countryCode: 'AA',
      regionCode: undefined,
      minAccessAge: 13,
      rules: [
        {
          $type: ids.Default,
          access: 'full',
        },
      ],
    },
    {
      // On-device verification region. KWS is included as a fallback for
      // platforms without the native age API (e.g. web) or when the device
      // result is insufficient.
      countryCode: 'US',
      regionCode: 'TX',
      minAccessAge: 18,
      verificationMethods: ['device', 'kws'],
      rules: [
        {
          age: 18,
          access: 'full',
          $type: ids.IfAssuredOverAge,
        },
        {
          access: 'none',
          $type: ids.Default,
        },
      ],
    },
    {
      countryCode: 'GB',
      minAccessAge: 13,
      rules: [
        {
          age: 18,
          access: 'full',
          $type: ids.IfAssuredOverAge,
        },
        {
          age: 13,
          access: 'safe',
          $type: ids.IfDeclaredOverAge,
        },
        {
          access: 'none',
          $type: ids.Default,
        },
      ],
    },
    {
      countryCode: 'AU',
      minAccessAge: 16,
      rules: [
        {
          date: '2025-12-10T00:00:00Z',
          access: 'none',
          $type: ids.IfAccountNewerThan,
        },
        {
          age: 18,
          access: 'full',
          $type: ids.IfAssuredOverAge,
        },
        {
          age: 16,
          access: 'safe',
          $type: ids.IfAssuredOverAge,
        },
        {
          age: 16,
          access: 'safe',
          $type: ids.IfDeclaredOverAge,
        },
        {
          access: 'none',
          $type: ids.Default,
        },
      ],
    },
    {
      countryCode: 'US',
      regionCode: 'SD',
      minAccessAge: 13,
      rules: [
        {
          age: 18,
          access: 'full',
          $type: ids.IfAssuredOverAge,
        },
        {
          age: 13,
          access: 'safe',
          $type: ids.IfDeclaredOverAge,
        },
        {
          access: 'none',
          $type: ids.Default,
        },
      ],
    },
    {
      countryCode: 'US',
      regionCode: 'WY',
      minAccessAge: 13,
      rules: [
        {
          age: 18,
          access: 'full',
          $type: ids.IfAssuredOverAge,
        },
        {
          age: 13,
          access: 'safe',
          $type: ids.IfDeclaredOverAge,
        },
        {
          access: 'none',
          $type: ids.Default,
        },
      ],
    },
    {
      countryCode: 'US',
      regionCode: 'OH',
      minAccessAge: 13,
      rules: [
        {
          age: 18,
          access: 'full',
          $type: ids.IfAssuredOverAge,
        },
        {
          age: 13,
          access: 'safe',
          $type: ids.IfDeclaredOverAge,
        },
        {
          access: 'none',
          $type: ids.Default,
        },
      ],
    },
    {
      countryCode: 'US',
      regionCode: 'MS',
      minAccessAge: 18,
      rules: [
        {
          age: 18,
          access: 'full',
          $type: ids.IfAssuredOverAge,
        },
        {
          access: 'none',
          $type: ids.Default,
        },
      ],
    },
    {
      countryCode: 'US',
      regionCode: 'VA',
      minAccessAge: 16,
      rules: [
        {
          age: 16,
          access: 'full',
          $type: ids.IfAssuredOverAge,
        },
        {
          age: 16,
          access: 'full',
          $type: ids.IfDeclaredOverAge,
        },
        {
          access: 'none',
          $type: ids.Default,
        },
      ],
    },
    {
      countryCode: 'US',
      regionCode: 'TN',
      minAccessAge: 18,
      rules: [
        {
          age: 18,
          access: 'full',
          $type: ids.IfAssuredOverAge,
        },
        {
          age: 18,
          access: 'full',
          $type: ids.IfDeclaredOverAge,
        },
        {
          access: 'none',
          $type: ids.Default,
        },
      ],
    },
    {
      countryCode: 'BR',
      minAccessAge: 13,
      rules: [
        {
          age: 18,
          access: 'full',
          $type: ids.IfAssuredOverAge,
        },
        {
          age: 18,
          access: 'full',
          $type: ids.IfDeclaredOverAge,
        },
        {
          age: 13,
          access: 'safe',
          $type: ids.IfDeclaredOverAge,
        },
        {
          access: 'none',
          $type: ids.Default,
        },
      ],
    },
  ],
}

/**
 * When debug is enabled we mock the `deviceSignals` response by default. Set
 * this to `false` to hit the real native age API (`expo-age-range`) so the OS
 * age prompt actually shows — useful for testing the device flow on a physical
 * device.
 */
export const useMockDeviceSignalsAPIResponse = true
export const deviceSignals: AgeRange.AgeRangeResponse | undefined =
  useMockDeviceSignalsAPIResponse
    ? {
        // Simulates the OS reporting the user is at least 18. Lower this below
        // a region's IfAssuredOverAge threshold to exercise the KWS fallback.
        lowerBound: 16,
        upperBound: null,
      }
    : undefined

export async function resolve<T>(data: T) {
  await new Promise(y => setTimeout(y, 500)) // simulate network
  return data
}
