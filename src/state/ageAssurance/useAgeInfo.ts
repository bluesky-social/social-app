import {useMemo} from 'react'

import {useAgeAssuranceContext} from '#/state/ageAssurance'
import {usePreferencesQuery} from '#/state/queries/preferences'

/**
 * Computed age information based on age assurance status and the user's
 * declared age. Use this instead of {@link useAgeAssuranceContext} to get a
 * more user-friendly interface.
 */
export function useAgeInfo() {
  const ctx = useAgeAssuranceContext()
  const {isFetched: preferencesLoaded, data: preferences} =
    usePreferencesQuery()
  const declaredAge = useMemo(() => preferences?.userAge, [preferences])

  return useMemo(() => {
    return {
      isLoaded: ctx.isLoaded && preferencesLoaded,
      declaredAge,
      isUnderage: ctx.isAgeRestricted && (declaredAge || 0) < 18,
      assurance: ctx,
    }
  }, [ctx, preferencesLoaded, declaredAge])
}
