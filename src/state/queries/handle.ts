import React from 'react'
import {useQueryClient, useMutation} from '@tanstack/react-query'

import {useSession} from '#/state/session'
import {STALE} from '#/state/queries'

const fetchHandleQueryKey = (handleOrDid: string) => ['handle', handleOrDid]
const fetchDidQueryKey = (handleOrDid: string) => ['did', handleOrDid]

export function useFetchHandle() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return React.useCallback(
    async (handleOrDid: string) => {
      if (handleOrDid.startsWith('did:')) {
        const res = await queryClient.fetchQuery({
          staleTime: STALE.MINUTES.FIVE,
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({handle}: {handle: string}) => {
      await agent.updateHandle({handle})
    },
    onSuccess(_data, variables) {
      queryClient.invalidateQueries({
        queryKey: fetchHandleQueryKey(variables.handle),
      })
    },
  })
}

export function useFetchDid() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return React.useCallback(
    async (handleOrDid: string) => {
      return queryClient.fetchQuery({
        staleTime: STALE.INFINITY,
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
