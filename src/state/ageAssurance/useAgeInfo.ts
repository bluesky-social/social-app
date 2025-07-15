import {useMemo} from 'react'

import {Logger} from '#/logger'
import {useAgeAssuranceContext} from '#/state/ageAssurance'
import {useMustCompleteAgeAssurance} from '#/state/ageAssurance/useMustCompleteAgeAssurance'
import {usePreferencesQuery} from '#/state/queries/preferences'

const logger = Logger.create(Logger.Context.AgeAssurance)

type AgeInfo = {
  isLoaded: boolean
  declaredAge: number | undefined
  isUnderage: boolean
  mustCompleteAgeAssurance: boolean
  assurance: ReturnType<typeof useAgeAssuranceContext>
}

/**
 * Computed age information based on age assurance status and the user's
 * declared age. Use this instead of {@link useAgeAssuranceContext} to get a
 * more user-friendly interface.
 */
export function useAgeInfo(): AgeInfo {
  const mustCompleteAgeAssurance = useMustCompleteAgeAssurance()
  const ctx = useAgeAssuranceContext()
  const {isFetched: preferencesLoaded, data: preferences} =
    usePreferencesQuery()
  const declaredAge = preferences?.userAge

  return useMemo(() => {
    const isLoaded = ctx.isLoaded && preferencesLoaded
    const isUnderage = (declaredAge || 0) < 18
    const info: AgeInfo = {
      isLoaded,
      declaredAge,
      isUnderage,
      mustCompleteAgeAssurance,

      assurance: ctx,
    }
    logger.debug(`useAgeInfo`, info)
    return info
  }, [ctx, preferencesLoaded, declaredAge, mustCompleteAgeAssurance])
}
