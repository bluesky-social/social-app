import {type AppBskyBookmarkGetBookmarks, AppBskyFeedDefs} from '@atproto/api'
import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {dangerousGetPostShadow} from '#/state/cache/post-shadow'
import {useAgent} from '#/state/session'
import * as bsky from '#/types/bsky'

export const bookmarksQueryKeyRoot = 'bookmarks'
export const createBookmarksQueryKey = () => [bookmarksQueryKeyRoot]

export function useBookmarksQuery() {
  const agent = useAgent()

  return useInfiniteQuery<
    AppBskyBookmarkGetBookmarks.OutputSchema,
    Error,
    InfiniteData<AppBskyBookmarkGetBookmarks.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: createBookmarksQueryKey(),
    async queryFn({pageParam}) {
      const res = await agent.app.bsky.bookmark.getBookmarks({
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    select: data => {
      return {
        ...data,
        pages: data.pages.map(page => {
          return {
            ...page,
            bookmarks: page.bookmarks.filter(b => {
              if (
                bsky.dangerousIsType<AppBskyFeedDefs.PostView>(
                  b.item,
                  AppBskyFeedDefs.isPostView,
                )
              ) {
                const shadow = dangerousGetPostShadow(b.item)
                if (shadow && !shadow.bookmarked) return false
              }
              return true
            }),
          }
        }),
      }
    },
  })
}
