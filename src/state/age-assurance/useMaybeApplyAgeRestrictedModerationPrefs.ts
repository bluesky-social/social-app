import {useCallback} from 'react'
import {type ModerationPrefs} from '@atproto/api'

// import {Logger} from '#/logger'
import {useAgeAssuranceContext} from '#/state/age-assurance'
import {AGE_RESTRICTED_MODERATION_PREFS} from '#/state/age-assurance/const'

// const logger = Logger.create(Logger.Context.AgeAssurance)

/**
 * Hook to conditionally apply age-restricted moderation preferences, if
 * needed. If not needed, the mod prefs passed to the callback will be used.
 */
export function useMaybeApplyAgeRestrictedModerationPrefs() {
  const state = useAgeAssuranceContext()
  return useCallback(
    (prev: ModerationPrefs) => {
      const isDefinitelyAgeRestricted = state.isLoaded && state.isAgeRestricted
      const notSureYet = !state.isLoaded && state.isAgeRestricted

      if (state.isExempt) {
        // logger.debug('useMaybeApplyAgeRestrictedModerationPrefs: exempt', state)
        return prev
      }

      if (notSureYet || isDefinitelyAgeRestricted) {
        // logger.debug(
        //   'useMaybeApplyAgeRestrictedModerationPrefs: overridden',
        //   state,
        // )
        return AGE_RESTRICTED_MODERATION_PREFS
      }

      // logger.debug(
      //   'useMaybeApplyAgeRestrictedModerationPrefs: not overridden',
      //   state,
      // )
      return prev
    },
    [state],
  )
}
