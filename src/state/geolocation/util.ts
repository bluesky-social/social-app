import {
  getCurrentPositionAsync,
  type LocationGeocodedAddress,
  reverseGeocodeAsync,
} from 'expo-location'

import {logger} from '#/state/geolocation/logger'
import {type DeviceLocation} from '#/state/geolocation/types'
import {type Device} from '#/storage'

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
 * Normalizes a `LocationGeocodedAddress` into a `DeviceLocation`.
 *
 * We don't want or care about the full location data, so we trim it down and
 * normalize certain fields, like region, into the format we need.
 */
export function normalizeDeviceLocation(
  location: LocationGeocodedAddress,
): DeviceLocation {
  let {isoCountryCode, region} = location

  if (region) {
    if (isoCountryCode === 'US') {
      region = USRegionNameToRegionCode[region] ?? region
    }
  }

  return {
    countryCode: isoCountryCode ?? undefined,
    regionCode: region ?? undefined,
  }
}

/**
 * Combines precise location data with the geolocation config fetched from the
 * IP service, with preference to the precise data.
 */
export function mergeGeolocation(
  location?: DeviceLocation,
  config?: Device['geolocation'],
): DeviceLocation {
  if (location?.countryCode) return location
  return {
    countryCode: config?.countryCode,
    regionCode: config?.regionCode,
  }
}

/**
 * Computes the geolocation status (age-restricted, age-blocked) based on the
 * given location and geolocation config. `location` here should be merged with
 * `mergeGeolocation()` ahead of time if needed.
 */
export function computeGeolocationStatus(
  location: DeviceLocation,
  config: Device['geolocation'],
) {
  /**
   * We can't do anything if we don't have this data.
   */
  if (!location.countryCode) {
    return {
      ...location,
      isAgeRestrictedGeo: false,
      isAgeBlockedGeo: false,
    }
  }

  const isAgeRestrictedGeo = config?.ageRestrictedGeos?.some(rule => {
    if (rule.countryCode === location.countryCode) {
      if (!rule.regionCode) {
        return true // whole country is blocked
      } else if (rule.regionCode === location.regionCode) {
        return true
      }
    }
  })

  const isAgeBlockedGeo = config?.ageBlockedGeos?.some(rule => {
    if (rule.countryCode === location.countryCode) {
      if (!rule.regionCode) {
        return true // whole country is blocked
      } else if (rule.regionCode === location.regionCode) {
        return true
      }
    }
  })

  return {
    ...location,
    isAgeRestrictedGeo: !!isAgeRestrictedGeo,
    isAgeBlockedGeo: !!isAgeBlockedGeo,
  }
}

export async function getDeviceGeolocation(): Promise<DeviceLocation> {
  try {
    const geocode = await getCurrentPositionAsync()
    const locations = await reverseGeocodeAsync({
      latitude: geocode.coords.latitude,
      longitude: geocode.coords.longitude,
    })
    const location = locations.at(0)
    const normalized = location ? normalizeDeviceLocation(location) : undefined
    return {
      countryCode: normalized?.countryCode ?? undefined,
      regionCode: normalized?.regionCode ?? undefined,
    }
  } catch (e) {
    logger.error('getDeviceGeolocation: failed', {
      safeMessage: e,
    })
    return {
      countryCode: undefined,
      regionCode: undefined,
    }
  }
}
