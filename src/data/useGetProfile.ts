import {useQuery} from '@tanstack/react-query'

import {PUBLIC_BSKY_AGENT} from '#/data'

export function useGetProfile({did}: {did: string}) {
  return useQuery({
    queryKey: ['getProfile', did],
    queryFn: async () => {
      const res = await PUBLIC_BSKY_AGENT.getProfile({actor: did})
      return res.data
    },
  })
}
