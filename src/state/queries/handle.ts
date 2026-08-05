import {useCallback} from 'react'
import {type AtIdentifierString, type HandleString} from '@atproto/syntax'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAppviewClient, usePdsClient} from '#/state/session'
import {app, com} from '#/lexicons'

const handleQueryKeyRoot = 'handle'
const fetchHandleQueryKey = (handleOrDid: string) => [
  handleQueryKeyRoot,
  handleOrDid,
]
const didQueryKeyRoot = 'did'
const fetchDidQueryKey = (handleOrDid: string) => [didQueryKeyRoot, handleOrDid]

export function useFetchHandle() {
  const queryClient = useQueryClient()
  const appviewClient = useAppviewClient()

  return useCallback(
    async (handleOrDid: string) => {
      if (handleOrDid.startsWith('did:')) {
        const res = await queryClient.fetchQuery({
          staleTime: STALE.MINUTES.FIVE,
          queryKey: fetchHandleQueryKey(handleOrDid),
          queryFn: () =>
            appviewClient.call(app.bsky.actor.getProfile, {
              actor: handleOrDid as AtIdentifierString,
            }),
        })
        return res.handle
      }
      return handleOrDid
    },
    [queryClient, appviewClient],
  )
}

export function useUpdateHandleMutation(opts?: {
  onSuccess?: (handle: string) => void
}) {
  const queryClient = useQueryClient()
  const pdsClient = usePdsClient()

  return useMutation({
    mutationFn: async ({handle}: {handle: string}) => {
      await pdsClient.call(com.atproto.identity.updateHandle, {
        handle: handle as HandleString,
      })
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
  const appviewClient = useAppviewClient()

  return useCallback(
    async (handleOrDid: string) => {
      return queryClient.fetchQuery({
        staleTime: STALE.INFINITY,
        queryKey: fetchDidQueryKey(handleOrDid),
        queryFn: async () => {
          let identifier = handleOrDid
          if (!identifier.startsWith('did:')) {
            const res = await appviewClient.call(
              com.atproto.identity.resolveHandle,
              {handle: identifier as HandleString},
            )
            identifier = res.did
          }
          return identifier
        },
      })
    },
    [queryClient, appviewClient],
  )
}
