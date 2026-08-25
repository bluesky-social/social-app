import {
  type InfiniteData,
  keepPreviousData,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAutoPagination} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

export const RQKEY_ROOT = 'starter-pack-search'
export const RQKEY = (query: string, limit?: number) => [
  RQKEY_ROOT,
  query,
  limit,
]

export function useStarterPackSearch({
  query,
  enabled,
  maintainData,
  limit = 25,
}: {
  query: string
  enabled?: boolean
  maintainData?: boolean
  limit?: number
}) {
  const client = useAppviewClient()
  const result = useInfiniteQuery<
    app.bsky.graph.searchStarterPacksV2.$OutputBody,
    Error,
    InfiniteData<app.bsky.graph.searchStarterPacksV2.$OutputBody>,
    QueryKey,
    string | undefined
  >({
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY(query, limit),
    queryFn: async ({pageParam}) => {
      return await client.call(app.bsky.graph.searchStarterPacksV2, {
        q: query,
        limit,
        cursor: pageParam,
      })
    },
    enabled: enabled && !!query,
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    placeholderData: maintainData ? keepPreviousData : undefined,
    select,
  })
  const itemCount =
    result.data?.pages.reduce(
      (count, page) => count + page.starterPacks.length,
      0,
    ) ?? 0
  useAutoPagination(result, itemCount, limit)
  return result
}

function select(
  data: InfiniteData<app.bsky.graph.searchStarterPacksV2.$OutputBody>,
) {
  // enforce uniqueness
  const uris = new Set()

  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      starterPacks: page.starterPacks.filter(starterPack => {
        if (uris.has(starterPack.uri)) {
          return false
        }
        uris.add(starterPack.uri)
        return true
      }),
    })),
  }
}
