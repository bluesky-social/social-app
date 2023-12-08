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

export function useSearchPostsQuery({query}: {query: string}) {
  return useInfiniteQuery<
    AppBskyFeedSearchPosts.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedSearchPosts.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: searchPostsQueryKey({query}),
    queryFn: async ({pageParam}) => {
      const res = await getAgent().app.bsky.feed.searchPosts({
        q: query,
        limit: 25,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
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
