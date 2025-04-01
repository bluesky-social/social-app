import {useMemo} from 'react'
import {type AppBskyFeedDefs, moderatePost} from '@atproto/api'
import {useInfiniteQuery} from '@tanstack/react-query'

import {CustomFeedAPI} from '#/lib/api/feed/custom'
import {aggregateUserInterests} from '#/lib/api/feed/utils'
import {FeedTuner} from '#/lib/api/feed-manip'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  type FeedPostSlice,
  type FeedPostSliceItem,
} from '#/state/queries/post-feed'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

const RQKEY_ROOT = 'feed-previews'
const RQKEY = (feeds: string[]) => [RQKEY_ROOT, feeds]

const LIMIT = 6

type FeedPreviewItem =
  | {
      type: 'loading'
      key: string
    }
  | {
      type: 'error'
      key: string
    }
  | {
      type: 'loadMoreError'
      key: string
    }
  | {
      type: 'empty'
      key: string
    }
  | {
      type: 'header'
      key: string
      feed: AppBskyFeedDefs.GeneratorView
    }
  // copied from PostFeed.tsx
  | {
      type: 'sliceItem'
      key: string
      slice: FeedPostSlice
      indexInSlice: number
      showReplyTo: boolean
    }
  | {
      type: 'sliceViewFullThread'
      key: string
      uri: string
    }

export function useFeedPreviews(feeds: AppBskyFeedDefs.GeneratorView[]) {
  const uris = feeds.map(feed => feed.uri)
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()
  const userInterests = aggregateUserInterests(preferences)
  const moderationOpts = useModerationOpts()

  const query = useInfiniteQuery({
    queryKey: RQKEY(uris),
    queryFn: async ({pageParam}) => {
      const feed = feeds[pageParam]
      const api = new CustomFeedAPI({
        agent,
        feedParams: {feed: feed.uri},
        userInterests,
      })
      const data = await api.fetch({cursor: undefined, limit: LIMIT})
      return {
        feed,
        posts: data.feed,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (_p, _a, count) =>
      count < feeds.length ? count + 1 : undefined,
  })

  const {data, isFetched, isError, isPending} = query

  return {
    query,
    data: useMemo<FeedPreviewItem[]>(() => {
      const items: FeedPreviewItem[] = []

      const isEmpty =
        !isPending && !data?.pages?.some(page => page.posts.length)

      if (isFetched) {
        if (isError && isEmpty) {
          items.push({
            type: 'error',
            key: 'error',
          })
        } else if (isEmpty) {
          items.push({
            type: 'empty',
            key: 'empty',
          })
        } else if (data) {
          for (const page of data.pages) {
            // default feed tuner - we just want it to slice up the feed
            const tuner = new FeedTuner([])
            const slices: FeedPreviewItem[] = []
            for (const item of tuner.tune(page.posts)) {
              if (item.isFallbackMarker) continue

              const moderations = item.items.map(item =>
                moderatePost(item.post, moderationOpts!),
              )

              // apply moderation filter
              for (let i = 0; i < item.items.length; i++) {
                if (moderations[i]?.ui('contentList').filter) {
                  continue
                }
              }

              const slice = {
                _reactKey: item._reactKey,
                _isFeedPostSlice: true,
                isFallbackMarker: false,
                isIncompleteThread: item.isIncompleteThread,
                feedContext: item.feedContext,
                reason: item.reason,
                feedPostUri: item.feedPostUri,
                items: item.items.map((subItem, i) => {
                  const feedPostSliceItem: FeedPostSliceItem = {
                    _reactKey: `${item._reactKey}-${i}-${subItem.post.uri}`,
                    uri: subItem.post.uri,
                    post: subItem.post,
                    record: subItem.record,
                    moderation: moderations[i],
                    parentAuthor: subItem.parentAuthor,
                    isParentBlocked: subItem.isParentBlocked,
                    isParentNotFound: subItem.isParentNotFound,
                  }
                  return feedPostSliceItem
                }),
              }
              if (slice.isIncompleteThread && slice.items.length >= 3) {
                const beforeLast = slice.items.length - 2
                const last = slice.items.length - 1
                slices.push({
                  type: 'sliceItem',
                  key: slice.items[0]._reactKey,
                  slice: slice,
                  indexInSlice: 0,
                  showReplyTo: false,
                })
                slices.push({
                  type: 'sliceViewFullThread',
                  key: slice._reactKey + '-viewFullThread',
                  uri: slice.items[0].uri,
                })
                slices.push({
                  type: 'sliceItem',
                  key: slice.items[beforeLast]._reactKey,
                  slice: slice,
                  indexInSlice: beforeLast,
                  showReplyTo:
                    slice.items[beforeLast].parentAuthor?.did !==
                    slice.items[beforeLast].post.author.did,
                })
                slices.push({
                  type: 'sliceItem',
                  key: slice.items[last]._reactKey,
                  slice: slice,
                  indexInSlice: last,
                  showReplyTo: false,
                })
              } else {
                for (let i = 0; i < slice.items.length; i++) {
                  slices.push({
                    type: 'sliceItem',
                    key: slice.items[i]._reactKey,
                    slice: slice,
                    indexInSlice: i,
                    showReplyTo: i === 0,
                  })
                }
              }
            }

            if (slices.length > 0) {
              items.push(
                {
                  type: 'header',
                  key: `header-${page.feed.uri}`,
                  feed: page.feed,
                },
                ...slices,
              )
            }
          }
        } else if (isError && !isEmpty) {
          items.push({
            type: 'loadMoreError',
            key: 'loadMoreError',
          })
        }
      } else {
        items.push({
          type: 'loading',
          key: 'loading',
        })
      }

      return items
    }, [data, isFetched, isError, isPending, moderationOpts]),
  }
}
