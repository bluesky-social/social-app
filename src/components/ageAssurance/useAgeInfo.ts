import {useMemo} from 'react'

import {useAgeAssuranceContext} from '#/state/age-assurance'
import {usePreferencesQuery} from '#/state/queries/preferences'

export function useAgeInfo() {
  const ctx = useAgeAssuranceContext()
  const {isFetched: preferencesLoaded, data: preferences} =
    usePreferencesQuery()
  const declaredAge = useMemo(() => preferences?.userAge || -1, [preferences])

  return useMemo(() => {
    return {
      isLoaded: ctx.isLoaded && preferencesLoaded,
      declaredAge,
      assurance: ctx,
    }
  }, [ctx, preferencesLoaded, declaredAge])
}
