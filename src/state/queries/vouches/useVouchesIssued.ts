import React from 'react'
import {AppBskyGraphGetVouchesGiven} from '@atproto/api'
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {useAgent,useSession} from '#/state/session'

export const vouchesIssuedQueryKey = ['vouches-issued']

export function useVouchesIssued() {
  const {currentAccount} = useSession()
  const agent = useAgent()

  return useInfiniteQuery<
    AppBskyGraphGetVouchesGiven.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetVouchesGiven.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: vouchesIssuedQueryKey,
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    queryFn: async ({pageParam: cursor}) => {
      const {data} = await agent.app.bsky.graph.getVouchesGiven({
        actor: currentAccount!.did,
        includeUnaccepted: true,
        cursor,
      })
      return data
    },
  })
}

export function useUpdateVouchesIssuedQueryCache() {
  const q = useQueryClient()
  return React.useCallback(
    (
      callback: (
        data:
          | InfiniteData<AppBskyGraphGetVouchesGiven.OutputSchema>
          | undefined,
      ) => InfiniteData<AppBskyGraphGetVouchesGiven.OutputSchema> | undefined,
    ) => {
      const data = q.getQueryData<
        InfiniteData<AppBskyGraphGetVouchesGiven.OutputSchema>
      >(vouchesIssuedQueryKey)
      const updated = callback(data)
      q.setQueryData(vouchesIssuedQueryKey, updated)
    },
    [q],
  )
}
