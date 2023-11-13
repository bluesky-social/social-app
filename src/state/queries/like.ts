import {useMutation} from '@tanstack/react-query'

import {useSession} from '#/state/session'

export function useLikeMutation() {
  const {agent} = useSession()

  return useMutation({
    mutationFn: async ({uri, cid}: {uri: string; cid: string}) => {
      const res = await agent.like(uri, cid)
      return {uri: res.uri}
    },
  })
}

export function useUnlikeMutation() {
  const {agent} = useSession()

  return useMutation({
    mutationFn: async ({uri}: {uri: string}) => {
      await agent.deleteLike(uri)
    },
  })
}
