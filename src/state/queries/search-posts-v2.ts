import {useCallback, useMemo, useRef} from 'react'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedSearchPostsV2,
  AtUri,
  moderatePost,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAgent} from '#/state/session'
import {type SearchFilters} from '#/screens/Search/searchParams'
import {
  buildSearchPostsV2Filters,
  extractSearchPostsParams,
} from './search-posts-params'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from './util'

/**
 * V2 search shares the `'search-posts'` query-key root with the original hook
 * (src/state/queries/search-posts.ts) so the shadow-cache generators there -
 * findAllPostsInQueryData / findAllProfilesInQueryData - discover V2 results
 * too.
 */
const searchPostsQueryKeyRoot = 'search-posts'
const searchPostsV2QueryKey = ({
  query,
  sort,
  filters,
}: {
  query: string
  sort?: string
  filters?: SearchFilters
}) => [searchPostsQueryKeyRoot, query, sort, filters]

export function useSearchPostsV2Query({
  query,
  sort,
  enabled,
  filters,
}: {
  query: string
  sort?: 'top' | 'latest'
  enabled?: boolean
  filters?: SearchFilters
}) {
  const agent = useAgent()
  const moderationOpts = useModerationOpts()
  const selectArgs = useMemo(
    () => ({
      isSearchingSpecificUser: /from:(\w+)/.test(query) || !!filters?.author,
      moderationOpts,
    }),
    [query, filters?.author, moderationOpts],
  )
  const lastRun = useRef<{
    data: InfiniteData<AppBskyFeedSearchPostsV2.OutputSchema>
    args: typeof selectArgs
    result: InfiniteData<AppBskyFeedSearchPostsV2.OutputSchema>
  } | null>(null)

  return useInfiniteQuery<
    AppBskyFeedSearchPostsV2.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedSearchPostsV2.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: searchPostsV2QueryKey({query, sort, filters}),
    queryFn: async ({pageParam}) => {
      /*
       * Operators embedded in the query string (e.g. for back-compat links) are
       * merged with the explicit structured filters from the advanced search
       * dialog; see buildSearchPostsV2Filters for how the two sources combine.
       */
      const {q, ...embedded} = extractSearchPostsParams(query)
      const builtFilters = buildSearchPostsV2Filters(embedded, filters)
      const res = await agent.app.bsky.feed.searchPostsV2({
        ...builtFilters,
        query: q,
        limit: 25,
        cursor: pageParam,
        /*
         * v2 calls the recency sort 'recent'; the rest of the app still uses
         * the v1 'latest' label.
         */
        sort: sort === 'latest' ? 'recent' : sort,
        allTime: true,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled: enabled ?? !!moderationOpts,
    select: useCallback(
      (data: InfiniteData<AppBskyFeedSearchPostsV2.OutputSchema>) => {
        const {moderationOpts, isSearchingSpecificUser} = selectArgs

        /*
         * If a user applies the `from:<user>` filter, don't apply any
         * moderation. Note that if we add any more filtering logic below, we
         * may need to adjust this.
         */
        if (isSearchingSpecificUser) {
          return data
        }

        /*
         * Keep track of the last run and whether we can reuse some already
         * selected pages from there.
         */
        let reusedPages = []
        if (lastRun.current) {
          const {
            data: lastData,
            args: lastArgs,
            result: lastResult,
          } = lastRun.current
          let canReuse = true
          for (let key in selectArgs) {
            if (selectArgs.hasOwnProperty(key)) {
              if (
                (selectArgs as Record<string, unknown>)[key] !==
                (lastArgs as Record<string, unknown>)[key]
              ) {
                // Can't do reuse anything if any input has changed.
                canReuse = false
                break
              }
            }
          }
          if (canReuse) {
            for (let i = 0; i < data.pages.length; i++) {
              if (data.pages[i] && lastData.pages[i] === data.pages[i]) {
                reusedPages.push(lastResult.pages[i])
                continue
              }
              // Stop as soon as pages stop matching up.
              break
            }
          }
        }

        const result = {
          ...data,
          pages: [
            ...reusedPages,
            ...data.pages.slice(reusedPages.length).map(page => {
              return {
                ...page,
                posts: page.posts.filter(post => {
                  const mod = moderatePost(post, moderationOpts!)
                  return !mod.ui('contentList').filter
                }),
              }
            }),
          ],
        }

        lastRun.current = {data, result, args: selectArgs}

        return result
      },
      [selectArgs],
    ),
  })
}

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyFeedSearchPostsV2.OutputSchema>
  >({
    queryKey: [searchPostsQueryKeyRoot],
  })
  const atUri = new AtUri(uri)

  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const post of page.posts) {
        if (didOrHandleUriMatches(atUri, post)) {
          yield post
        }

        const quotedPost = getEmbeddedPost(post.embed)
        if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
          yield embedViewRecordToPostView(quotedPost)
        }
      }
    }
  }
}
