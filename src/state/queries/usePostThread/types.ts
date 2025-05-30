import {
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyUnspeccedGetPostThreadV2,
  type ModerationDecision,
} from '@atproto/api'

export const postThreadQueryKeyRoot = 'getPostThreadV2' as const

export const createPostThreadQueryKey = (
  props: Pick<UsePostThreadProps, 'params'>,
) => [postThreadQueryKeyRoot, props] as const

export type PostThreadParams = Pick<
  AppBskyUnspeccedGetPostThreadV2.QueryParams,
  'sort' | 'prioritizeFollowedUsers'
> & {
  anchor?: string
  view: 'tree' | 'linear'
}

export type UsePostThreadProps = {
  enabled?: boolean
  params: PostThreadParams
  state: {
    shownHiddenReplyKinds: Set<HiddenReplyKind>
  }
}

export enum HiddenReplyKind {
  Hidden = 'hidden',
  Muted = 'muted',
}

export type Slice =
  | {
      type: 'threadPost'
      key: string
      uri: string
      depth: number
      value: Omit<AppBskyUnspeccedGetPostThreadV2.ThreadItemPost, 'post'> & {
        post: Omit<AppBskyFeedDefs.PostView, 'record'> & {
          record: AppBskyFeedPost.Record
        }
      }
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
      value: AppBskyUnspeccedGetPostThreadV2.ThreadItemNoUnauthenticated
    }
  | {
      type: 'threadPostNotFound'
      key: string
      uri: string
      depth: number
      value: AppBskyUnspeccedGetPostThreadV2.ThreadItemNotFound
    }
  | {
      type: 'threadPostBlocked'
      key: string
      uri: string
      depth: number
      value: AppBskyUnspeccedGetPostThreadV2.ThreadItemBlocked
    }
  | {
      type: 'replyComposer'
      key: string
    }
  | {
      type: 'showHiddenReplies'
      key: string
      kind: HiddenReplyKind
    }
  | {
      type: 'readMore'
      key: string
      depth: number
      href: string
      moreReplies: number
      skippedIndentIndices: Set<number>
    }

export type TraversalMetadata = {
  /**
   * The depth of the post in the reply tree, where 0 is the root post. This is
   * calculated on the server.
   */
  depth: number
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
   * The number of replies that have been seen so far in the traversal. After
   * traverssal, we can use this to calculate if we actually got all the
   * replies we expected, or if some were blocked, etc.
   */
  repliesSeenCount: number
  /**
   * The index-0-based index of this reply in the parent post's replies.
   */
  repliesIndex: number
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
