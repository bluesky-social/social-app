/**
 * Per-account "show weekly recap" toggle (AC-X1 / AC-X2 / AC-B11).
 *
 * Default is ON. When false, the recap card hides AND the weeklyRecap
 * query never fires (its `enabled` gate reads this hook).
 */

import {useCallback} from 'react'

import {useSession} from '#/state/session'
import {type ActivityAndRecapPrefs} from '#/features/activityAndRecap/types'
import {account, useStorage} from '#/storage'

export function useShowRecapPreference(): [boolean, (next: boolean) => void] {
  const {currentAccount} = useSession()
  const did = currentAccount?.did ?? ''
  const [prefs, setPrefs] = useStorage<typeof account, 'activityAndRecap'>(
    account,
    [did, 'activityAndRecap'],
  )

  const value = prefs?.showRecap ?? true
  const setter = useCallback(
    (next: boolean) => {
      if (!did) return
      const patch: ActivityAndRecapPrefs = {...(prefs ?? {}), showRecap: next}
      setPrefs(patch)
    },
    [did, prefs, setPrefs],
  )
  return [value, setter]
}
