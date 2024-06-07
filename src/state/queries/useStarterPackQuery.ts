import {AppBskyGraphGetStarterPack} from '@atproto/api'
import {useMutation} from '@tanstack/react-query'
import {useQuery} from 'react-query'

import {STALE} from 'state/queries/index'
import {useAgent, useSession} from 'state/session'

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
