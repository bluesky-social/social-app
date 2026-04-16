/**
 * Central feature-flag hook for Activity & Recap (ticket i9KLo7kw).
 *
 * Every consumer surface must call this at the top of the entry component
 * and early-return `null` when it returns `false`. That guarantees
 * zero-footprint behavior when the flag is off (no storage reads, no
 * query enqueues, no side effects).
 *
 * Combines session + flag checks:
 *   - `hasSession === true` (AC-A7: no streak for logged-out users)
 *   - `StreaksAndRecapEnable` feature gate (AC-X6)
 */

import {useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'

export function useStreaksAndRecapEnabled(): boolean {
  const {hasSession} = useSession()
  const ax = useAnalytics()
  return hasSession && ax.features.enabled(ax.features.StreaksAndRecapEnable)
}
