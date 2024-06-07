import {AppBskyGraphGetStarterPack} from '@atproto/api'
import {useQuery} from 'react-query'

import {STALE} from 'state/queries/index'
import {useAgent} from 'state/session'

const RQKEY_ROOT = 'starter-pack'

export function useStarterPackQuery({id}: {id: string}) {
  const agent = useAgent()
  return useQuery<AppBskyGraphGetStarterPack.OutputSchema>({
    queryKey: [RQKEY_ROOT, id],
    queryFn: async () => {
      const res = await agent.app.bsky.graph.getStarterPack({
        starterPack: id,
      })

      return res.data
    },
    staleTime: STALE.MINUTES.FIVE,
  })
}
