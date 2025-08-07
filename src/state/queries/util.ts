import {
  type AppGndrActorDefs,
  AppGndrEmbedRecord,
  AppGndrEmbedRecordWithMedia,
  type AppGndrFeedDefs,
  AppGndrFeedPost,
  type AtUri,
} from '@gander-social-atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query'

import * as gndr from '#/types/gndr'

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
  record: {uri: string; author: AppGndrActorDefs.ProfileViewBasic},
) {
  if (atUri.host.startsWith('did:')) {
    return atUri.href === record.uri
  }

  return atUri.host === record.author.handle && record.uri.endsWith(atUri.rkey)
}

export function getEmbeddedPost(
  v: unknown,
): AppGndrEmbedRecord.ViewRecord | undefined {
  if (
    gndr.dangerousIsType<AppGndrEmbedRecord.View>(v, AppGndrEmbedRecord.isView)
  ) {
    if (
      AppGndrEmbedRecord.isViewRecord(v.record) &&
      AppGndrFeedPost.isRecord(v.record.value)
    ) {
      return v.record
    }
  }
  if (
    gndr.dangerousIsType<AppGndrEmbedRecordWithMedia.View>(
      v,
      AppGndrEmbedRecordWithMedia.isView,
    )
  ) {
    if (
      AppGndrEmbedRecord.isViewRecord(v.record.record) &&
      AppGndrFeedPost.isRecord(v.record.record.value)
    ) {
      return v.record.record
    }
  }
}

export function embedViewRecordToPostView(
  v: AppGndrEmbedRecord.ViewRecord,
): AppGndrFeedDefs.PostView {
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
