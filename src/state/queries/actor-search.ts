import {AppBskyActorDefs, AppBskyActorSearchActors} from '@atproto/api'
import {
  InfiniteData,
  keepPreviousData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

const RQKEY_ROOT = 'actor-search'
export const RQKEY = (query: string) => [RQKEY_ROOT, query]

const RQKEY_ROOT_PAGINATED = `${RQKEY_ROOT}_paginated`
export const RQKEY_PAGINATED = (query: string) => [RQKEY_ROOT_PAGINATED, query]

export function useActorSearch({
  query,
  enabled,
}: {
  query: string
  enabled?: boolean
}) {
  const agent = useAgent()
  return useQuery<AppBskyActorDefs.ProfileView[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(query || ''),
    async queryFn() {
      const res = await agent.searchActors({
        q: query,
      })
      return res.data.actors
    },
    enabled: enabled && !!query,
  })
}

export function useActorSearchPaginated({
  query,
  enabled,
  maintainData,
}: {
  query: string
  enabled?: boolean
  maintainData?: boolean
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
    queryKey: RQKEY_PAGINATED(query),
    queryFn: async ({pageParam}) => {
      const res = await agent.searchActors({
        q: query,
        limit: 25,
        cursor: pageParam,
      })
      return res.data
    },
    enabled: enabled && !!query,
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    placeholderData: maintainData ? keepPreviousData : undefined,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
) {
  const queryDatas = queryClient.getQueriesData<AppBskyActorDefs.ProfileView[]>(
    {
      queryKey: [RQKEY_ROOT],
    },
  )
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    for (const actor of queryData) {
      if (actor.did === did) {
        yield actor
      }
    }
  }

  const queryDatasPaginated = queryClient.getQueriesData<
    InfiniteData<AppBskyActorSearchActors.OutputSchema>
  >({
    queryKey: [RQKEY_ROOT_PAGINATED],
  })
  for (const [_queryKey, queryData] of queryDatasPaginated) {
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
