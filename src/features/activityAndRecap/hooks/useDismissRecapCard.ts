/**
 * useDismissRecapCard (S12) — returns a stable callback that records the
 * user's dismissal of a weekIso into account-scoped MMKV (B5).
 *
 * Also stamps `firstShownAt` on first call when missing (B6) so the auto-
 * expiry window can begin even if the dismissal precedes any other render
 * marking.
 */

import {useCallback} from 'react'

import {useSession} from '#/state/session'
import {
  dismissRecapWeek,
  markRecapCardFirstShown,
} from '#/features/activityAndRecap/storage'

export function useDismissRecapCard(): (weekIso: string) => void {
  const {currentAccount} = useSession()
  const did = currentAccount?.did
  return useCallback(
    (weekIso: string) => {
      if (!did) return
      // Stamp firstShownAt if the user dismissed before any render mark
      // (defensive — the card normally stamps it on first paint).
      markRecapCardFirstShown(did, weekIso, Date.now())
      dismissRecapWeek(did, weekIso)
    },
    [did],
  )
}
