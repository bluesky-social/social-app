import {AppBskyGraphGetLists} from '@atproto/api'
import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'

import {useSession} from '#/state/session'
import {STALE} from '#/state/queries'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

export const RQKEY = (did: string) => ['profile-lists', did]

export function useProfileListsQuery(did: string, opts?: {enabled?: boolean}) {
  const {agent} = useSession()
  const enabled = opts?.enabled !== false
  return useInfiniteQuery<
    AppBskyGraphGetLists.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetLists.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    staleTime: STALE.INFINITY,
    queryKey: RQKEY(did),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.app.bsky.graph.getLists({
        actor: did,
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled,
  })
}
