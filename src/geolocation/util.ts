import {type LocationGeocodedAddress} from 'expo-location'

import {isAndroid} from '#/platform/detection'
import {logger} from '#/geolocation/logger'
import {type Geolocation} from '#/geolocation/types'

/**
 * Maps full US region names to their short codes.
 *
 * Context: in some cases, like on Android, we get the full region name instead
 * of the short code. We may need to expand this in the future to other
 * countries, hence the prefix.
 */
export const USRegionNameToRegionCode: {
  [regionName: string]: string
} = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  ['New Hampshire']: 'NH',
  ['New Jersey']: 'NJ',
  ['New Mexico']: 'NM',
  ['New York']: 'NY',
  ['North Carolina']: 'NC',
  ['North Dakota']: 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  ['Rhode Island']: 'RI',
  ['South Carolina']: 'SC',
  ['South Dakota']: 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  ['West Virginia']: 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
}

/**
 * Normalizes a `LocationGeocodedAddress` into a `Geolocation`.
 *
 * We don't want or care about the full location data, so we trim it down and
 * normalize certain fields, like region, into the format we need.
 */
export function normalizeDeviceLocation(
  location: LocationGeocodedAddress,
): Geolocation {
  let {isoCountryCode, region} = location
  let regionCode: string | undefined = region ?? undefined

  /*
   * Android doesn't give us ISO 3166-2 short codes. We need these for US
   */
  if (isAndroid) {
    if (region && isoCountryCode === 'US') {
      /*
       * We need short codes for US states. If we can't remap it, just drop it
       * entirely for now.
       */
      regionCode = USRegionNameToRegionCode[region] ?? undefined
    } else {
      /*
       * Outside the US, we don't need regionCodes for now, so just drop it.
       */
      regionCode = undefined
    }
  }

  return {
    countryCode: isoCountryCode ?? undefined,
    regionCode,
  }
}

/**
 * Combines precise location data with the geolocation config fetched from the
 * IP service, with preference to the precise data.
 */
export function mergeGeolocations(
  device?: Geolocation,
  geolocationService?: Geolocation,
): Geolocation {
  let geolocation: Geolocation = {
    countryCode: geolocationService?.countryCode ?? undefined,
    regionCode: geolocationService?.regionCode ?? undefined,
  }
  // prefer GPS
  if (device?.countryCode) {
    geolocation = device
  }
  logger.debug('merged geolocation data', {
    device,
    service: geolocationService,
    merged: geolocation,
  })
  return geolocation
}
