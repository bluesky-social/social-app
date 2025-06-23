import {
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyFeedThreadgate,
  type AppBskyUnspeccedDefs,
  type AppBskyUnspeccedGetPostThreadOtherV2,
  type AppBskyUnspeccedGetPostThreadV2,
  type ModerationDecision,
} from '@atproto/api'

export type ApiThreadItem =
  | AppBskyUnspeccedGetPostThreadV2.ThreadItem
  | AppBskyUnspeccedGetPostThreadOtherV2.ThreadItem

export const postThreadQueryKeyRoot = 'post-thread-v2' as const

export const createPostThreadQueryKey = (props: PostThreadParams) =>
  [postThreadQueryKeyRoot, props] as const

export const createPostThreadOtherQueryKey = (
  props: Omit<AppBskyUnspeccedGetPostThreadOtherV2.QueryParams, 'anchor'> & {
    anchor?: string
  },
) => [postThreadQueryKeyRoot, 'other', props] as const

export type PostThreadParams = Pick<
  AppBskyUnspeccedGetPostThreadV2.QueryParams,
  'sort' | 'prioritizeFollowedUsers'
> & {
  anchor?: string
  view: 'tree' | 'linear'
}

export type UsePostThreadQueryResult = {
  hasOtherReplies: boolean
  thread: AppBskyUnspeccedGetPostThreadV2.ThreadItem[]
  threadgate?: Omit<AppBskyFeedDefs.ThreadgateView, 'record'> & {
    record: AppBskyFeedThreadgate.Record
  }
}

export type ThreadItem =
  | {
      type: 'threadPost'
      key: string
      uri: string
      depth: number
      value: Omit<AppBskyUnspeccedDefs.ThreadItemPost, 'post'> & {
        post: Omit<AppBskyFeedDefs.PostView, 'record'> & {
          record: AppBskyFeedPost.Record
        }
      }
      isBlurred: boolean
      moderation: ModerationDecision
      ui: {
        isAnchor: boolean
        showParentReplyLine: boolean
        showChildReplyLine: boolean
        indent: number
        isLastChild: boolean
        skippedIndentIndices: Set<number>
        precedesChildReadMore: boolean
      }
    }
  | {
      type: 'threadPostNoUnauthenticated'
      key: string
      uri: string
      depth: number
      value: AppBskyUnspeccedDefs.ThreadItemNoUnauthenticated
      ui: {
        showParentReplyLine: boolean
        showChildReplyLine: boolean
      }
    }
  | {
      type: 'threadPostNotFound'
      key: string
      uri: string
      depth: number
      value: AppBskyUnspeccedDefs.ThreadItemNotFound
    }
  | {
      type: 'threadPostBlocked'
      key: string
      uri: string
      depth: number
      value: AppBskyUnspeccedDefs.ThreadItemBlocked
    }
  | {
      type: 'replyComposer'
      key: string
    }
  | {
      type: 'showOtherReplies'
      key: string
      onPress: () => void
    }
  | {
      /*
       * Read more replies, downwards in the thread.
       */
      type: 'readMore'
      key: string
      depth: number
      href: string
      moreReplies: number
      skippedIndentIndices: Set<number>
    }
  | {
      /*
       * Read more parents, upwards in the thread.
       */
      type: 'readMoreUp'
      key: string
      href: string
    }
  | {
      type: 'skeleton'
      key: string
      item: 'anchor' | 'reply' | 'replyComposer'
    }

/**
 * Metadata collected while traversing the raw data from the thread response.
 * Some values here can be computed immediately, while others need to be
 * computed during a second pass over the thread after we know things like
 * total number of replies, the reply index, etc.
 *
 * The idea here is that these values should be objectively true in all cases,
 * such that we can use them later — either individually on in composite — to
 * drive rendering behaviors.
 */
export type TraversalMetadata = {
  /**
   * The depth of the post in the reply tree, where 0 is the root post. This is
   * calculated on the server.
   */
  depth: number
  /**
   * Indicates if this item is a "read more" link preceding this post that
   * continues the thread upwards.
   */
  followsReadMoreUp: boolean
  /**
   * Indicates if the post is the last reply beneath its parent post.
   */
  isLastSibling: boolean
  /**
   * Indicates the post is the end-of-the-line for a given branch of replies.
   */
  isLastChild: boolean
  /**
   * Indicates if the post is the left/lower-most branch of the reply tree.
   * Value corresponds to the depth at which this branch started.
   */
  isPartOfLastBranchFromDepth?: number
  /**
   * The depth of the slice immediately following this one, if it exists.
   */
  nextItemDepth?: number
  /**
   * This is a live reference to the parent metadata object. Mutations to this
   * are available for later use in children.
   */
  parentMetadata?: TraversalMetadata
  /**
   * Populated during the final traversal of the thread. Denotes whether
   * there is a "Read more" link for this item immediately following
   * this item.
   */
  precedesChildReadMore: boolean
  /**
   * The depth of the slice immediately preceding this one, if it exists.
   */
  prevItemDepth?: number
  /**
   * Any data needed to be passed along to the "read more" items. Keep this
   * trim for better memory usage.
   */
  postData: {
    uri: string
    authorHandle: string
  }
  /**
   * The total number of replies to this post, including those not hydrated
   * and returned by the response.
   */
  repliesCount: number
  /**
   * The number of replies to this post not hydrated and returned by the
   * response.
   */
  repliesUnhydrated: number
  /**
   * The number of replies that have been seen so far in the traversal.
   * Excludes replies that are moderated in some way, since those are not
   * "seen" on first load. Use `repliesIndexCounter` for the total number of
   * replies that were hydrated in the response.
   *
   * After traversal, we can use this to calculate if we actually got all the
   * replies we expected, or if some were blocked, etc.
   */
  repliesSeenCounter: number
  /**
   * The total number of replies to this post hydrated in this response. Used
   * for populating the `replyIndex` of the post by referencing this value on
   * the parent.
   */
  repliesIndexCounter: number
  /**
   * The index-0-based index of this reply in the parent post's replies.
   */
  replyIndex: number
  /**
   * Each slice is responsible for rendering reply lines based on its depth.
   * This value corresponds to any line indices that can be skipped e.g.
   * because there are no further replies below this sub-tree to render.
   */
  skippedIndentIndices: Set<number>
  /**
   * Indicates and stores parent data IF that parent has additional unhydrated
   * replies. This value is passed down to children along the left/lower-most
   * branch of the tree. When the end is reached, a "read more" is inserted.
   */
  upcomingParentReadMore?: TraversalMetadata
}
