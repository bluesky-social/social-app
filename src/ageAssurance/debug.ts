import type * as AgeRange from 'expo-age-range'
import {toDatetimeString} from '@atproto/syntax'

import {type OtherRequiredData} from '#/ageAssurance/data'
import {IS_DEV, IS_E2E} from '#/env'
import {type Geolocation} from '#/geolocation'
import {app} from '#/lexicons'

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
  app.bsky.ageassurance.getState.$OutputBody | undefined = serverStateEnabled
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
        app.bsky.ageassurance.defs.configRegionRuleDefault.build({
          access: 'full',
        }),
      ],
    },
    {
      // On-device verification region, native-only (web users in TX are not
      // age assured). KWS is included as a fallback for when the device
      // result is insufficient.
      platforms: ['ios', 'android'],
      countryCode: 'US',
      regionCode: 'TX',
      minAccessAge: 18,
      additionalVerificationMethods: ['device'],
      rules: [
        app.bsky.ageassurance.defs.configRegionRuleIfAssuredOverAge.build({
          age: 18,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleDefault.build({
          access: 'none',
        }),
      ],
    },
    {
      countryCode: 'GB',
      minAccessAge: 13,
      rules: [
        app.bsky.ageassurance.defs.configRegionRuleIfAssuredOverAge.build({
          age: 18,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleIfDeclaredOverAge.build({
          age: 13,
          access: 'safe',
        }),
        app.bsky.ageassurance.defs.configRegionRuleDefault.build({
          access: 'none',
        }),
      ],
    },
    {
      countryCode: 'AU',
      minAccessAge: 16,
      rules: [
        app.bsky.ageassurance.defs.configRegionRuleIfAccountNewerThan.build({
          date: '2025-12-10T00:00:00Z',
          access: 'none',
        }),
        app.bsky.ageassurance.defs.configRegionRuleIfAssuredOverAge.build({
          age: 18,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleIfAssuredOverAge.build({
          age: 16,
          access: 'safe',
        }),
        app.bsky.ageassurance.defs.configRegionRuleIfDeclaredOverAge.build({
          age: 16,
          access: 'safe',
        }),
        app.bsky.ageassurance.defs.configRegionRuleDefault.build({
          access: 'none',
        }),
      ],
    },
    {
      countryCode: 'US',
      regionCode: 'SD',
      minAccessAge: 13,
      rules: [
        app.bsky.ageassurance.defs.configRegionRuleIfAssuredOverAge.build({
          age: 18,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleIfDeclaredOverAge.build({
          age: 13,
          access: 'safe',
        }),
        app.bsky.ageassurance.defs.configRegionRuleDefault.build({
          access: 'none',
        }),
      ],
    },
    {
      countryCode: 'US',
      regionCode: 'WY',
      minAccessAge: 13,
      rules: [
        app.bsky.ageassurance.defs.configRegionRuleIfAssuredOverAge.build({
          age: 18,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleIfDeclaredOverAge.build({
          age: 13,
          access: 'safe',
        }),
        app.bsky.ageassurance.defs.configRegionRuleDefault.build({
          access: 'none',
        }),
      ],
    },
    {
      countryCode: 'US',
      regionCode: 'OH',
      minAccessAge: 13,
      rules: [
        app.bsky.ageassurance.defs.configRegionRuleIfAssuredOverAge.build({
          age: 18,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleIfDeclaredOverAge.build({
          age: 13,
          access: 'safe',
        }),
        app.bsky.ageassurance.defs.configRegionRuleDefault.build({
          access: 'none',
        }),
      ],
    },
    {
      countryCode: 'US',
      regionCode: 'MS',
      minAccessAge: 18,
      rules: [
        app.bsky.ageassurance.defs.configRegionRuleIfAssuredOverAge.build({
          age: 18,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleDefault.build({
          access: 'none',
        }),
      ],
    },
    {
      countryCode: 'US',
      regionCode: 'VA',
      minAccessAge: 16,
      rules: [
        app.bsky.ageassurance.defs.configRegionRuleIfAssuredOverAge.build({
          age: 16,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleIfDeclaredOverAge.build({
          age: 16,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleDefault.build({
          access: 'none',
        }),
      ],
    },
    {
      countryCode: 'US',
      regionCode: 'TN',
      minAccessAge: 18,
      rules: [
        app.bsky.ageassurance.defs.configRegionRuleIfAssuredOverAge.build({
          age: 18,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleIfDeclaredOverAge.build({
          age: 18,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleDefault.build({
          access: 'none',
        }),
      ],
    },
    {
      countryCode: 'BR',
      minAccessAge: 13,
      rules: [
        app.bsky.ageassurance.defs.configRegionRuleIfAssuredOverAge.build({
          age: 18,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleIfDeclaredOverAge.build({
          age: 18,
          access: 'full',
        }),
        app.bsky.ageassurance.defs.configRegionRuleIfDeclaredOverAge.build({
          age: 13,
          access: 'safe',
        }),
        app.bsky.ageassurance.defs.configRegionRuleDefault.build({
          access: 'none',
        }),
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
