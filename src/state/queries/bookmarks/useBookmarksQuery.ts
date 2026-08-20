import {type $Typed} from '@atproto/lex'
import {AtUri, toDatetimeString} from '@atproto/syntax'
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
import type * as AppBskyBookmarkDefs from '#/lexicons/app/bsky/bookmark/defs'
import * as AppBskyBookmarkGetBookmarks from '#/lexicons/app/bsky/bookmark/getBookmarks'
import * as AppBskyFeedDefs from '#/lexicons/app/bsky/feed/defs'
import * as bsky from '#/types/bsky'

export const bookmarksQueryKeyRoot = 'bookmarks'
export const createBookmarksQueryKey = () => [bookmarksQueryKeyRoot]

export function useBookmarksQuery() {
  const client = useAppviewClient()

  return useInfiniteQuery<
    AppBskyBookmarkGetBookmarks.$OutputBody,
    Error,
    InfiniteData<AppBskyBookmarkGetBookmarks.$OutputBody>,
    QueryKey,
    string | undefined
  >({
    queryKey: createBookmarksQueryKey(),
    async queryFn({pageParam}) {
      return await client.call(AppBskyBookmarkGetBookmarks, {
        cursor: pageParam,
      })
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export async function truncateAndInvalidate(qc: QueryClient) {
  qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.$OutputBody>>(
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
  qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.$OutputBody>>(
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
            const bookmark: AppBskyBookmarkDefs.BookmarkView = {
              createdAt: toDatetimeString(new Date()),
              subject: {
                uri: post.uri,
                cid: post.cid,
              },
              item: post as $Typed<AppBskyFeedDefs.PostView>,
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
  qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.$OutputBody>>(
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
    InfiniteData<AppBskyBookmarkGetBookmarks.$OutputBody>
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
        if (!bsky.isType(AppBskyFeedDefs.postView, bookmark.item)) continue

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
