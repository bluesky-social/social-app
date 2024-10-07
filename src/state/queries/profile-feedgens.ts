import {AppBskyFeedGetActorFeeds, moderateFeedGenerator} from '@atproto/api'
import {InfiniteData, QueryKey, useInfiniteQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {useModerationOpts} from '../preferences/moderation-opts'

const PAGE_SIZE = 50
type RQPageParam = string | undefined

// TODO refactor invalidate on mutate?
export const RQKEY_ROOT = 'profile-feedgens'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useProfileFeedgensQuery(
  did: string,
  opts?: {enabled?: boolean},
) {
  const moderationOpts = useModerationOpts()
  const enabled = opts?.enabled !== false && Boolean(moderationOpts)
  const agent = useAgent()
  return useInfiniteQuery<
    AppBskyFeedGetActorFeeds.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedGetActorFeeds.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.app.bsky.feed.getActorFeeds({
        actor: did,
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
      res.data.feeds.sort((a, b) => {
        return (b.likeCount || 0) - (a.likeCount || 0)
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled,
    select(data) {
      return {
        ...data,
        pages: data.pages.map(page => {
          return {
            ...page,
            feeds: page.feeds
              // filter by labels
              .filter(list => {
                const decision = moderateFeedGenerator(list, moderationOpts!)
                return !decision.ui('contentList').filter
              }),
          }
        }),
      }
    },
  })
}
