/**
 * Per-account "show streak indicator" toggle (AC-X1 / AC-X2).
 *
 * Built on `useStorage(account, [did, 'activityAndRecap'])` so:
 *   - The toggle is per-account (MMKV DID scope).
 *   - Re-renders on DID switch (storage instance swaps cleanly).
 *   - No `agent.app.bsky.actor.putPreferences` call ever fires (AC-X2).
 *
 * Default is ON (AC-X1). Grace-day flag is intentionally NOT exposed
 * through this module — only the explainer dialog reads
 * `graceUsedForCurrentStreak` directly from storage (G2).
 */

import {useCallback} from 'react'

import {useSession} from '#/state/session'
import {type ActivityAndRecapPrefs} from '#/features/activityAndRecap/types'
import {account, useStorage} from '#/storage'

/**
 * Returns `[showStreak, setShowStreak]`. When no session is present,
 * `showStreak` is always `true` (default-on semantics) and the setter
 * is a no-op.
 */
export function useShowStreakPreference(): [boolean, (next: boolean) => void] {
  const {currentAccount} = useSession()
  const did = currentAccount?.did ?? ''
  const [prefs, setPrefs] = useStorage<typeof account, 'activityAndRecap'>(
    account,
    [did, 'activityAndRecap'],
  )

  const value = prefs?.showStreak ?? true
  const setter = useCallback(
    (next: boolean) => {
      if (!did) return
      const patch: ActivityAndRecapPrefs = {...(prefs ?? {}), showStreak: next}
      setPrefs(patch)
    },
    [did, prefs, setPrefs],
  )
  return [value, setter]
}
