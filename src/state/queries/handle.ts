import React from 'react'
import {fetchQueryWithFallback, useMutation, useQueryClient} from './useQueryWithFallback'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

const handleQueryKeyRoot = 'handle'
const fetchHandleQueryKey = (handleOrDid: string) => [
  handleQueryKeyRoot,
  handleOrDid,
]
const didQueryKeyRoot = 'did'
const fetchDidQueryKey = (handleOrDid: string) => [didQueryKeyRoot, handleOrDid]

export function useFetchHandle() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return React.useCallback(
    async (handleOrDid: string) => {
      if (handleOrDid.startsWith('did:')) {
        const res = await fetchQueryWithFallback(queryClient, {
          queryKey: fetchHandleQueryKey(handleOrDid),
          queryFn: () => agent.getProfile({actor: handleOrDid}),
          enableFallback: true,
          fallbackType: 'profile',
          fallbackIdentifier: handleOrDid,
        })
        return res.data.handle
      }
      return handleOrDid
    },
    [queryClient, agent],
  )
}

export function useUpdateHandleMutation(opts?: {
  onSuccess?: (handle: string) => void
}) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({handle}: {handle: string}) => {
      await agent.updateHandle({handle})
    },
    onSuccess(_data, variables) {
      opts?.onSuccess?.(variables.handle)
      queryClient.invalidateQueries({
        queryKey: fetchHandleQueryKey(variables.handle),
      })
    },
  })
}

export function useFetchDid() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return React.useCallback(
    async (handleOrDid: string) => {
      return fetchQueryWithFallback(queryClient, {
        queryKey: fetchDidQueryKey(handleOrDid),
        queryFn: async () => {
          let identifier = handleOrDid
          if (!identifier.startsWith('did:')) {
            const res = await agent.resolveHandle({handle: identifier})
            identifier = res.data.did
          }
          return identifier
        },
        enableFallback: true,
        fallbackType: 'profile',
        fallbackIdentifier: handleOrDid,
      })
    },
    [queryClient, agent],
  )
}
