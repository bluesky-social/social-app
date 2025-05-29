import {
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyUnspeccedGetPostThreadV2,
  type AtUri,
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
        parentHasBranchingReplies: boolean
        isLastChild: boolean
        skippedIndents: Set<number>
        /**
         * Populated during the final traversal of the thread. Denotes whether
         * there is a "Read more" link for the parent immediately following
         * this item.
         */
        precedesParentReadMore?: boolean
        /**
         * Populated during the final traversal of the thread. Denotes whether
         * there is a "Read more" link for this item immediately following
         * this item.
         */
        precedesChildReadMore?: boolean
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
      indent: number
      href: string
      moreReplies: number
      skippedIndents: Set<number>
    }

export type TraversalMetadata = {
  depth: number
  replies: number
  unhydratedReplies: number
  /**
   * The number of replies that have been seen so far in the traversal. After
   * traverssal, we can use this to calculate if we actually got all the
   * replies we expected, or if some were blocked, etc.
   */
  seenReplies: number
  /**
   * The index-0-based index of this reply in the parent post's replies.
   */
  replyIndex: number
  hasBranchingReplies: boolean
  isLastSibling: boolean
  /**
   * Indicates the post is the end-of-the-line for a given branch of replies.
   */
  isLastChild: boolean
  /**
   * This is a live reference to the parent metadata object. Mutations to this
   * are available for later use in children.
   */
  parentMetadata?: TraversalMetadata
  /**
   * The depth of the slice immediately preceding this one, if it exists.
   */
  prevItemDepth?: number
  /**
   * The depth of the slice immediately following this one, if it exists.
   */
  nextItemDepth?: number
  skippedIndents: Set<number>
  [key: string]: any
}
