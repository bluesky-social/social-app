import {useCallback} from 'react'
import * as Location from 'expo-location'

import {type DeviceLocation} from '#/state/geolocation/types'
import {getDeviceGeolocation} from '#/state/geolocation/util'

export {PermissionStatus} from 'expo-location'

export function useRequestDeviceLocation(): () => Promise<
  | {
      granted: true
      location: DeviceLocation | undefined
    }
  | {
      granted: false
      status: {
        canAskAgain: boolean
        /**
         * Enum, use `PermissionStatus` export for comparisons
         */
        permissionStatus: Location.PermissionStatus
      }
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
        status: {
          canAskAgain: status.canAskAgain,
          permissionStatus: status.status,
        },
      }
    }
  }, [])
}
