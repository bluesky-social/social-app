import {useMemo} from 'react'
import {type AppBskyFeedDefs} from '@atproto/api'
import {useInfiniteQuery} from '@tanstack/react-query'

import {type FeedPostSlice} from '#/state/queries/post-feed'
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

  const query = useInfiniteQuery({
    queryKey: RQKEY(uris),
    queryFn: async ({pageParam}) => {
      const feed = feeds[pageParam]
      const {data} = await agent.app.bsky.feed.getFeed({
        feed: feed.uri,
        limit: LIMIT,
      })
      return data.feed
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

      const isEmpty = !isPending && !data?.pages?.some(page => page.length)

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
            for (const _post of page) {
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
    }, [data, isFetched, isError, isPending]),
  }
}
