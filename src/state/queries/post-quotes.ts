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
export const RQKEY = (resolvedUri: string, sort: QuotesSort = DEFAULT_SORT) => [
  RQKEY_ROOT,
  resolvedUri,
  sort,
]

export function buildGetQuotesParams({
  uri,
  cursor,
  sort,
}: {
  uri: string
  cursor?: string
  sort?: QuotesSort
}) {
  /*
   * The vendored lexicon does not declare `sort`, so it is spread in only
   * when set and the whole params object is asserted. lex forwards
   * undeclared params verbatim but rejects an undeclared key whose value
   * is `undefined`, hence the conditional spread.
   */
  return {
    uri: uri as AtUriString,
    limit: PAGE_SIZE,
    cursor,
    ...(sort ? {sort} : {}),
  } as app.bsky.feed.getQuotes.$Params
}

export function usePostQuotesQuery(
  resolvedUri: string | undefined,
  {sort}: {sort?: QuotesSort} = {},
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
      return await client.call(
        app.bsky.feed.getQuotes,
        buildGetQuotesParams({
          // the enabled flag prevents this from running until resolvedUri is set
          uri: resolvedUri || '',
          cursor: pageParam,
          sort: sortParam,
        }),
      )
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled: !!resolvedUri,
    select: data => {
      return {
        ...data,
        pages: data.pages.map(page => {
          return {
            ...page,
            posts: page.posts.filter(post => {
              if (
                post.embed &&
                bsky.isType(app.bsky.embed.record.view, post.embed)
              ) {
                if (
                  bsky.isType(
                    app.bsky.embed.record.viewDetached,
                    post.embed.record,
                  )
                ) {
                  return false
                }
              }
              return true
            }),
          }
        }),
      }
    },
  })
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
