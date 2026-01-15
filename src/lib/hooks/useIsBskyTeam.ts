import {useMemo} from 'react'

import {useGate} from '#/lib/statsig/statsig'

export function useIsBskyTeam() {
  const gate = useGate()
  return useMemo(() => gate('is_bsky_team_member'), [gate])
}
