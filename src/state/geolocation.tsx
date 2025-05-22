import React from 'react'
import EventEmitter from 'eventemitter3'

import {networkRetry} from '#/lib/async/retry'
import {logger} from '#/logger'
import {type Device, device} from '#/storage'

const events = new EventEmitter()
const EVENT = 'geolocation-updated'
const emitGeolocationUpdate = (geolocation: Device['geolocation']) => {
  events.emit(EVENT, geolocation)
}
const onGeolocationUpdate = (
  listener: (geolocation: Device['geolocation']) => void,
) => {
  events.on(EVENT, listener)
  return () => {
    events.off(EVENT, listener)
  }
}

/**
 * Default geolocation value. IF undefined, we fail closed and apply all
 * additional mod authorities.
 */
export const DEFAULT_GEOLOCATION: Device['geolocation'] = {
  countryCode: undefined,
}

async function getGeolocation(): Promise<Device['geolocation']> {
  const res = await fetch(`https://bsky.app/ipcc`)

  if (!res.ok) {
    throw new Error(`geolocation: lookup failed ${res.status}`)
  }

  const json = await res.json()

  if (json.countryCode) {
    return {
      countryCode: json.countryCode,
    }
  } else {
    return undefined
  }
}

/**
 * Local promise used within this file only.
 */
let geolocationResolution: Promise<{success: boolean}> | undefined

/**
 * Begin the process of resolving geolocation. This should be called once at
 * app start.
 *
 * THIS METHOD SHOULD NEVER THROW.
 *
 * This method is otherwise not used for any purpose. To ensure geolocation is
 * resolved, use {@link ensureGeolocationResolved}
 */
export function beginResolveGeolocation() {
  /**
   * In dev, IP server is unavailable, so we just set the default geolocation
   * and fail closed.
   */
  if (__DEV__) {
    geolocationResolution = new Promise(y => y({success: true}))
    device.set(['geolocation'], DEFAULT_GEOLOCATION)
    return
  }

  geolocationResolution = new Promise(async resolve => {
    let success = true

    try {
      // Try once, fail fast
      const geolocation = await getGeolocation()
      if (geolocation) {
        device.set(['geolocation'], geolocation)
        emitGeolocationUpdate(geolocation)
        logger.debug(`geolocation: success`, {geolocation})
      } else {
        // endpoint should throw on all failures, this is insurance
        throw new Error(`geolocation: nothing returned from initial request`)
      }
    } catch (e: any) {
      success = false

      logger.debug(`geolocation: failed initial request`, {
        safeMessage: e.message,
      })

      // set to default
      device.set(['geolocation'], DEFAULT_GEOLOCATION)

      // retry 3 times, but don't await, proceed with default
      networkRetry(3, getGeolocation)
        .then(geolocation => {
          if (geolocation) {
            device.set(['geolocation'], geolocation)
            emitGeolocationUpdate(geolocation)
            logger.debug(`geolocation: success`, {geolocation})
            success = true
          } else {
            // endpoint should throw on all failures, this is insurance
            throw new Error(`geolocation: nothing returned from retries`)
          }
        })
        .catch((e: any) => {
          // complete fail closed
          logger.debug(`geolocation: failed retries`, {safeMessage: e.message})
        })
    } finally {
      resolve({success})
    }
  })
}

/**
 * Ensure that geolocation has been resolved, or at the very least attempted
 * once. Subsequent retries will not be captured by this `await`. Those will be
 * reported via {@link events}.
 */
export async function ensureGeolocationResolved() {
  if (!geolocationResolution) {
    throw new Error(`geolocation: beginResolveGeolocation not called yet`)
  }

  const cached = device.get(['geolocation'])
  if (cached) {
    logger.debug(`geolocation: using cache`, {cached})
  } else {
    logger.debug(`geolocation: no cache`)
    const {success} = await geolocationResolution
    if (success) {
      logger.debug(`geolocation: resolved`, {
        resolved: device.get(['geolocation']),
      })
    } else {
      logger.error(`geolocation: failed to resolve`)
    }
  }
}

type Context = {
  geolocation: Device['geolocation']
}

const context = React.createContext<Context>({
  geolocation: DEFAULT_GEOLOCATION,
})

export function Provider({children}: {children: React.ReactNode}) {
  const [geolocation, setGeolocation] = React.useState(() => {
    const initial = device.get(['geolocation']) || DEFAULT_GEOLOCATION
    return initial
  })

  React.useEffect(() => {
    return onGeolocationUpdate(geolocation => {
      setGeolocation(geolocation!)
    })
  }, [])

  const ctx = React.useMemo(() => {
    return {
      geolocation,
    }
  }, [geolocation])

  return <context.Provider value={ctx}>{children}</context.Provider>
}

export function useGeolocation() {
  return React.useContext(context)
}
