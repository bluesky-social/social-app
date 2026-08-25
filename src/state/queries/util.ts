import {type AtUri} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

export type StructuredQueryKey<T extends Record<string, unknown>> = readonly [
  string,
  T,
  {
    persistedVersion?: number
  },
]

/**
 * Helper method to ensure consistent query keys and key ordering
 */
export function createQueryKey<T extends Record<string, unknown>>(
  /**
   * The query key root. All queries must have a root.
   */
  root: string,
  /**
   * Any arguments the query depends on, and if changed, should result in the query being refetched.
   */
  args: T,
  options: {
    /**
     * If provided, this indicates that the query is persisted and the version
     * of the persisted query format.
     *
     * This is used to ensure that when we make breaking changes to the
     * persisted query format, we can increment the version and avoid trying to
     * read old persisted queries with the new format.
     *
     * If you're persisting your queries, you probably want to set `gcTime:
     * GCTIME.INFINITY` for this query, otherwise it'll get busted immediately
     * after being persisted.
     */
    persistedVersion?: number
  } = {},
): StructuredQueryKey<T> {
  return [root, args, options] as const
}

export function isQueryPersisted(
  queryKey: QueryKey,
): queryKey is StructuredQueryKey<Record<string, unknown>> {
  return (
    Array.isArray(queryKey) &&
    queryKey.length === 3 &&
    typeof queryKey[0] === 'string' &&
    typeof queryKey[1] === 'object' &&
    queryKey[1] !== null &&
    typeof queryKey[2] === 'object' &&
    queryKey[2] !== null &&
    'persistedVersion' in queryKey[2] &&
    typeof queryKey[2].persistedVersion === 'number'
  )
}

export async function truncateAndInvalidate<T = any>(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  queryClient.setQueriesData<InfiniteData<T>>({queryKey}, data => {
    if (data) {
      return {
        pageParams: data.pageParams.slice(0, 1),
        pages: data.pages.slice(0, 1),
      }
    }
    return data
  })
  return queryClient.invalidateQueries({queryKey})
}

// Given an AtUri, this function will check if the AtUri matches a
// hit regardless of whether the AtUri uses a DID or handle as a host.
//
// AtUri should be the URI that is being searched for, while currentUri
// is the URI that is being checked. currentAuthor is the author
// of the currentUri that is being checked.
export function didOrHandleUriMatches(
  atUri: AtUri,
  record: {uri: string; author: app.bsky.actor.defs.ProfileViewBasic},
) {
  if (atUri.host.startsWith('did:')) {
    return atUri.href === record.uri
  }

  return atUri.host === record.author.handle && record.uri.endsWith(atUri.rkey)
}

export function getEmbeddedPost(
  v: unknown,
): app.bsky.embed.record.ViewRecord | undefined {
  if (bsky.isType(app.bsky.embed.record.view, v)) {
    if (
      bsky.isType(app.bsky.embed.record.viewRecord, v.record) &&
      bsky.isType(app.bsky.feed.post, v.record.value)
    ) {
      return v.record
    }
  }
  if (bsky.isType(app.bsky.embed.recordWithMedia.view, v)) {
    if (
      bsky.isType(app.bsky.embed.record.viewRecord, v.record.record) &&
      bsky.isType(app.bsky.feed.post, v.record.record.value)
    ) {
      return v.record.record
    }
  }
}

export function embedViewRecordToPostView(
  v: app.bsky.embed.record.ViewRecord,
): app.bsky.feed.defs.PostView {
  return {
    uri: v.uri,
    cid: v.cid,
    author: v.author,
    record: v.value,
    indexedAt: v.indexedAt,
    labels: v.labels,
    embed: v.embeds?.[0],
    likeCount: v.likeCount,
    quoteCount: v.quoteCount,
    replyCount: v.replyCount,
    repostCount: v.repostCount,
  }
}
