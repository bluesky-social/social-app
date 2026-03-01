import {useMemo} from 'react'

import {useAnalytics} from '#/analytics'

export function useIsBskyTeam() {
  const ax = useAnalytics()
  return useMemo(
    () => ax.features.enabled(ax.features.IsBskyTeam),
    [ax.features],
  )
}
