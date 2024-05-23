import {AppBskyFeedDefs, AppBskyFeedSearchPosts} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {embedViewRecordToPostView, getEmbeddedPost} from './util'

const searchPostsQueryKeyRoot = 'search-posts'
const searchPostsQueryKey = ({query, sort}: {query: string; sort?: string}) => [
  searchPostsQueryKeyRoot,
  query,
  sort,
]

export function useSearchPostsQuery({
  query,
  sort,
  enabled,
}: {
  query: string
  sort?: 'top' | 'latest'
  enabled?: boolean
}) {
  const {getAgent} = useAgent()
  return useInfiniteQuery<
    AppBskyFeedSearchPosts.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedSearchPosts.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: searchPostsQueryKey({query, sort}),
    queryFn: async ({pageParam}) => {
      const res = await getAgent().app.bsky.feed.searchPosts({
        q: query,
        limit: 25,
        cursor: pageParam,
        sort,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled,
  })
}

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyFeedSearchPosts.OutputSchema>
  >({
    queryKey: [searchPostsQueryKeyRoot],
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
