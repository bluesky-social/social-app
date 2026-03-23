import {type AppBskyActorSearchActors} from '@atproto/api'
import {
  type InfiniteData,
  keepPreviousData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

export const RQKEY_ROOT = 'actor-search'
export const RQKEY = (query: string, limit?: number) => [
  RQKEY_ROOT,
  query,
  limit,
]

export function useActorSearch({
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
    AppBskyActorSearchActors.OutputSchema,
    Error,
    InfiniteData<AppBskyActorSearchActors.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY(query, limit),
    queryFn: async ({pageParam}) => {
      const res = await agent.searchActors({
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

function select(data: InfiniteData<AppBskyActorSearchActors.OutputSchema>) {
  // enforce uniqueness
  const dids = new Set()

  return {
    ...data,
    pages: data.pages.map(page => ({
      actors: page.actors.filter(actor => {
        if (dids.has(actor.did)) {
          return false
        }
        dids.add(actor.did)
        return true
      }),
    })),
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
) {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyActorSearchActors.OutputSchema>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    for (const actor of queryData.pages.flatMap(page => page.actors)) {
      if (actor.did === did) {
        yield actor
      }
    }
  }
}
