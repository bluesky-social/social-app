import {useQuery} from '@tanstack/react-query'

import {useAgent,useSession} from '#/state/session'

export const vouchesAcceptedQueryKey = ['vouches-accepted']

export function useVouchesAccepted() {
  const {currentAccount} = useSession()
  const agent = useAgent()

  return useQuery({
    queryKey: vouchesAcceptedQueryKey,
    queryFn: async () => {
      const {data} = await agent.app.bsky.graph.getVouchesReceived({
        actor: currentAccount!.did,
      })
      return data.vouches
    },
  })
}
