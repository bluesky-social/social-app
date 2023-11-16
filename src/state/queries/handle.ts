import React from 'react'
import {useQueryClient} from '@tanstack/react-query'

import {useSession} from '#/state/session'

const fetchHandleQueryKey = (handleOrDid: string) => ['handle', handleOrDid]

export function useFetchHandle() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return React.useCallback(
    async (handleOrDid: string) => {
      if (handleOrDid.startsWith('did:')) {
        const res = await queryClient.fetchQuery({
          queryKey: fetchHandleQueryKey(handleOrDid),
          queryFn: () => agent.getProfile({actor: handleOrDid}),
        })
        return res.data.handle
      }
      return handleOrDid
    },
    [agent, queryClient],
  )
}
