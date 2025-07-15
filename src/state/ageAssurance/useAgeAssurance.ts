import {useMemo} from 'react'

import {Logger} from '#/logger'
import {useAgeAssuranceContext} from '#/state/ageAssurance'
import {useIsAgeRestricted} from '#/state/ageAssurance/useIsAgeRestricted'
import {usePreferencesQuery} from '#/state/queries/preferences'

const logger = Logger.create(Logger.Context.AgeAssurance)

type AgeAssurance = ReturnType<typeof useAgeAssuranceContext> & {
  /**
   * Indicates the user is age restricted based on the requirements of their
   * region, and their server-provided age assurance status. Does not factor in
   * the user's declared age.
   */
  isAgeRestricted: boolean
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
  const ctx = useAgeAssuranceContext()
  const {isAgeRestricted} = useIsAgeRestricted()
  const {isFetched: preferencesLoaded, data: preferences} =
    usePreferencesQuery()
  const declaredAge = preferences?.userAge

  return useMemo(() => {
    const isReady = ctx.isReady && preferencesLoaded
    const isDeclaredUnderage = (declaredAge || 0) < 18
    const state: AgeAssurance = {
      isReady,
      status: ctx.status,
      lastInitiatedAt: ctx.lastInitiatedAt,
      isAgeRestricted,
      declaredAge,
      isDeclaredUnderage,
    }
    logger.debug(`state`, state)
    return state
  }, [ctx, preferencesLoaded, declaredAge, isAgeRestricted])
}
