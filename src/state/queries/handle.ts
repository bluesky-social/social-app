import React from 'react'
import {useMutation} from '@tanstack/react-query'

import {useSession} from '#/state/session'

export function useGetHandle() {
  const {agent} = useSession()

  return React.useCallback(
    async (handleOrDid: string) => {
      if (handleOrDid.startsWith('did:')) {
        const res = await agent.getProfile({actor: handleOrDid})
        return res.data.handle
      }
      return handleOrDid
    },
    [agent],
  )
}

export function useGetHandleMutation() {
  const {agent} = useSession()

  return useMutation({
    mutationFn: async (handleOrDid: string) => {
      if (handleOrDid.startsWith('did:')) {
        // TODO would be nice to do this without all the other fetched data
        const res = await agent.getProfile({actor: handleOrDid})
        return res.data.handle
      }
      return handleOrDid
    },
  })
}
