import {type l} from '@atproto/lex'
import {AtUri} from '@atproto/syntax'
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
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

export const bookmarksQueryKeyRoot = 'bookmarks'
export const createBookmarksQueryKey = () => [bookmarksQueryKeyRoot]

export function useBookmarksQuery() {
  const client = useAppviewClient()

  return useInfiniteQuery<
    app.bsky.bookmark.getBookmarks.$OutputBody,
    Error,
    InfiniteData<app.bsky.bookmark.getBookmarks.$OutputBody>,
    QueryKey,
    string | undefined
  >({
    queryKey: createBookmarksQueryKey(),
    async queryFn({pageParam}) {
      return await client.call(app.bsky.bookmark.getBookmarks, {
        cursor: pageParam,
      })
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export async function truncateAndInvalidate(qc: QueryClient) {
  qc.setQueriesData<InfiniteData<app.bsky.bookmark.getBookmarks.$OutputBody>>(
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
  post: app.bsky.feed.defs.PostView,
) {
  qc.setQueriesData<InfiniteData<app.bsky.bookmark.getBookmarks.$OutputBody>>(
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
            const bookmark: app.bsky.bookmark.defs.BookmarkView = {
              createdAt: new Date().toISOString() as l.DatetimeString,
              subject: {
                uri: post.uri,
                cid: post.cid,
              },
              item: post as l.$Typed<app.bsky.feed.defs.PostView>,
            }
            return {
              ...page,
              bookmarks: [bookmark, ...page.bookmarks],
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
  qc.setQueriesData<InfiniteData<app.bsky.bookmark.getBookmarks.$OutputBody>>(
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
): Generator<app.bsky.feed.defs.PostView, undefined> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<app.bsky.bookmark.getBookmarks.$OutputBody>
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
        if (!bsky.isType(app.bsky.feed.defs.postView, bookmark.item)) continue

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
