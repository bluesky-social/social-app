import {AppBskyGraphGetList} from '@atproto/api'
import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'

import {getAgent} from '#/state/session'
import {STALE} from '#/state/queries'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

export const RQKEY = (uri: string) => ['list-members', uri]

export function useListMembersQuery(uri: string) {
  return useInfiniteQuery<
    AppBskyGraphGetList.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetList.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(uri),
    queryFn: listMembersQueryFn,
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

async function listMembersQueryFn({
  queryKey,
  pageParam,
}: {
  queryKey: QueryKey
  pageParam: RQPageParam
}) {
  const [_, uri] = queryKey as ReturnType<typeof RQKEY>
  const res = await getAgent().app.bsky.graph.getList({
    list: uri,
    limit: PAGE_SIZE,
    cursor: pageParam,
  })
  return res.data
}
