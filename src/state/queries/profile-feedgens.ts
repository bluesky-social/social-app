import {type AtIdentifierString} from '@atproto/syntax'
import {moderateFeedGenerator} from '@bsky.app/sdk/moderation'
import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'
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
  const client = useAppviewClient()
  return useInfiniteQuery<
    app.bsky.feed.getActorFeeds.$OutputBody,
    Error,
    InfiniteData<app.bsky.feed.getActorFeeds.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const data = await client.call(app.bsky.feed.getActorFeeds, {
        actor: did as AtIdentifierString,
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
      data.feeds.sort((a, b) => {
        return (b.likeCount || 0) - (a.likeCount || 0)
      })
      return data
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
                return !decision
                  .ui('contentList')
                  .filters.some(cause => cause.type !== 'muted')
              }),
          }
        }),
      }
    },
  })
}
