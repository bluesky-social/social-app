import React from 'react'

import {
  DEFAULT_GEOLOCATION_CONFIG,
  DEFAULT_GEOLOCATION_STATUS,
} from '#/state/geolocation/const'
import {onGeolocationConfigUpdate} from '#/state/geolocation/events'
import {logger} from '#/state/geolocation/logger'
import {
  type DeviceLocation,
  type GeolocationStatus,
} from '#/state/geolocation/types'
import {useSyncedDeviceGeolocation} from '#/state/geolocation/useSyncedDeviceGeolocation'
import {
  computeGeolocationStatus,
  mergeGeolocation,
} from '#/state/geolocation/util'
import {type Device, device} from '#/storage'

export * from '#/state/geolocation/config'
export * from '#/state/geolocation/types'
export * from '#/state/geolocation/util'

type DeviceGeolocationContext = {
  deviceGeolocation: DeviceLocation | undefined
}

type DeviceGeolocationAPIContext = {
  setDeviceGeolocation(deviceGeolocation: DeviceLocation): void
}

type GeolocationConfigContext = {
  config: Device['geolocation']
}

type GeolocationStatusContext = {
  /**
   * Merged geolocation from config and device GPS (if available).
   */
  location: DeviceLocation
  /**
   * Computed geolocation status based on the merged location and config.
   */
  status: GeolocationStatus
}

const DeviceGeolocationContext = React.createContext<DeviceGeolocationContext>({
  deviceGeolocation: undefined,
})
DeviceGeolocationContext.displayName = 'DeviceGeolocationContext'

const DeviceGeolocationAPIContext =
  React.createContext<DeviceGeolocationAPIContext>({
    setDeviceGeolocation: () => {},
  })
DeviceGeolocationAPIContext.displayName = 'DeviceGeolocationAPIContext'

const GeolocationConfigContext = React.createContext<GeolocationConfigContext>({
  config: DEFAULT_GEOLOCATION_CONFIG,
})
GeolocationConfigContext.displayName = 'GeolocationConfigContext'

const GeolocationStatusContext = React.createContext<GeolocationStatusContext>({
  location: {
    countryCode: undefined,
    regionCode: undefined,
  },
  status: DEFAULT_GEOLOCATION_STATUS,
})
GeolocationStatusContext.displayName = 'GeolocationStatusContext'

/**
 * Provider of geolocation config and computed geolocation status.
 */
export function GeolocationStatusProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const {deviceGeolocation} = React.useContext(DeviceGeolocationContext)
  const [config, setConfig] = React.useState(() => {
    const initial = device.get(['geolocation']) || DEFAULT_GEOLOCATION_CONFIG
    return initial
  })

  React.useEffect(() => {
    return onGeolocationConfigUpdate(config => {
      setConfig(config!)
    })
  }, [])

  const configContext = React.useMemo(() => ({config}), [config])
  const statusContext = React.useMemo(() => {
    if (deviceGeolocation?.countryCode) {
      logger.debug('has device geolocation available')
    }
    const geolocation = mergeGeolocation(deviceGeolocation, config)
    const status = computeGeolocationStatus(geolocation, config)
    // ensure this remains debug and never leaves device
    logger.debug('result', {deviceGeolocation, geolocation, status, config})
    return {location: geolocation, status}
  }, [config, deviceGeolocation])

  return (
    <GeolocationConfigContext.Provider value={configContext}>
      <GeolocationStatusContext.Provider value={statusContext}>
        {children}
      </GeolocationStatusContext.Provider>
    </GeolocationConfigContext.Provider>
  )
}

/**
 * Provider of providers. Provides device geolocation data to lower-level
 * `GeolocationStatusProvider`, and device geolocation APIs to children.
 */
export function Provider({children}: {children: React.ReactNode}) {
  const [deviceGeolocation, setDeviceGeolocation] = useSyncedDeviceGeolocation()

  const handleSetDeviceGeolocation = React.useCallback(
    (location: DeviceLocation) => {
      logger.debug('setting device geolocation')
      setDeviceGeolocation({
        countryCode: location.countryCode ?? undefined,
        regionCode: location.regionCode ?? undefined,
      })
    },
    [setDeviceGeolocation],
  )

  return (
    <DeviceGeolocationAPIContext.Provider
      value={React.useMemo(
        () => ({setDeviceGeolocation: handleSetDeviceGeolocation}),
        [handleSetDeviceGeolocation],
      )}>
      <DeviceGeolocationContext.Provider
        value={React.useMemo(() => ({deviceGeolocation}), [deviceGeolocation])}>
        <GeolocationStatusProvider>{children}</GeolocationStatusProvider>
      </DeviceGeolocationContext.Provider>
    </DeviceGeolocationAPIContext.Provider>
  )
}

export function useDeviceGeolocationApi() {
  return React.useContext(DeviceGeolocationAPIContext)
}

export function useGeolocationConfig() {
  return React.useContext(GeolocationConfigContext)
}

export function useGeolocationStatus() {
  return React.useContext(GeolocationStatusContext)
}
