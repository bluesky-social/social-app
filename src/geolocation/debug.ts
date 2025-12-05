import * as aaDebug from '#/ageAssurance/debug'
import {IS_DEV} from '#/env'
import {type Geolocation} from '#/geolocation/types'

const localEnabled = false
export const enabled = IS_DEV && (localEnabled || aaDebug.geolocation)
export const geolocation: Geolocation = aaDebug.geolocation ?? {
  countryCode: 'AU',
  regionCode: undefined,
}
export const deviceGeolocation: Geolocation = aaDebug.deviceGeolocation ?? {
  countryCode: 'AU',
  regionCode: undefined,
}

export async function resolve<T>(data: T) {
  await new Promise(y => setTimeout(y, 500)) // simulate network
  return data
}
