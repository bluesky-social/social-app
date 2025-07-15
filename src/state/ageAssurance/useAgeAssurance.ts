import {useMemo} from 'react'

import {Logger} from '#/logger'
import {useAgeAssuranceContext} from '#/state/ageAssurance'
import {usePreferencesQuery} from '#/state/queries/preferences'

const logger = Logger.create(Logger.Context.AgeAssurance)

type AgeAssurance = ReturnType<typeof useAgeAssuranceContext> & {
  /**
   * The age the user has declared in their preferences, if any.
   */
  declaredAge: number | undefined
  /**
   * Indicates whether the user has declared an age under 18.
   */
  isDeclaredUnderage: boolean
}

/**
 * Computed age information based on age assurance status and the user's
 * declared age. Use this instead of {@link useAgeAssuranceContext} to get a
 * more user-friendly interface.
 */
export function useAgeAssurance(): AgeAssurance {
  const aa = useAgeAssuranceContext()
  const {isFetched: preferencesLoaded, data: preferences} =
    usePreferencesQuery()
  const declaredAge = preferences?.userAge

  return useMemo(() => {
    const isReady = aa.isReady && preferencesLoaded
    const isDeclaredUnderage = (declaredAge || 0) < 18
    const state: AgeAssurance = {
      isReady,
      status: aa.status,
      lastInitiatedAt: aa.lastInitiatedAt,
      isAgeRestricted: aa.isAgeRestricted,
      declaredAge,
      isDeclaredUnderage,
    }
    logger.debug(`state`, state)
    return state
  }, [aa, preferencesLoaded, declaredAge])
}
