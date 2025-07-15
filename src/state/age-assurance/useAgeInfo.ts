import {useMemo} from 'react'

import {useAgeAssuranceContext} from '#/state/age-assurance'
import {usePreferencesQuery} from '#/state/queries/preferences'

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
