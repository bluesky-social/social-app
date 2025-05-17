import {
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyUnspeccedDefs,
  type BskyThreadViewPreference,
  type ModerationDecision,
} from '@atproto/api'

export const postThreadQueryKeyRoot = 'getPostThreadV2' as const

export const createPostThreadQueryKey = (
  props: Pick<UsePostThreadProps, 'uri' | 'params'>,
) => [postThreadQueryKeyRoot, props] as const

export type PostThreadParams = {
  view: 'tree' | 'linear'
  sort: 'hotness' | 'oldest' | 'newest' | 'most-likes' | 'random' | string
  prioritizeFollows: BskyThreadViewPreference['prioritizeFollowedUsers']
}

export type UsePostThreadProps = {
  uri?: string
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
      type: 'threadSlice'
      key: string
      slice: Omit<AppBskyUnspeccedDefs.ThreadItemPost, 'post'> & {
        post: Omit<AppBskyFeedDefs.PostView, 'record'> & {
          record: AppBskyFeedPost.Record
        }
      }
      moderation: ModerationDecision
      ui: {
        isAnchor: boolean
        showParentReplyLine: boolean
        showChildReplyLine: boolean
      }
    }
  | {
      type: 'threadSliceNoUnauthenticated'
      key: string
      slice: AppBskyUnspeccedDefs.ThreadItemNoUnauthenticated
    }
  | {
      type: 'threadSliceNotFound'
      key: string
      slice: AppBskyUnspeccedDefs.ThreadItemNotFound
    }
  | {
      type: 'threadSliceBlocked'
      key: string
      slice: AppBskyUnspeccedDefs.ThreadItemBlocked
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
