import {AppBskyGraphGetLists} from '@atproto/api'
import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'
import {useSession} from '../session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

export const RQKEY = (did: string) => ['profile-lists', did]

export function useProfileListsQuery(did: string) {
  const {agent} = useSession()
  return useInfiniteQuery<
    AppBskyGraphGetLists.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetLists.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
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
  })
}
