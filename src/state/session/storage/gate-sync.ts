import {useEffect} from 'react'

import {consumeSessionStorageBootReport} from '#/state/session/storage'
import {useAnalytics} from '#/analytics'
import {device} from '#/storage'

/**
 * Caches the secure-session-storage read gate into device storage, and emits
 * the boot report the storage module stashed.
 *
 * The gate cannot be evaluated during bootstrap - GrowthBook is not loaded
 * until the analytics providers mount, and the storage module has already
 * chosen a boot source by then - so each run caches the gate for the next one.
 * The boot report is emitted here for the same reason: this is the first point
 * in the tree where a metric can be sent.
 *
 * Mount under `AnalyticsFeaturesContext`. That provider sits inside the
 * `<Fragment key={did}>` remount breaker, so this component remounts on every
 * account switch: the gate rule must bucket on `deviceId`, not on the did, or
 * the cached value will flip-flop between accounts.
 */
export function SecureSessionStorageGateSync() {
  const ax = useAnalytics()
  const enabled = ax.features.enabled(
    ax.features.SessionSecureStorageReadEnable,
  )

  useEffect(() => {
    /*
     * Guard against a redundant write on every mount. Writing triggers the
     * storage change listener, which re-renders the analytics subtree.
     */
    if (device.get(['sessionSecureStorageReadEnabled']) !== enabled) {
      device.set(['sessionSecureStorageReadEnabled'], enabled)
    }
    const report = consumeSessionStorageBootReport()
    if (report) {
      ax.metric('sessionStorage:boot', report)
    }
  }, [ax, enabled])

  return null
}
