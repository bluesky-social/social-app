import {StarterPackView} from '@atproto/api/dist/client/types/app/bsky/graph/defs'
import {QueryClient, useMutation, useQuery} from '@tanstack/react-query'

import {useAgent, useSession} from 'state/session'

const RQKEY_ROOT = 'starter-pack'
const RQKEY = (did?: string, rkey?: string) => [RQKEY_ROOT, did, rkey]

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
    queryKey: RQKEY(did, rkey),
    queryFn: async () => {
      const res = await agent.app.bsky.graph.getStarterPack({
        starterPack: uri,
      })
      return res.data.starterPack
    },
    enabled: Boolean(did) && Boolean(rkey),
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
    mutationFn: async (rkey: string, listRkey?: string) => {
      await agent.app.bsky.graph.starterpack.delete({
        repo: currentAccount!.did,
        rkey,
      })

      if (listRkey) {
        await agent.app.bsky.graph.list.delete({
          repo: currentAccount!.did,
          rkey: listRkey,
        })
      }
    },
    onError,
    onSuccess,
  })
}

export async function invalidateStarterPack({
  queryClient,
  did,
  rkey,
}: {
  queryClient: QueryClient
  did: string
  rkey: string
}) {
  await queryClient.invalidateQueries({queryKey: RQKEY(did, rkey)})
}
