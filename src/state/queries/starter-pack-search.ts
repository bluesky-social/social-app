import {type AppBskyGraphSearchStarterPacksV2} from '@atproto/api'
import {
  type InfiniteData,
  keepPreviousData,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

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
  const agent = useAgent()
  return useInfiniteQuery<
    AppBskyGraphSearchStarterPacksV2.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphSearchStarterPacksV2.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY(query, limit),
    queryFn: async ({pageParam}) => {
      const res = await agent.app.bsky.graph.searchStarterPacksV2({
        q: query,
        limit,
        cursor: pageParam,
      })
      return res.data
    },
    enabled: enabled && !!query,
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    placeholderData: maintainData ? keepPreviousData : undefined,
    select,
  })
}

function select(
  data: InfiniteData<AppBskyGraphSearchStarterPacksV2.OutputSchema>,
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
