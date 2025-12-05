import {
  ageAssuranceRuleIDs as ids,
  type AppBskyAgeassuranceDefs,
  type AppBskyAgeassuranceGetState,
} from '@atproto/api'

import {type OtherRequiredData} from '#/ageAssurance/data'
import {IS_DEV, IS_E2E} from '#/env'
import {type Geolocation} from '#/geolocation'

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
    }
  : undefined

export const config: AppBskyAgeassuranceDefs.Config = {
  regions: [
    {
      countryCode: 'AA',
      regionCode: undefined,
      rules: [
        {
          $type: ids.Default,
          access: 'full',
        },
      ],
    },
  ],
}

export const otherRequiredData: OtherRequiredData = {
  birthdate: new Date(2000, 1, 1).toISOString(),
}

const serverStateEnabled = false
export const serverState: AppBskyAgeassuranceGetState.OutputSchema | undefined =
  serverStateEnabled
    ? {
        state: {
          lastInitiatedAt: new Date(2025, 1, 1).toISOString(),
          status: 'assured',
          access: 'full',
        },
        metadata: {
          accountCreatedAt: new Date(2023, 1, 1).toISOString(),
        },
      }
    : undefined

export async function resolve<T>(data: T) {
  await new Promise(y => setTimeout(y, 500)) // simulate network
  return data
}
