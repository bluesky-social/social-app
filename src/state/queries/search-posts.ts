import {useEffect, useRef} from 'react'
import {AppBskyFeedDefs, AppBskyFeedSearchPosts} from '@atproto/api'
import {
  useInfiniteQuery,
  InfiniteData,
  QueryKey,
  QueryClient,
} from '@tanstack/react-query'

import {getAgent} from '#/state/session'
import {embedViewRecordToPostView, getEmbeddedPost} from './util'

const searchPostsQueryKey = ({query}: {query: string}) => [
  'search-posts',
  query,
]

const PAGE_SIZE = 30

export function useSearchPostsQuery({query: q}: {query: string}) {
  const lastPageCountRef = useRef(0)
  const query = useInfiniteQuery<
    AppBskyFeedSearchPosts.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedSearchPosts.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: searchPostsQueryKey({query: q}),
    queryFn: async ({pageParam}) => {
      const res = await getAgent().app.bsky.feed.searchPosts({
        q,
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })

  useEffect(() => {
    const {isFetching, hasNextPage, data} = query
    if (isFetching || !hasNextPage) {
      return
    }

    // avoid double-fires of fetchNextPage()
    if (
      lastPageCountRef.current !== 0 &&
      lastPageCountRef.current === data?.pages?.length
    ) {
      return
    }

    // fetch next page if we haven't gotten a full page of content
    let count = 0
    for (const page of data?.pages || []) {
      count += page.posts.length
    }

    if (count < PAGE_SIZE && (data?.pages.length || 0) < 10) {
      query.fetchNextPage()
      lastPageCountRef.current = data?.pages?.length || 0
    }
  }, [query])

  return query
}

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyFeedSearchPosts.OutputSchema>
  >({
    queryKey: ['search-posts'],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const post of page.posts) {
        if (post.uri === uri) {
          yield post
        }
        const quotedPost = getEmbeddedPost(post.embed)
        if (quotedPost?.uri === uri) {
          yield embedViewRecordToPostView(quotedPost)
        }
      }
    }
  }
}
