import {StarterPackView} from '@atproto/api/dist/client/types/app/bsky/graph/defs'
import {useMutation, useQuery} from '@tanstack/react-query'

import {STALE} from 'state/queries/index'
import {useAgent, useSession} from 'state/session'

const RQKEY_ROOT = 'starter-pack'

export function useStarterPackQuery({
  did,
  rkey,
}: {
  did?: string
  rkey?: string
}) {
  const agent = useAgent()
  const uri = `at://${did}/app.bsky.graph.starterpack/${rkey}`

  return useQuery<StarterPackView>({
    queryKey: [RQKEY_ROOT, did, rkey],
    queryFn: async () => {
      const res = await agent.app.bsky.graph.getStarterPack({
        starterPack: uri,
      })
      return res.data.starterPack
    },
    enabled: Boolean(did) && Boolean(rkey),
    staleTime: STALE.MINUTES.FIVE,
  })
}

export function useDeleteStarterPackMutation({
  onError,
  onSuccess,
}: {
  onError: () => void
  onSuccess: () => void
}) {
  const agent = useAgent()
  const {currentAccount} = useSession()

  return useMutation({
    mutationFn: async (rkey: string) => {
      await agent.app.bsky.graph.starterpack.delete({
        repo: currentAccount!.did,
        rkey,
      })
    },
    onError,
    onSuccess,
  })
}
