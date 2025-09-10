import {
  type $Typed,
  type AppBskyBookmarkGetBookmarks,
  type AppBskyFeedDefs,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
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

export async function truncateAndInvalidate(qc: QueryClient) {
  qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.OutputSchema>>(
    {queryKey: [bookmarksQueryKeyRoot]},
    data => {
      if (data) {
        return {
          pageParams: data.pageParams.slice(0, 1),
          pages: data.pages.slice(0, 1),
        }
      }
      return data
    },
  )
  return qc.invalidateQueries({queryKey: [bookmarksQueryKeyRoot]})
}

export async function optimisticallySaveBookmark(
  qc: QueryClient,
  post: AppBskyFeedDefs.PostView,
) {
  qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.OutputSchema>>(
    {
      queryKey: [bookmarksQueryKeyRoot],
    },
    data => {
      if (!data) return data
      return {
        ...data,
        pages: data.pages.map((page, index) => {
          if (index === 0) {
            post.$type = 'app.bsky.feed.defs#postView'
            return {
              ...page,
              bookmarks: [
                {
                  createdAt: new Date().toISOString(),
                  subject: {
                    uri: post.uri,
                    cid: post.cid,
                  },
                  item: post as $Typed<AppBskyFeedDefs.PostView>,
                },
                ...page.bookmarks,
              ],
            }
          }
          return page
        }),
      }
    },
  )
}

export async function optimisticallyDeleteBookmark(
  qc: QueryClient,
  {uri}: {uri: string},
) {
  qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.OutputSchema>>(
    {
      queryKey: [bookmarksQueryKeyRoot],
    },
    data => {
      if (!data) return data
      return {
        ...data,
        pages: data.pages.map(page => {
          return {
            ...page,
            bookmarks: page.bookmarks.filter(b => b.subject.uri !== uri),
          }
        }),
      }
    },
  )
}
