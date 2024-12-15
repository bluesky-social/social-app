import {useQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

export const vouchesReceivedQueryKey = ['vouches-received']

export function useVouchesReceived() {
  const agent = useAgent()

  return useQuery({
    queryKey: vouchesReceivedQueryKey,
    queryFn: async () => {
      const {data} = await agent.app.bsky.graph.getVouchesOffered()
      return data.vouches
    },
  })
}
