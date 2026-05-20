import {GEOLOCATION_URL} from '#/env'
import {type Geolocation} from '#/geolocation/types'

export const GEOLOCATION_SERVICE_URL = `${GEOLOCATION_URL}/geolocation`

/**
 * Default geolocation config.
 */
export const FALLBACK_GEOLOCATION_SERVICE_RESPONSE: Geolocation = {
  countryCode: undefined,
  regionCode: undefined,
}
