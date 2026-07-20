import {useCallback, useMemo, useRef} from 'react'
import {AtUri} from '@atproto/syntax'
import {moderatePost} from '@bsky.app/sdk/moderation'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAppviewClient} from '#/state/session'
import {type SearchFilters} from '#/screens/Search/searchParams'
import {app} from '#/lexicons'
import {
  buildSearchPostsV2Filters,
  extractSearchPostsParams,
} from './search-posts-params'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from './util'

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
  const client = useAppviewClient()
  const moderationOpts = useModerationOpts()
  const selectArgs = useMemo(
    () => ({
      isSearchingSpecificUser: /from:(\w+)/.test(query) || !!filters?.author,
      moderationOpts,
    }),
    [query, filters?.author, moderationOpts],
  )
  const lastRun = useRef<{
    data: InfiniteData<app.bsky.feed.searchPostsV2.$OutputBody>
    args: typeof selectArgs
    result: InfiniteData<app.bsky.feed.searchPostsV2.$OutputBody>
  } | null>(null)

  return useInfiniteQuery<
    app.bsky.feed.searchPostsV2.$OutputBody,
    Error,
    InfiniteData<app.bsky.feed.searchPostsV2.$OutputBody>,
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
      return await client.call(app.bsky.feed.searchPostsV2, {
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
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled: enabled ?? !!moderationOpts,
    select: useCallback(
      (data: InfiniteData<app.bsky.feed.searchPostsV2.$OutputBody>) => {
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
): Generator<app.bsky.feed.defs.PostView, undefined> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<app.bsky.feed.searchPostsV2.$OutputBody>
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
