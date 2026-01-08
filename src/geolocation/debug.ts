import * as aaDebug from '#/ageAssurance/debug'
import {IS_DEV} from '#/env'
import {type Geolocation} from '#/geolocation/types'

const localEnabled = false
export const enabled = IS_DEV && (localEnabled || aaDebug.geolocation)
export const geolocation: Geolocation = aaDebug.geolocation ?? {
  countryCode: 'US',
  regionCode: 'TX',
}

const deviceLocalEnabled = false
export const deviceGeolocation: Geolocation | undefined =
  aaDebug.deviceGeolocation ||
  (deviceLocalEnabled
    ? {
        countryCode: 'US',
        regionCode: 'TX',
      }
    : undefined)

export async function resolve<T>(data: T) {
  await new Promise(y => setTimeout(y, 500)) // simulate network
  return data
}
