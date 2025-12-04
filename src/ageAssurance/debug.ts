import {
  ageAssuranceRuleIDs as ids,
  type AppBskyAgeassuranceDefs,
  type AppBskyAgeassuranceGetState,
} from '@atproto/api'

import {type OtherRequiredData} from '#/ageAssurance/data'
import {IS_DEV} from '#/env'
import {type Geolocation} from '#/geolocation'

export const enabled = IS_DEV && false

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
          $type: ids.IfAccountNewerThan,
          date: '2025-12-01T00:00:00Z',
          access: 'none',
        },
        {
          $type: ids.IfAssuredOverAge,
          age: 18,
          access: 'full',
        },
        {
          $type: ids.IfAssuredOverAge,
          age: 16,
          access: 'safe',
        },
        {
          $type: ids.IfDeclaredUnderAge,
          age: 16,
          access: 'none',
        },
        {
          $type: ids.Default,
          access: 'safe',
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
          lastInitiatedAt: new Date(2023, 5, 1).toISOString(),
          status: 'assured',
          access: 'safe',
        },
        metadata: {
          accountCreatedAt: new Date(2023, 11, 1).toISOString(),
        },
      }
    : undefined

export async function resolve<T>(data: T) {
  await new Promise(y => setTimeout(y, 2000)) // simulate network
  return data
}
