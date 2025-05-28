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
        isDeadEnd: boolean
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
      replyCount: number
      nextAnchor: Extract<Slice, {type: 'threadPost'}>
      nextAnchorUri: AtUri
    }

export type TraversalMetadata = {
  indent: number
  hasBranchingReplies: boolean
}
