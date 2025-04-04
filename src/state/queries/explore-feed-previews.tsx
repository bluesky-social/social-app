import {useMemo} from 'react'
import {
  type AppBskyActorDefs,
  AppBskyFeedDefs,
  AtUri,
  moderatePost,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {CustomFeedAPI} from '#/lib/api/feed/custom'
import {aggregateUserInterests} from '#/lib/api/feed/utils'
import {FeedTuner} from '#/lib/api/feed-manip'
import {cleanError} from '#/lib/strings/errors'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  type FeedPostSlice,
  type FeedPostSliceItem,
} from '#/state/queries/post-feed'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from '#/state/queries/util'
import {useAgent} from '#/state/session'

const RQKEY_ROOT = 'feed-previews'
const RQKEY = (feeds: string[]) => [RQKEY_ROOT, feeds]

const LIMIT = 8 // sliced to 6, overfetch to account for moderation

export type FeedPreviewItem =
  | {
      type: 'topBorder'
      key: string
    }
  | {
      type: 'preview:loading'
      key: string
    }
  | {
      type: 'preview:error'
      key: string
      message: string
      error: string
    }
  | {
      type: 'preview:loadMoreError'
      key: string
    }
  | {
      type: 'preview:empty'
      key: string
    }
  | {
      type: 'preview:header'
      key: string
      feed: AppBskyFeedDefs.GeneratorView
    }
  | {
      type: 'preview:footer'
      key: string
    }
  // copied from PostFeed.tsx
  | {
      type: 'preview:sliceItem'
      key: string
      slice: FeedPostSlice
      indexInSlice: number
      showReplyTo: boolean
      hideTopBorder: boolean
    }
  | {
      type: 'preview:sliceViewFullThread'
      key: string
      uri: string
    }

export function useFeedPreviews(
  feedsMaybeWithDuplicates: AppBskyFeedDefs.GeneratorView[],
) {
  const feeds = useMemo(
    () =>
      feedsMaybeWithDuplicates.filter(
        (f, i, a) => i === a.findIndex(f2 => f.uri === f2.uri),
      ),
    [feedsMaybeWithDuplicates],
  )

  const uris = feeds.map(feed => feed.uri)
  const {_} = useLingui()
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()
  const userInterests = aggregateUserInterests(preferences)
  const moderationOpts = useModerationOpts()
  const enabled = feeds.length > 0

  const query = useInfiniteQuery({
    enabled,
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

  const {data, isFetched, isError, isPending, error} = query

  return {
    query,
    data: useMemo<FeedPreviewItem[]>(() => {
      const items: FeedPreviewItem[] = []

      if (!enabled) return items

      const isEmpty =
        !isPending && !data?.pages?.some(page => page.posts.length)

      if (isFetched) {
        if (isError && isEmpty) {
          items.push({
            type: 'preview:error',
            key: 'error',
            message: _(msg`An error occurred while fetching the feed.`),
            error: cleanError(error),
          })
        } else if (isEmpty) {
          items.push({
            type: 'preview:empty',
            key: 'empty',
          })
        } else if (data) {
          for (let pageIndex = 0; pageIndex < data.pages.length; pageIndex++) {
            const page = data.pages[pageIndex]
            // default feed tuner - we just want it to slice up the feed
            const tuner = new FeedTuner([])
            const slices: FeedPreviewItem[] = []

            let rowIndex = 0
            for (const item of tuner.tune(page.posts)) {
              if (item.isFallbackMarker) continue

              const moderations = item.items.map(item =>
                moderatePost(item.post, moderationOpts!),
              )

              // apply moderation filters
              item.items = item.items.filter((_, i) => {
                return !moderations[i]?.ui('contentList').filter
              })

              const slice = {
                _reactKey: item._reactKey,
                _isFeedPostSlice: true,
                isFallbackMarker: false,
                isIncompleteThread: item.isIncompleteThread,
                feedContext: item.feedContext,
                reason: item.reason,
                feedPostUri: item.feedPostUri,
                items: item.items.slice(0, 6).map((subItem, i) => {
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
                  type: 'preview:sliceItem',
                  key: slice.items[0]._reactKey,
                  slice: slice,
                  indexInSlice: 0,
                  showReplyTo: false,
                  hideTopBorder: rowIndex === 0,
                })
                slices.push({
                  type: 'preview:sliceViewFullThread',
                  key: slice._reactKey + '-viewFullThread',
                  uri: slice.items[0].uri,
                })
                slices.push({
                  type: 'preview:sliceItem',
                  key: slice.items[beforeLast]._reactKey,
                  slice: slice,
                  indexInSlice: beforeLast,
                  showReplyTo:
                    slice.items[beforeLast].parentAuthor?.did !==
                    slice.items[beforeLast].post.author.did,
                  hideTopBorder: false,
                })
                slices.push({
                  type: 'preview:sliceItem',
                  key: slice.items[last]._reactKey,
                  slice: slice,
                  indexInSlice: last,
                  showReplyTo: false,
                  hideTopBorder: false,
                })
              } else {
                for (let i = 0; i < slice.items.length; i++) {
                  slices.push({
                    type: 'preview:sliceItem',
                    key: slice.items[i]._reactKey,
                    slice: slice,
                    indexInSlice: i,
                    showReplyTo: i === 0,
                    hideTopBorder: i === 0 && rowIndex === 0,
                  })
                }
              }

              rowIndex++
            }

            if (slices.length > 0) {
              if (pageIndex > 0) {
                items.push({
                  type: 'topBorder',
                  key: `topBorder-${page.feed.uri}`,
                })
              }
              items.push(
                {
                  type: 'preview:footer',
                  key: `footer-${page.feed.uri}`,
                },
                {
                  type: 'preview:header',
                  key: `header-${page.feed.uri}`,
                  feed: page.feed,
                },
                ...slices,
              )
            }
          }
        } else if (isError && !isEmpty) {
          items.push({
            type: 'preview:loadMoreError',
            key: 'loadMoreError',
          })
        }
      } else {
        items.push({
          type: 'preview:loading',
          key: 'loading',
        })
      }

      return items
    }, [
      enabled,
      data,
      isFetched,
      isError,
      isPending,
      moderationOpts,
      _,
      error,
    ]),
  }
}

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
  const atUri = new AtUri(uri)

  const queryDatas = queryClient.getQueriesData<
    InfiniteData<{
      feed: AppBskyFeedDefs.GeneratorView
      posts: AppBskyFeedDefs.FeedViewPost[]
    }>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const item of page.posts) {
        if (didOrHandleUriMatches(atUri, item.post)) {
          yield item.post
        }

        const quotedPost = getEmbeddedPost(item.post.embed)
        if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
          yield embedViewRecordToPostView(quotedPost)
        }

        if (AppBskyFeedDefs.isPostView(item.reply?.parent)) {
          if (didOrHandleUriMatches(atUri, item.reply.parent)) {
            yield item.reply.parent
          }

          const parentQuotedPost = getEmbeddedPost(item.reply.parent.embed)
          if (
            parentQuotedPost &&
            didOrHandleUriMatches(atUri, parentQuotedPost)
          ) {
            yield embedViewRecordToPostView(parentQuotedPost)
          }
        }

        if (AppBskyFeedDefs.isPostView(item.reply?.root)) {
          if (didOrHandleUriMatches(atUri, item.reply.root)) {
            yield item.reply.root
          }

          const rootQuotedPost = getEmbeddedPost(item.reply.root.embed)
          if (rootQuotedPost && didOrHandleUriMatches(atUri, rootQuotedPost)) {
            yield embedViewRecordToPostView(rootQuotedPost)
          }
        }
      }
    }
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileViewBasic, undefined> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<{
      feed: AppBskyFeedDefs.GeneratorView
      posts: AppBskyFeedDefs.FeedViewPost[]
    }>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const item of page.posts) {
        if (item.post.author.did === did) {
          yield item.post.author
        }
        const quotedPost = getEmbeddedPost(item.post.embed)
        if (quotedPost?.author.did === did) {
          yield quotedPost.author
        }
        if (
          AppBskyFeedDefs.isPostView(item.reply?.parent) &&
          item.reply?.parent?.author.did === did
        ) {
          yield item.reply.parent.author
        }
        if (
          AppBskyFeedDefs.isPostView(item.reply?.root) &&
          item.reply?.root?.author.did === did
        ) {
          yield item.reply.root.author
        }
      }
    }
  }
}
