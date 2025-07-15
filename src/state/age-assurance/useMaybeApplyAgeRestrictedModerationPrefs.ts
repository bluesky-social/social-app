import {useCallback} from 'react'
import {type ModerationPrefs} from '@atproto/api'

import {useAgeAssuranceContext} from '#/state/age-assurance'
import {AGE_RESTRICTED_MODERATION_PREFS} from '#/state/age-assurance/const'

/**
 * Hook to conditionally apply age-restricted moderation preferences, if
 * needed. If not needed, the mod prefs passed to the callback will be used.
 */
export function useMaybeApplyAgeRestrictedModerationPrefs() {
  const state = useAgeAssuranceContext()
  return useCallback(
    (prev: ModerationPrefs) => {
      if (state.isAgeRestricted) {
        return AGE_RESTRICTED_MODERATION_PREFS
      }

      return prev
    },
    [state],
  )
}
