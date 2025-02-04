import React from 'react'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import {createPublicAgent} from '#/state/session/agent'

const handleQueryKeyRoot = 'handle'
const fetchHandleQueryKey = (handleOrDid: string) => [
  handleQueryKeyRoot,
  handleOrDid,
]
const didQueryKeyRoot = 'did'
const fetchDidQueryKey = (handle: string) => [didQueryKeyRoot, handle]

export function useFetchHandle() {
  const queryClient = useQueryClient()
  const agent = useAgent()

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

export function useResolveHandle() {
  const queryClient = useQueryClient()

  // @NOTE: We are *not* using the logged in agent (from `useAgent()`) here.
  // Using the public API rather than the user's PDS ensures that the handle
  // properly resolves.
  const publicAgent = React.useMemo(() => createPublicAgent(), [])

  return React.useCallback(
    async (handle: string) => {
      return queryClient.fetchQuery({
        staleTime: STALE.MINUTES.ONE,
        queryKey: fetchDidQueryKey(handle),
        queryFn: async ({signal}) => {
          const res = await publicAgent.resolveHandle(
            {handle},
            // Retries should force a fresh resolution; avoid cache.
            {signal, headers: {'cache-control': 'no-cache'}},
          )
          return res.data.did
        },
      })
    },
    [queryClient, publicAgent],
  )
}
