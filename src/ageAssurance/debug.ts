import type * as AgeRange from 'expo-age-range'
import {toDatetimeString} from '@atproto/syntax'

import {type OtherRequiredData} from '#/ageAssurance/data'
import {IS_DEV, IS_E2E} from '#/env'
import {type Geolocation} from '#/geolocation'
import {type app} from '#/lexicons'

export const enabled = (IS_DEV && false) || IS_E2E

export const geolocation: Geolocation | undefined = enabled
  ? {
      countryCode: 'AA',
      regionCode: undefined,
    }
  : undefined

export const deviceGeolocation: Geolocation | undefined = enabled
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
export const serverState:
  | app.bsky.ageassurance.getState.$OutputBody
  | undefined = serverStateEnabled
  ? {
      state: {
        lastInitiatedAt: undefined, // new Date(2025, 1, 1).toISOString(),
        status: 'unknown',
        access: 'unknown',
      },
      metadata: {
        accountCreatedAt: toDatetimeString(new Date(2023, 1, 1)),
      },
    }
  : undefined

export const config: app.bsky.ageassurance.defs.Config = {
  regions: [
    {
      countryCode: 'AA',
      regionCode: undefined,
      minAccessAge: 13,
      rules: [
        {
          $type: 'app.bsky.ageassurance.defs#configRegionRuleDefault',
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
      additionalVerificationMethods: ['device'],
      rules: [
        {
          age: 18,
          access: 'full',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfAssuredOverAge',
        },
        {
          access: 'none',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleDefault',
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
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfAssuredOverAge',
        },
        {
          age: 13,
          access: 'safe',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfDeclaredOverAge',
        },
        {
          access: 'none',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleDefault',
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
          $type:
            'app.bsky.ageassurance.defs#configRegionRuleIfAccountNewerThan',
        },
        {
          age: 18,
          access: 'full',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfAssuredOverAge',
        },
        {
          age: 16,
          access: 'safe',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfAssuredOverAge',
        },
        {
          age: 16,
          access: 'safe',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfDeclaredOverAge',
        },
        {
          access: 'none',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleDefault',
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
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfAssuredOverAge',
        },
        {
          age: 13,
          access: 'safe',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfDeclaredOverAge',
        },
        {
          access: 'none',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleDefault',
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
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfAssuredOverAge',
        },
        {
          age: 13,
          access: 'safe',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfDeclaredOverAge',
        },
        {
          access: 'none',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleDefault',
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
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfAssuredOverAge',
        },
        {
          age: 13,
          access: 'safe',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfDeclaredOverAge',
        },
        {
          access: 'none',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleDefault',
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
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfAssuredOverAge',
        },
        {
          access: 'none',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleDefault',
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
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfAssuredOverAge',
        },
        {
          age: 16,
          access: 'full',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfDeclaredOverAge',
        },
        {
          access: 'none',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleDefault',
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
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfAssuredOverAge',
        },
        {
          age: 18,
          access: 'full',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfDeclaredOverAge',
        },
        {
          access: 'none',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleDefault',
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
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfAssuredOverAge',
        },
        {
          age: 18,
          access: 'full',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfDeclaredOverAge',
        },
        {
          age: 13,
          access: 'safe',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleIfDeclaredOverAge',
        },
        {
          access: 'none',
          $type: 'app.bsky.ageassurance.defs#configRegionRuleDefault',
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
