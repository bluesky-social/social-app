import {useMemo} from 'react'

import {Logger} from '#/logger'
import {useAgeAssuranceContext} from '#/state/ageAssurance'
import {useIsAgeRestricted} from '#/state/ageAssurance/useIsAgeRestricted'
import {usePreferencesQuery} from '#/state/queries/preferences'

const logger = Logger.create(Logger.Context.AgeAssurance)

type AgeInfo = {
  isReady: boolean
  declaredAge: number | undefined
  isUnderage: boolean
  isAgeRestricted: boolean
  assurance: ReturnType<typeof useAgeAssuranceContext>
}

/**
 * Computed age information based on age assurance status and the user's
 * declared age. Use this instead of {@link useAgeAssuranceContext} to get a
 * more user-friendly interface.
 */
export function useAgeInfo(): AgeInfo {
  const ctx = useAgeAssuranceContext()
  const {isAgeRestricted} = useIsAgeRestricted()
  const {isFetched: preferencesLoaded, data: preferences} =
    usePreferencesQuery()
  const declaredAge = preferences?.userAge

  return useMemo(() => {
    const isReady = ctx.isReady && preferencesLoaded
    const isUnderage = (declaredAge || 0) < 18
    const info: AgeInfo = {
      isReady,
      declaredAge,
      isUnderage,
      isAgeRestricted,

      assurance: ctx,
    }
    logger.debug(`useAgeInfo`, info)
    return info
  }, [ctx, preferencesLoaded, declaredAge, isAgeRestricted])
}
