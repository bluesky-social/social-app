import {AtUri, type AtUriString} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAppviewClient} from '#/state/session'
import {useAnalytics} from '#/analytics'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from './util'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

export type QuotesSort = 'latest' | 'top'
const DEFAULT_SORT: QuotesSort = 'latest'

const RQKEY_ROOT = 'post-quotes'
const RQKEY = (resolvedUri: string, sort: QuotesSort = DEFAULT_SORT) => [
  RQKEY_ROOT,
  resolvedUri,
  sort,
]

/**
 * Drops quotes already seen on an earlier page. "Top" pages come from a ranking
 * that can be rebuilt mid-scroll, which can repeat a quote.
 */
function removeDuplicateQuotes<P extends {posts: {uri: string}[]}>(
  pages: P[],
): P[] {
  const seen = new Set<string>()
  return pages.map(page => ({
    ...page,
    posts: page.posts.filter(post => {
      if (seen.has(post.uri)) return false
      seen.add(post.uri)
      return true
    }),
  }))
}

export function usePostQuotesQuery(
  resolvedUri: string | undefined,
  {sort, enabled = true}: {sort?: QuotesSort; enabled?: boolean} = {},
) {
  const ax = useAnalytics()
  const isSortEnabled = ax.features.enabled(ax.features.QuoteSortEnable)
  const client = useAppviewClient()

  const sortParam = isSortEnabled ? (sort ?? DEFAULT_SORT) : undefined

  return useInfiniteQuery<
    app.bsky.feed.getQuotes.$OutputBody,
    Error,
    InfiniteData<app.bsky.feed.getQuotes.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(resolvedUri || '', sortParam),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      return await client.call(app.bsky.feed.getQuotes, {
        // the enabled flag prevents this from running until resolvedUri is set
        uri: (resolvedUri || '') as AtUriString,
        limit: PAGE_SIZE,
        cursor: pageParam,
        sort: sortParam,
      })
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled: !!resolvedUri && enabled,
    select: selectPostQuotes,
  })
}

// Module-level so react-query can memoise the selection between renders.
function selectPostQuotes(
  data: InfiniteData<app.bsky.feed.getQuotes.$OutputBody>,
): InfiniteData<app.bsky.feed.getQuotes.$OutputBody> {
  return {
    ...data,
    pages: removeDuplicateQuotes(data.pages).map(page => ({
      ...page,
      posts: page.posts.filter(post => {
        if (
          post.embed &&
          bsky.isType(app.bsky.embed.record.view, post.embed) &&
          bsky.isType(app.bsky.embed.record.viewDetached, post.embed.record)
        ) {
          return false
        }
        return true
      }),
    })),
  }
}

const MAX_EMPTY_PAGE_FETCHES = 5

/**
 * Fetches the next page, and keeps going (up to a limit) while pages come back
 * empty, e.g. every quote on it was a duplicate. Otherwise the list can stop
 * loading, because the end of the list never moves.
 */
export async function fetchNextNonEmptyPage(
  fetchNextPage: () => Promise<{
    data?: {pages: {posts: unknown[]}[]}
    hasNextPage: boolean
    isError: boolean
  }>,
) {
  for (let i = 0; i < MAX_EMPTY_PAGE_FETCHES; i++) {
    const res = await fetchNextPage()
    const last = res.data?.pages.at(-1)
    if (!res.hasNextPage || res.isError || !last || last.posts.length > 0) {
      return
    }
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<app.bsky.actor.defs.ProfileViewBasic, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<app.bsky.feed.getQuotes.$OutputBody>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const item of page.posts) {
        if (item.author.did === did) {
          yield item.author
        }
        const quotedPost = getEmbeddedPost(item.embed)
        if (quotedPost?.author.did === did) {
          yield quotedPost.author
        }
      }
    }
  }
}

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<app.bsky.feed.defs.PostView, undefined> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<app.bsky.feed.getQuotes.$OutputBody>
  >({
    queryKey: [RQKEY_ROOT],
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
