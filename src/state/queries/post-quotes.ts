import {AtUri, type AtUriString} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAppviewClient} from '#/state/session'
import type * as AppBskyActorDefs from '#/lexicons/app/bsky/actor/defs'
import * as AppBskyEmbedRecord from '#/lexicons/app/bsky/embed/record'
import type * as AppBskyFeedDefs from '#/lexicons/app/bsky/feed/defs'
import * as AppBskyFeedGetQuotes from '#/lexicons/app/bsky/feed/getQuotes'
import * as bsky from '#/types/bsky'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from './util'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

const RQKEY_ROOT = 'post-quotes'
export const RQKEY = (resolvedUri: string) => [RQKEY_ROOT, resolvedUri]

export function usePostQuotesQuery(resolvedUri: string | undefined) {
  const client = useAppviewClient()
  return useInfiniteQuery<
    AppBskyFeedGetQuotes.$OutputBody,
    Error,
    InfiniteData<AppBskyFeedGetQuotes.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(resolvedUri || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      return await client.call(AppBskyFeedGetQuotes, {
        // the enabled flag prevents this from running until resolvedUri is set
        uri: (resolvedUri || '') as AtUriString,
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
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
                bsky.isType(AppBskyEmbedRecord.view, post.embed)
              ) {
                if (
                  bsky.isType(
                    AppBskyEmbedRecord.viewDetached,
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
): Generator<AppBskyActorDefs.ProfileViewBasic, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyFeedGetQuotes.$OutputBody>
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
): Generator<AppBskyFeedDefs.PostView, undefined> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyFeedGetQuotes.$OutputBody>
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
