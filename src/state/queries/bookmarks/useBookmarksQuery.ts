import {type AppBskyBookmarkGetBookmarks} from '@atproto/api'
import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

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
  })
}
