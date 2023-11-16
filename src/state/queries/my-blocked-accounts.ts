import {AppBskyGraphGetBlocks} from '@atproto/api'
import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'

import {useSession} from '#/state/session'
import {STALE} from '#/state/queries'

export const RQKEY = () => ['my-blocked-accounts']
type RQPageParam = string | undefined

export function useMyBlockedAccountsQuery() {
  const {agent} = useSession()
  return useInfiniteQuery<
    AppBskyGraphGetBlocks.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetBlocks.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.app.bsky.graph.getBlocks({
        limit: 30,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}
