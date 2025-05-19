import {type $Typed, AppBskyUnspeccedGetPostThreadV2, AtUri} from '@atproto/api'
import {type QueryClient} from '@tanstack/react-query'

import {findAllPostsInQueryData as findAllPostsInExploreFeedPreviewsQueryData} from '#/state/queries/explore-feed-previews'
import {findAllPostsInQueryData as findAllPostsInNotifsQueryData} from '#/state/queries/notifications/feed'
import {findAllPostsInQueryData as findAllPostsInFeedQueryData} from '#/state/queries/post-feed'
import {findAllPostsInQueryData as findAllPostsInQuoteQueryData} from '#/state/queries/post-quotes'
import {findAllPostsInQueryData as findAllPostsInSearchQueryData} from '#/state/queries/search-posts'
import {
  type createPostThreadQueryKey,
  postThreadQueryKeyRoot,
} from '#/state/queries/usePostThread/types'
import {
  embedViewToThreadPlaceholder,
  postViewToThreadPlaceholder,
} from '#/state/queries/usePostThread/views'
import {didOrHandleUriMatches, getEmbeddedPost} from '#/state/queries/util'

export function createCacheMutator({
  queryKey,
  queryClient,
}: {
  queryKey: ReturnType<typeof createPostThreadQueryKey>
  queryClient: QueryClient
}) {
  return {
    insertReplies(
      parent: AppBskyUnspeccedGetPostThreadV2.ThreadItem,
      replies: AppBskyUnspeccedGetPostThreadV2.ThreadItem[],
    ) {
      queryClient.setQueryData<AppBskyUnspeccedGetPostThreadV2.OutputSchema>(
        queryKey,
        queryData => {
          if (!queryData) return

          const thread = [...queryData.thread]

          for (let i = 0; i < thread.length; i++) {
            const existingParent = thread[i]
            if (
              !AppBskyUnspeccedGetPostThreadV2.isThreadItemPost(
                existingParent.value,
              )
            )
              continue
            if (!AppBskyUnspeccedGetPostThreadV2.isThreadItemPost(parent.value))
              continue
            if (existingParent.uri !== parent.uri) continue

            /*
             * Update parent data
             */
            existingParent.value.post = {
              ...existingParent.value.post,
              replyCount: parent.value.post.replyCount,
            }

            /*
             * Splice in new replies
             */
            for (let ri = 0; ri < replies.length; ri++) {
              const reply = replies[ri]
              if (
                !AppBskyUnspeccedGetPostThreadV2.isThreadItemPost(reply.value)
              )
                continue
              const insertIndex = i + 1 + ri
              thread.splice(insertIndex, 0, {
                ...reply,
                depth: existingParent.depth + 1 + ri,
              })
            }
          }

          return {
            ...queryData,
            thread,
          }
        },
      )
    },
    deletePost(_post: AppBskyUnspeccedGetPostThreadV2.ThreadItem) {},
  }
}

export function getThreadPlaceholder(
  queryClient: QueryClient,
  uri: string,
): $Typed<AppBskyUnspeccedGetPostThreadV2.ThreadItem> | void {
  let partial
  for (let item of getThreadPlaceholderCandidates(queryClient, uri)) {
    /*
     * Currently, the backend doesn't send full post info in some cases (for
     * example, for quoted posts). We use missing `likeCount` as a way to
     * detect that. In the future, we should fix this on the backend, which
     * will let us always stop on the first result.
     *
     * TODO can we send in feeds and quotes?
     */
    const hasAllInfo = item.value.post.likeCount != null
    if (hasAllInfo) {
      return item
    } else {
      // Keep searching, we might still find a full post in the cache.
      partial = item
    }
  }
  return partial
}

export function* getThreadPlaceholderCandidates(
  queryClient: QueryClient,
  uri: string,
): Generator<
  $Typed<
    Omit<AppBskyUnspeccedGetPostThreadV2.ThreadItem, 'value'> & {
      value: $Typed<AppBskyUnspeccedGetPostThreadV2.ThreadItemPost>
    }
  >,
  void
> {
  const atUri = new AtUri(uri)

  /*
   * Check this thread in the cache first.
   * TODO extract just this for shadowing
   */
  const queryDatas =
    queryClient.getQueriesData<AppBskyUnspeccedGetPostThreadV2.OutputSchema>({
      queryKey: [postThreadQueryKeyRoot],
    })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) continue

    const {thread} = queryData

    for (const item of thread) {
      if (AppBskyUnspeccedGetPostThreadV2.isThreadItemPost(item.value)) {
        if (didOrHandleUriMatches(atUri, item.value.post)) {
          yield {
            $type: 'app.bsky.unspecced.getPostThreadV2#threadItem',
            ...item,
            depth: 0,
            value: item.value,
          }
        }

        const qp = getEmbeddedPost(item.value.post.embed)
        if (qp && didOrHandleUriMatches(atUri, qp)) {
          yield embedViewToThreadPlaceholder(qp)
        }
      }
    }
  }

  /*
   * Check notifications first. If you have a post in notifications, it's
   * often due to a like or a repost, and we want to prioritize a post object
   * with >0 likes/reposts over a stale version with no metrics in order to
   * avoid a notification->post scroll jump.
   */
  for (let post of findAllPostsInNotifsQueryData(queryClient, uri)) {
    yield postViewToThreadPlaceholder(post)
  }
  for (let post of findAllPostsInFeedQueryData(queryClient, uri)) {
    yield postViewToThreadPlaceholder(post)
  }
  for (let post of findAllPostsInQuoteQueryData(queryClient, uri)) {
    yield postViewToThreadPlaceholder(post)
  }
  for (let post of findAllPostsInSearchQueryData(queryClient, uri)) {
    yield postViewToThreadPlaceholder(post)
  }
  for (let post of findAllPostsInExploreFeedPreviewsQueryData(
    queryClient,
    uri,
  )) {
    yield postViewToThreadPlaceholder(post)
  }
}
