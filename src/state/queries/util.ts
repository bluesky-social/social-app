import {
  type AppBskyActorDefs,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  type AtUri,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query'

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
  record: {uri: string; author: AppBskyActorDefs.ProfileViewBasic},
) {
  if (atUri.host.startsWith('did:')) {
    return atUri.href === record.uri
  }

  return atUri.host === record.author.handle && record.uri.endsWith(atUri.rkey)
}

export function getEmbeddedPost(
  v: unknown,
): AppBskyEmbedRecord.ViewRecord | undefined {
  if (
    bsky.dangerousIsType<AppBskyEmbedRecord.View>(v, AppBskyEmbedRecord.isView)
  ) {
    if (
      AppBskyEmbedRecord.isViewRecord(v.record) &&
      AppBskyFeedPost.isRecord(v.record.value)
    ) {
      return v.record
    }
  }
  if (
    bsky.dangerousIsType<AppBskyEmbedRecordWithMedia.View>(
      v,
      AppBskyEmbedRecordWithMedia.isView,
    )
  ) {
    if (
      AppBskyEmbedRecord.isViewRecord(v.record.record) &&
      AppBskyFeedPost.isRecord(v.record.record.value)
    ) {
      return v.record.record
    }
  }
}

export function embedViewRecordToPostView(
  v: AppBskyEmbedRecord.ViewRecord,
): AppBskyFeedDefs.PostView {
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
