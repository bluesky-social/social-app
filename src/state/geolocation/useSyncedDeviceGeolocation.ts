import {useEffect, useRef} from 'react'
import * as Location from 'expo-location'
import {createPermissionHook} from 'expo-modules-core'

import {logger} from '#/state/geolocation/logger'
import {getDeviceGeolocation} from '#/state/geolocation/util'
import {device, useStorage} from '#/storage'

/**
 * Location.useForegroundPermissions on web just errors if the navigator.permissions API is not available.
 * We need to catch and ignore it, since it's effectively denied.
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

/**
 * Hook to get and sync the device geolocation from the device GPS and store it
 * using device storage. If permissions are not granted, it will clear any cached
 * storage value.
 */
export function useSyncedDeviceGeolocation() {
  const synced = useRef(false)
  const [status] = useForegroundPermissions()
  const [deviceGeolocation, setDeviceGeolocation] = useStorage(device, [
    'deviceGeolocation',
  ])

  useEffect(() => {
    async function get() {
      // no need to set this more than once per session
      if (synced.current) return

      logger.debug('useSyncedDeviceGeolocation: checking perms')

      if (status?.granted) {
        const location = await getDeviceGeolocation()
        if (location) {
          logger.debug('useSyncedDeviceGeolocation: syncing location')
          setDeviceGeolocation(location)
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
            'useSyncedDeviceGeolocation: clearing cached location, perms revoked',
          )
          device.set(['deviceGeolocation'], undefined)
        }
      }
    }

    get().catch(e => {
      logger.error('useSyncedDeviceGeolocation: failed to sync', {
        safeMessage: e,
      })
    })
  }, [status, setDeviceGeolocation])

  return [deviceGeolocation, setDeviceGeolocation] as const
}
