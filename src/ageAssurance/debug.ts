import {
  ageAssuranceRuleIDs as ids,
  type AppBskyAgeassuranceDefs,
  type AppBskyAgeassuranceGetState,
} from '@atproto/api'
import * as AgeRange from 'expo-age-range'

import {type OtherRequiredData} from '#/ageAssurance/data'
import {IS_DEV, IS_E2E} from '#/env'
import {type Geolocation} from '#/geolocation'

export const enabled = (IS_DEV && true) || IS_E2E

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
      }
    : undefined

export const otherRequiredData: OtherRequiredData = {
  birthdate: new Date(2010, 12, 1).toISOString(),
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

export const config: AppBskyAgeassuranceDefs.Config = {
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

const deviceSignalsEnabled = true
export const deviceSignals: AgeRange.AgeRangeResponse | undefined =
  deviceSignalsEnabled ? {} : undefined

export async function resolve<T>(data: T) {
  await new Promise(y => setTimeout(y, 500)) // simulate network
  return data
}
