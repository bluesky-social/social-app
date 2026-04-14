/*
 * Feature-flag + session gate for quick-react.
 *
 * MUST be called at the very top of every entry component. When false,
 * the component should return null before any other hook runs so that
 * the flag-off state is provably zero-footprint (AC-15).
 */

import {useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'

export function useQuickReactsEnabled(): boolean {
  const {hasSession} = useSession()
  const ax = useAnalytics()
  if (!hasSession) return false
  return ax.features.enabled(ax.features.QuickReactionsV0)
}
