import React from 'react'
import {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyFeedSearchPosts,
  AtUri,
} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {moderatePost_wrapped as moderatePost} from '#/lib/moderatePost_wrapped'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAgent} from '#/state/session'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from './util'

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
  const agent = useAgent()
  const moderationOpts = useModerationOpts()
  const selectArgs = React.useMemo(
    () => ({
      isSearchingSpecificUser: /from:(\w+)/.test(query),
      moderationOpts,
    }),
    [query, moderationOpts],
  )
  const lastRun = React.useRef<{
    data: InfiniteData<AppBskyFeedSearchPosts.OutputSchema>
    args: typeof selectArgs
    result: InfiniteData<AppBskyFeedSearchPosts.OutputSchema>
  } | null>(null)

  return useInfiniteQuery<
    AppBskyFeedSearchPosts.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedSearchPosts.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: searchPostsQueryKey({query, sort}),
    queryFn: async ({pageParam}) => {
      const res = await agent.app.bsky.feed.searchPosts({
        q: query,
        limit: 25,
        cursor: pageParam,
        sort,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled: enabled ?? !!moderationOpts,
    select: React.useCallback(
      (data: InfiniteData<AppBskyFeedSearchPosts.OutputSchema>) => {
        const {moderationOpts, isSearchingSpecificUser} = selectArgs

        /*
         * If a user applies the `from:<user>` filter, don't apply any
         * moderation. Note that if we add any more filtering logic below, we
         * may need to adjust this.
         */
        if (isSearchingSpecificUser) {
          return data
        }

        // Keep track of the last run and whether we can reuse
        // some already selected pages from there.
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
              if ((selectArgs as any)[key] !== (lastArgs as any)[key]) {
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
    InfiniteData<AppBskyFeedSearchPosts.OutputSchema>
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

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, undefined> {
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
        if (post.author.did === did) {
          yield post.author
        }
        const quotedPost = getEmbeddedPost(post.embed)
        if (quotedPost?.author.did === did) {
          yield quotedPost.author
        }
      }
    }
  }
}
