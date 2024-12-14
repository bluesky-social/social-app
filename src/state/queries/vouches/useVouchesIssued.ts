import {useQuery} from '@tanstack/react-query'

import {useSession, useAgent} from '#/state/session'

export const vouchesIssuedQueryKey = ['vouches-issued']

export function useVouchesIssued() {
  const {currentAccount} = useSession()
  const agent = useAgent()

  return useQuery({
    queryKey: vouchesIssuedQueryKey,
    queryFn: async () => {
      const {data} = await agent.app.bsky.graph.getVouchesGiven({
        actor: currentAccount!.did,
        includeUnaccepted: true,
      })
      return data.vouches
    }
  })
}
