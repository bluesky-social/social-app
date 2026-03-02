import {useEffect, useState} from 'react'
import EventEmitter from 'eventemitter3'

import {networkRetry} from '#/lib/async/retry'
import {
  FALLBACK_GEOLOCATION_SERVICE_RESPONSE,
  GEOLOCATION_SERVICE_URL,
} from '#/geolocation/const'
import * as debug from '#/geolocation/debug'
import {logger} from '#/geolocation/logger'
import {type Geolocation} from '#/geolocation/types'
import {device} from '#/storage'

const events = new EventEmitter()
const EVENT = 'geolocation-service-response-updated'
const emitGeolocationServiceResponseUpdate = (data: Geolocation) => {
  events.emit(EVENT, data)
}
const onGeolocationServiceResponseUpdate = (
  listener: (data: Geolocation) => void,
) => {
  events.on(EVENT, listener)
  return () => {
    events.off(EVENT, listener)
  }
}

async function fetchGeolocationServiceData(
  url: string,
): Promise<Geolocation | undefined> {
  if (debug.enabled) return debug.resolve(debug.geolocation)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`fetchGeolocationServiceData failed ${res.status}`)
  }
  return res.json() as Promise<Geolocation>
}

/**
 * Local promise used within this file only.
 */
let geolocationServicePromise: Promise<{success: boolean}> | undefined

/**
 * Begin the process of resolving geolocation config. This is called right away
 * at app start, and the promise is awaited later before proceeding with app
 * startup.
 */
export async function resolve() {
  if (geolocationServicePromise) {
    const cached = device.get(['geolocationServiceResponse'])
    if (cached) {
      logger.debug(`resolve(): using cache`)
    } else {
      logger.debug(`resolve(): no cache`)
      const {success} = await geolocationServicePromise
      if (success) {
        logger.debug(`resolve(): resolved`)
      } else {
        logger.info(`resolve(): failed`)
      }
    }
  } else {
    logger.debug(`resolve(): initiating`)

    /**
     * THIS PROMISE SHOULD NEVER `reject()`! We want the app to proceed with
     * startup, even if geolocation resolution fails.
     */
    geolocationServicePromise = new Promise(async resolve => {
      let success = false

      function cacheResponseOrThrow(response: Geolocation | undefined) {
        if (response) {
          device.set(['geolocationServiceResponse'], response)
          emitGeolocationServiceResponseUpdate(response)
        } else {
          // endpoint should throw on all failures, this is insurance
          throw new Error(`fetchGeolocationServiceData returned no data`)
        }
      }

      try {
        // Try once, fail fast
        const config = await fetchGeolocationServiceData(
          GEOLOCATION_SERVICE_URL,
        )
        cacheResponseOrThrow(config)
        success = true
      } catch (e: any) {
        logger.debug(
          `resolve(): fetchGeolocationServiceData failed initial request`,
          {
            safeMessage: e.message,
          },
        )

        // retry 3 times, but don't await, proceed with default
        networkRetry(3, () =>
          fetchGeolocationServiceData(GEOLOCATION_SERVICE_URL),
        )
          .then(config => {
            cacheResponseOrThrow(config)
          })
          .catch((e: any) => {
            // complete fail closed
            logger.debug(
              `resolve(): fetchGeolocationServiceData failed retries`,
              {
                safeMessage: e.message,
              },
            )
          })
      } finally {
        resolve({success})
      }
    })
  }
}

export function useGeolocationServiceResponse() {
  const [config, setConfig] = useState(() => {
    const initial =
      device.get(['geolocationServiceResponse']) ||
      FALLBACK_GEOLOCATION_SERVICE_RESPONSE
    return initial
  })

  useEffect(() => {
    return onGeolocationServiceResponseUpdate(config => {
      setConfig(config)
    })
  }, [])

  return config
}
