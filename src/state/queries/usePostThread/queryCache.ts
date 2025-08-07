import {
  type $Typed,
  type AppGndrActorDefs,
  type AppGndrFeedDefs,
  AppGndrUnspeccedDefs,
  type AppGndrUnspeccedGetPostThreadOtherV2,
  type AppGndrUnspeccedGetPostThreadV2,
  AtUri,
} from '@gander-social-atproto/api'
import {type QueryClient} from '@tanstack/react-query'

import {findAllPostsInQueryData as findAllPostsInExploreFeedPreviewsQueryData} from '#/state/queries/explore-feed-previews'
import {findAllPostsInQueryData as findAllPostsInNotifsQueryData} from '#/state/queries/notifications/feed'
import {findAllPostsInQueryData as findAllPostsInFeedQueryData} from '#/state/queries/post-feed'
import {findAllPostsInQueryData as findAllPostsInQuoteQueryData} from '#/state/queries/post-quotes'
import {findAllPostsInQueryData as findAllPostsInSearchQueryData} from '#/state/queries/search-posts'
import {getBranch} from '#/state/queries/usePostThread/traversal'
import {
  type ApiThreadItem,
  type createPostThreadOtherQueryKey,
  type createPostThreadQueryKey,
  type PostThreadParams,
  postThreadQueryKeyRoot,
} from '#/state/queries/usePostThread/types'
import {getRootPostAtUri} from '#/state/queries/usePostThread/utils'
import {postViewToThreadPlaceholder} from '#/state/queries/usePostThread/views'
import {didOrHandleUriMatches, getEmbeddedPost} from '#/state/queries/util'
import {embedViewRecordToPostView} from '#/state/queries/util'

export function createCacheMutator({
  queryClient,
  postThreadQueryKey,
  postThreadOtherQueryKey,
  params,
}: {
  queryClient: QueryClient
  postThreadQueryKey: ReturnType<typeof createPostThreadQueryKey>
  postThreadOtherQueryKey: ReturnType<typeof createPostThreadOtherQueryKey>
  params: Pick<PostThreadParams, 'view'> & {below: number}
}) {
  return {
    insertReplies(
      parentUri: string,
      replies: AppGndrUnspeccedGetPostThreadV2.ThreadItem[],
    ) {
      /*
       * Main thread query mutator.
       */
      queryClient.setQueryData<AppGndrUnspeccedGetPostThreadV2.OutputSchema>(
        postThreadQueryKey,
        data => {
          if (!data) return
          return {
            ...data,
            thread: mutator<AppGndrUnspeccedGetPostThreadV2.ThreadItem>([
              ...data.thread,
            ]),
          }
        },
      )

      /*
       * Additional replies query mutator.
       */
      queryClient.setQueryData<AppGndrUnspeccedGetPostThreadOtherV2.OutputSchema>(
        postThreadOtherQueryKey,
        data => {
          if (!data) return
          return {
            ...data,
            thread: mutator<AppGndrUnspeccedGetPostThreadOtherV2.ThreadItem>([
              ...data.thread,
            ]),
          }
        },
      )

      function mutator<T>(thread: ApiThreadItem[]): T[] {
        for (let i = 0; i < thread.length; i++) {
          const parent = thread[i]

          if (!AppGndrUnspeccedDefs.isThreadItemPost(parent.value)) continue
          if (parent.uri !== parentUri) continue

          /*
           * Update parent data
           */
          parent.value.post = {
            ...parent.value.post,
            replyCount: (parent.value.post.replyCount || 0) + 1,
          }

          const opDid = getRootPostAtUri(parent.value.post)?.host
          const nextPreexistingItem = thread.at(i + 1)
          const isEndOfReplyChain =
            !nextPreexistingItem || nextPreexistingItem.depth <= parent.depth
          const isParentRoot = parent.depth === 0
          const isParentBelowRoot = parent.depth > 0
          const optimisticReply = replies.at(0)
          const opIsReplier = AppGndrUnspeccedDefs.isThreadItemPost(
            optimisticReply?.value,
          )
            ? opDid === optimisticReply.value.post.author.did
            : false

          /*
           * Always insert replies if the following conditions are met. Max
           * depth checks are handled below.
           */
          const canAlwaysInsertReplies =
            isParentRoot ||
            (params.view === 'tree' && isParentBelowRoot) ||
            (params.view === 'linear' && isEndOfReplyChain)
          /*
           * Maybe insert replies if we're in linear view, the replier is the
           * OP, and certain conditions are met
           */
          const shouldReplaceWithOPReplies =
            params.view === 'linear' && opIsReplier && isParentBelowRoot

          if (canAlwaysInsertReplies || shouldReplaceWithOPReplies) {
            const branch = getBranch(thread, i, parent.depth)
            /*
             * OP insertions replace other replies _in linear view_.
             */
            const itemsToRemove = shouldReplaceWithOPReplies ? branch.length : 0
            const itemsToInsert = replies
              .map((r, ri) => {
                r.depth = parent.depth + 1 + ri
                return r
              })
              .filter(r => {
                // Filter out replies that are too deep for our UI
                return r.depth <= params.below
              })

            thread.splice(i + 1, itemsToRemove, ...itemsToInsert)
          }
        }

        return thread as T[]
      }
    },
    /**
     * Unused atm, post shadow does the trick, but it would be nice to clean up
     * the whole sub-tree on deletes.
     */
    deletePost(post: AppGndrUnspeccedGetPostThreadV2.ThreadItem) {
      queryClient.setQueryData<AppGndrUnspeccedGetPostThreadV2.OutputSchema>(
        postThreadQueryKey,
        queryData => {
          if (!queryData) return

          const thread = [...queryData.thread]

          for (let i = 0; i < thread.length; i++) {
            const existingPost = thread[i]
            if (!AppGndrUnspeccedDefs.isThreadItemPost(post.value)) continue

            if (existingPost.uri === post.uri) {
              const branch = getBranch(thread, i, existingPost.depth)
              thread.splice(branch.start, branch.length)
              break
            }
          }

          return {
            ...queryData,
            thread,
          }
        },
      )
    },
  }
}

export function getThreadPlaceholder(
  queryClient: QueryClient,
  uri: string,
): $Typed<AppGndrUnspeccedGetPostThreadV2.ThreadItem> | void {
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
    Omit<AppGndrUnspeccedGetPostThreadV2.ThreadItem, 'value'> & {
      value: $Typed<AppGndrUnspeccedDefs.ThreadItemPost>
    }
  >,
  void
> {
  /*
   * Check post thread queries first
   */
  for (const post of findAllPostsInQueryData(queryClient, uri)) {
    yield postViewToThreadPlaceholder(post)
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

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppGndrFeedDefs.PostView, void> {
  const atUri = new AtUri(uri)
  const queryDatas =
    queryClient.getQueriesData<AppGndrUnspeccedGetPostThreadV2.OutputSchema>({
      queryKey: [postThreadQueryKeyRoot],
    })

  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) continue

    const {thread} = queryData

    for (const item of thread) {
      if (AppGndrUnspeccedDefs.isThreadItemPost(item.value)) {
        if (didOrHandleUriMatches(atUri, item.value.post)) {
          yield item.value.post
        }

        const qp = getEmbeddedPost(item.value.post.embed)
        if (qp && didOrHandleUriMatches(atUri, qp)) {
          yield embedViewRecordToPostView(qp)
        }
      }
    }
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppGndrActorDefs.ProfileViewBasic, void> {
  const queryDatas =
    queryClient.getQueriesData<AppGndrUnspeccedGetPostThreadV2.OutputSchema>({
      queryKey: [postThreadQueryKeyRoot],
    })

  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) continue

    const {thread} = queryData

    for (const item of thread) {
      if (AppGndrUnspeccedDefs.isThreadItemPost(item.value)) {
        if (item.value.post.author.did === did) {
          yield item.value.post.author
        }

        const qp = getEmbeddedPost(item.value.post.embed)
        if (qp && qp.author.did === did) {
          yield qp.author
        }
      }
    }
  }
}
