import {
  ageAssuranceRuleIDs as ids,
  type AppBskyAgeassuranceDefs,
  type AppBskyAgeassuranceGetState,
} from '@atproto/api'
import * as AgeRange from 'expo-age-range';

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

export const config: AppBskyAgeassuranceDefs.Config & {
} = {
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
      countryCode: 'BB',
      regionCode: undefined,
      minAccessAge: 16,
      rules: [
        {
          $type: ids.Default,
          access: 'none',
          verificationMethods: [
            'device',
          ]
        },
      ],
    },
  ],
}

export const otherRequiredData: OtherRequiredData = {
  birthdate: new Date(2000, 1, 1).toISOString(),
}

const serverStateEnabled = true
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

const deviceSignalsEnabled = true
export const deviceSignals: AgeRange.AgeRangeResponse | undefined = deviceSignalsEnabled ? {
} : undefined

export async function resolve<T>(data: T) {
  await new Promise(y => setTimeout(y, 500)) // simulate network
  return data
}
