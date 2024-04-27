import {AppBskyGraphGetLists} from '@atproto/api'
import {InfiniteData, QueryKey, useInfiniteQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

const RQKEY_ROOT = 'profile-lists'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useProfileListsQuery(did: string, opts?: {enabled?: boolean}) {
  const enabled = opts?.enabled !== false
  const {getAgent} = useAgent()
  return useInfiniteQuery<
    AppBskyGraphGetLists.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetLists.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await getAgent().app.bsky.graph.getLists({
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
