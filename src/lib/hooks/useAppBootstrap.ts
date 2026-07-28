import {useEffect, useState} from 'react'

import {logger} from '#/logger'
import {init as initPersistedState} from '#/state/persisted'
import {initSessionRepository} from '#/state/session/storage'
import {setupDeviceId} from '#/analytics'
import * as Geo from '#/geolocation'

/**
 * Runs the app-level initialization sequence shared by native and web: bring up
 * persisted state, then the session repository, retrying both every 5s on
 * failure so a locked keystore or unavailable localStorage recovers on its own.
 * Geolocation and device-id setup are awaited but never block readiness on
 * failure. Returns whether initialization has completed.
 */
export function useAppBootstrap(): boolean {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let persistedInitialized = false
    const ancillaryReady = Promise.all([Geo.resolve(), setupDeviceId]).catch(
      error => {
        // setupDeviceId is a module-level promise and cannot be restarted.
        // Session storage is more important than blocking forever here.
        logger.error('ancillary app initialization failed', {error})
      },
    )

    async function initialize() {
      try {
        if (!persistedInitialized) {
          await initPersistedState()
          persistedInitialized = true
        }
        await initSessionRepository()
        await ancillaryReady
        if (!cancelled) setIsReady(true)
      } catch (error) {
        logger.error('app initialization failed', {error})
        if (!cancelled) retryTimer = setTimeout(() => void initialize(), 5_000)
      }
    }
    void initialize()
    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [])

  return isReady
}
