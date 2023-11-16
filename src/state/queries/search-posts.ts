import {AppBskyFeedSearchPosts} from '@atproto/api'
import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'

import {useSession} from '#/state/session'

const searchPostsQueryKey = ({query}: {query: string}) => [
  'search-posts',
  query,
]

export function useSearchPostsQuery({query}: {query: string}) {
  const {agent} = useSession()

  return useInfiniteQuery<
    AppBskyFeedSearchPosts.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedSearchPosts.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: searchPostsQueryKey({query}),
    queryFn: async () => {
      const res = await agent.app.bsky.feed.searchPosts({
        q: query,
        limit: 25,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}
