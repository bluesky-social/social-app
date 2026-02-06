import {useCallback, useEffect, useRef} from 'react'
import {Platform} from 'react-native'
import * as Location from 'expo-location'
import {createPermissionHook} from 'expo-modules-core'

import {IS_NATIVE} from '#/env'
import * as debug from '#/geolocation/debug'
import {logger} from '#/geolocation/logger'
import {type Geolocation} from '#/geolocation/types'
import {normalizeDeviceLocation} from '#/geolocation/util'
import {device} from '#/storage'

/**
 * Location.useForegroundPermissions on web just errors if the
 * navigator.permissions API is not available. We need to catch and ignore it,
 * since it's effectively denied.
 *
 * @see https://github.com/expo/expo/blob/72f1562ed9cce5ff6dfe04aa415b71632a3d4b87/packages/expo-location/src/Location.ts#L290-L293
 */
const useForegroundPermissions = createPermissionHook({
  getMethod: () =>
    Location.getForegroundPermissionsAsync().catch(error => {
      logger.debug(
        'useForegroundPermission: error getting location permissions',
        {safeMessage: error},
      )
      return {
        status: Location.PermissionStatus.DENIED,
        granted: false,
        canAskAgain: false,
        expires: 0,
      }
    }),
  requestMethod: () =>
    Location.requestForegroundPermissionsAsync().catch(error => {
      logger.debug(
        'useForegroundPermission: error requesting location permissions',
        {safeMessage: error},
      )
      return {
        status: Location.PermissionStatus.DENIED,
        granted: false,
        canAskAgain: false,
        expires: 0,
      }
    }),
})

export async function getDeviceGeolocation(): Promise<Geolocation> {
  if (debug.enabled && debug.deviceGeolocation)
    return debug.resolve(debug.deviceGeolocation)

  try {
    const geocode = await Location.getCurrentPositionAsync()
    const locations = await Location.reverseGeocodeAsync({
      latitude: geocode.coords.latitude,
      longitude: geocode.coords.longitude,
    })
    const location = locations.at(0)
    const normalized = location ? normalizeDeviceLocation(location) : undefined
    if (normalized?.regionCode && normalized.regionCode.length > 5) {
      /*
       * We want short codes only, and we're still seeing some full names here.
       * 5 is just a heuristic for a region that is probably not formatted as a
       * short code.
       */
      logger.error('getDeviceGeolocation: invalid regionCode', {
        os: Platform.OS,
        version: Platform.Version,
        regionCode: normalized.regionCode,
      })
    }
    return {
      countryCode: normalized?.countryCode ?? undefined,
      regionCode: normalized?.regionCode ?? undefined,
    }
  } catch (e) {
    logger.error('getDeviceGeolocation: failed', {safeMessage: e})
    return {
      countryCode: undefined,
      regionCode: undefined,
    }
  }
}

export function useRequestDeviceGeolocation(): () => Promise<
  | {
      granted: true
      location: Geolocation | undefined
    }
  | {
      granted: false
    }
> {
  return useCallback(async () => {
    const status = await Location.requestForegroundPermissionsAsync()
    if (status.granted) {
      return {
        granted: true,
        location: await getDeviceGeolocation(),
      }
    } else {
      return {
        granted: false,
      }
    }
  }, [])
}

/**
 * Hook to get and sync the device geolocation from the device GPS and store it
 * using device storage. If permissions are not granted, it will clear any cached
 * storage value.
 */
export function useSyncDeviceGeolocationOnStartup(
  sync: (location: Geolocation | undefined) => void,
) {
  const synced = useRef(false)
  const [status] = useForegroundPermissions()
  useEffect(() => {
    if (!IS_NATIVE) return

    async function get() {
      // no need to set this more than once per session
      if (synced.current) return
      logger.debug('useSyncDeviceGeolocationOnStartup: checking perms')
      if (status?.granted) {
        const location = await getDeviceGeolocation()
        if (location) {
          logger.debug('useSyncDeviceGeolocationOnStartup: got location')
          sync(location)
          synced.current = true
        }
      } else {
        const hasCachedValue = device.get(['deviceGeolocation']) !== undefined
        /**
         * If we have a cached value, but user has revoked permissions,
         * quietly (will take effect lazily) clear this out.
         */
        if (hasCachedValue) {
          logger.debug(
            'useSyncDeviceGeolocationOnStartup: clearing cached location, perms revoked',
          )
          device.set(['deviceGeolocation'], undefined)
        }
      }
    }

    get().catch(e => {
      logger.error(
        'useSyncDeviceGeolocationOnStartup: failed to get location',
        {
          safeMessage: e,
        },
      )
    })
  }, [status, sync])
}

export function useIsDeviceGeolocationGranted() {
  const [status] = useForegroundPermissions()
  return status?.granted === true
}
