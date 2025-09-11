import {networkRetry} from '#/lib/async/retry'
import {
  DEFAULT_GEOLOCATION_CONFIG,
  GEOLOCATION_CONFIG_URL,
} from '#/state/geolocation/const'
import {emitGeolocationConfigUpdate} from '#/state/geolocation/events'
import {logger} from '#/state/geolocation/logger'
import {BAPP_CONFIG_DEV_BYPASS_SECRET, IS_DEV} from '#/env'
import {type Device, device} from '#/storage'

async function getGeolocationConfig(
  url: string,
): Promise<Device['geolocation']> {
  const res = await fetch(url, {
    headers: IS_DEV
      ? {
          'x-dev-bypass-secret': BAPP_CONFIG_DEV_BYPASS_SECRET,
        }
      : undefined,
  })

  if (!res.ok) {
    throw new Error(`config: fetch failed ${res.status}`)
  }

  const json = await res.json()

  if (json.countryCode) {
    /**
     * Only construct known values here, ignore any extras.
     */
    const config: Device['geolocation'] = {
      countryCode: json.countryCode,
      regionCode: json.regionCode ?? undefined,
      ageRestrictedGeos: json.ageRestrictedGeos ?? [],
      ageBlockedGeos: json.ageBlockedGeos ?? [],
    }
    logger.debug(`config: success`)
    return config
  } else {
    return undefined
  }
}

/**
 * Local promise used within this file only.
 */
let geolocationConfigResolution: Promise<{success: boolean}> | undefined

/**
 * Begin the process of resolving geolocation config. This should be called
 * once at app start.
 *
 * THIS METHOD SHOULD NEVER THROW.
 *
 * This method is otherwise not used for any purpose. To ensure geolocation
 * config is resolved, use {@link ensureGeolocationConfigIsResolved}
 */
export function beginResolveGeolocationConfig() {
  /**
   * Here for debug purposes. Uncomment to prevent hitting the remote geo service, and apply whatever data you require for testing.
   */
  // if (__DEV__) {
  //   geolocationConfigResolution = new Promise(y => y({success: true}))
  //   device.set(['deviceGeolocation'], undefined) // clears GPS data
  //   device.set(['geolocation'], DEFAULT_GEOLOCATION_CONFIG) // clears bapp-config data
  //   return
  // }

  geolocationConfigResolution = new Promise(async resolve => {
    let success = true

    try {
      // Try once, fail fast
      const config = await getGeolocationConfig(GEOLOCATION_CONFIG_URL)
      if (config) {
        device.set(['geolocation'], config)
        emitGeolocationConfigUpdate(config)
      } else {
        // endpoint should throw on all failures, this is insurance
        throw new Error(
          `geolocation config: nothing returned from initial request`,
        )
      }
    } catch (e: any) {
      success = false

      logger.debug(`config: failed initial request`, {
        safeMessage: e.message,
      })

      // set to default
      device.set(['geolocation'], DEFAULT_GEOLOCATION_CONFIG)

      // retry 3 times, but don't await, proceed with default
      networkRetry(3, () => getGeolocationConfig(GEOLOCATION_CONFIG_URL))
        .then(config => {
          if (config) {
            device.set(['geolocation'], config)
            emitGeolocationConfigUpdate(config)
            success = true
          } else {
            // endpoint should throw on all failures, this is insurance
            throw new Error(`config: nothing returned from retries`)
          }
        })
        .catch((e: any) => {
          // complete fail closed
          logger.debug(`config: failed retries`, {
            safeMessage: e.message,
          })
        })
    } finally {
      resolve({success})
    }
  })
}

/**
 * Ensure that geolocation config has been resolved, or at the very least attempted
 * once. Subsequent retries will not be captured by this `await`. Those will be
 * reported via {@link emitGeolocationConfigUpdate}.
 */
export async function ensureGeolocationConfigIsResolved() {
  if (!geolocationConfigResolution) {
    throw new Error(`config: beginResolveGeolocationConfig not called yet`)
  }

  const cached = device.get(['geolocation'])
  if (cached) {
    logger.debug(`config: using cache`)
  } else {
    logger.debug(`config: no cache`)
    const {success} = await geolocationConfigResolution
    if (success) {
      logger.debug(`config: resolved`)
    } else {
      logger.info(`config: failed to resolve`)
    }
  }
}
