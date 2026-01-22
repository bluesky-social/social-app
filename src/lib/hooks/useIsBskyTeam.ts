import {useMemo} from 'react'

import {useAnalytics} from '#/analytics'

export function useIsBskyTeam() {
  const ax = useAnalytics()
  return useMemo(() => ax.feature(ax.Features.IsBskyTeam), [ax])
}
