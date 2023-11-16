import React from 'react'
import {useQueryClient, useMutation} from '@tanstack/react-query'

import {useSession} from '#/state/session'

const fetchHandleQueryKey = (handleOrDid: string) => ['handle', handleOrDid]
const fetchDidQueryKey = (handleOrDid: string) => ['did', handleOrDid]

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

export function useUpdateHandleMutation() {
  const {agent} = useSession()

  return useMutation({
    mutationFn: async ({handle}: {handle: string}) => {
      await agent.updateHandle({handle})
    },
  })
}

export function useFetchDid() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return React.useCallback(
    async (handleOrDid: string) => {
      return queryClient.fetchQuery({
        queryKey: fetchDidQueryKey(handleOrDid),
        queryFn: async () => {
          let identifier = handleOrDid
          if (!identifier.startsWith('did:')) {
            const res = await agent.resolveHandle({handle: identifier})
            identifier = res.data.did
          }
          return identifier
        },
      })
    },
    [agent, queryClient],
  )
}
