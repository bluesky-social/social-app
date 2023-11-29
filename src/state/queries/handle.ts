import React from 'react'
import {
  useQueryClient,
  useMutation,
  QueryFunctionContext,
} from '@tanstack/react-query'

import {getAgent} from '#/state/session'
import {STALE} from '#/state/queries'

const fetchHandleQueryKey = (handleOrDid: string) => ['handle', handleOrDid]
const fetchDidQueryKey = (handleOrDid: string) => ['did', handleOrDid]

export function useFetchHandle() {
  const queryClient = useQueryClient()

  return React.useCallback(
    async (handleOrDid: string) => {
      if (handleOrDid.startsWith('did:')) {
        const res = await queryClient.fetchQuery({
          staleTime: STALE.MINUTES.FIVE,
          queryKey: fetchHandleQueryKey(handleOrDid),
          queryFn: fetchHandleQueryFn,
        })
        return res.data.handle
      }
      return handleOrDid
    },
    [queryClient],
  )
}

async function fetchHandleQueryFn({queryKey}: QueryFunctionContext) {
  const [_, handleOrDid] = queryKey as ReturnType<typeof fetchHandleQueryKey>
  return getAgent().getProfile({actor: handleOrDid})
}

export function useUpdateHandleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({handle}: {handle: string}) => {
      await getAgent().updateHandle({handle})
    },
    onSuccess(_data, variables) {
      queryClient.invalidateQueries({
        queryKey: fetchHandleQueryKey(variables.handle),
      })
    },
  })
}

export function useFetchDid() {
  const queryClient = useQueryClient()

  return React.useCallback(
    async (handleOrDid: string) => {
      return queryClient.fetchQuery({
        staleTime: STALE.INFINITY,
        queryKey: fetchDidQueryKey(handleOrDid),
        queryFn: fetchDidQueryFn,
      })
    },
    [queryClient],
  )
}

async function fetchDidQueryFn({queryKey}: QueryFunctionContext) {
  let [_, identifier] = queryKey as ReturnType<typeof fetchDidQueryKey>
  if (!identifier.startsWith('did:')) {
    const res = await getAgent().resolveHandle({handle: identifier})
    identifier = res.data.did
  }
  return identifier
}
