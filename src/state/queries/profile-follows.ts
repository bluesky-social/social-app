import {AppBskyGraphGetFollows} from '@atproto/api'
import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'
import {useSession} from '../session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

export const RQKEY = (did: string) => ['profile-follows', did]

export function useProfileFollowsQuery(did: string | undefined) {
  const {agent} = useSession()
  return useInfiniteQuery<
    AppBskyGraphGetFollows.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetFollows.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.app.bsky.graph.getFollows({
        actor: did || '',
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled: !!did,
  })
}
