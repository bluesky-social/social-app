import {useCallback} from 'react'
import {type ModerationPrefs} from '@atproto/api'

import {useAgeAssuranceContext} from '#/state/age-assurance'
import {AGE_RESTRICTED_MODERATION_PREFS} from '#/state/age-assurance/const'

export function useMaybeApplyAgeRestrictedModerationPrefs() {
  const {isLoaded, isAgeRestricted, isExempt} = useAgeAssuranceContext()
  return useCallback(
    (prev: ModerationPrefs) => {
      const isDefinitelyAgeRestricted = isLoaded && isAgeRestricted
      const notSureYet = !isLoaded && isAgeRestricted

      if (isExempt) return prev
      if (notSureYet || isDefinitelyAgeRestricted)
        return AGE_RESTRICTED_MODERATION_PREFS
      return prev
    },
    [isLoaded, isAgeRestricted, isExempt],
  )
}
