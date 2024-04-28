import {AppBskyFeedGetActorFeeds} from '@atproto/api'
import {InfiniteData, QueryKey, useInfiniteQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

// TODO refactor invalidate on mutate?
const RQKEY_ROOT = 'profile-feedgens'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useProfileFeedgensQuery(
  did: string,
  opts?: {enabled?: boolean},
) {
  const enabled = opts?.enabled !== false
  const {getAgent} = useAgent()
  return useInfiniteQuery<
    AppBskyFeedGetActorFeeds.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedGetActorFeeds.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await getAgent().app.bsky.feed.getActorFeeds({
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
