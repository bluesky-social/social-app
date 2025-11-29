import {
  type $Typed,
  type AppBskyBookmarkGetBookmarks,
  AppBskyFeedDefs,
  AtUri,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from '#/state/queries/util'
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

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyBookmarkGetBookmarks.OutputSchema>
  >({
    queryKey: [bookmarksQueryKeyRoot],
  })
  const atUri = new AtUri(uri)

  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const bookmark of page.bookmarks) {
        if (
          !bsky.dangerousIsType<AppBskyFeedDefs.PostView>(
            bookmark.item,
            AppBskyFeedDefs.isPostView,
          )
        )
          continue

        if (didOrHandleUriMatches(atUri, bookmark.item)) {
          yield bookmark.item
        }

        const quotedPost = getEmbeddedPost(bookmark.item.embed)
        if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
          yield embedViewRecordToPostView(quotedPost)
        }
      }
    }
  }
}
