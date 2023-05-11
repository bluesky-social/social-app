import {ComAtprotoLabelDefs, AppBskyGraphDefs} from '@atproto/api'
import {LabelPreferencesModel} from 'state/models/ui/preferences'

export type Label = ComAtprotoLabelDefs.Label

export interface LabelValGroup {
  id:
    | keyof LabelPreferencesModel
    | 'illegal'
    | 'always-filter'
    | 'always-warn'
    | 'unknown'
  title: string
  isAdultImagery?: boolean
  subtitle?: string
  warning: string
  values: string[]
}

export interface PostLabelInfo {
  postLabels: Label[]
  accountLabels: Label[]
  profileLabels: Label[]
  isMuted: boolean
  mutedByList?: AppBskyGraphDefs.ListViewBasic
  isBlocking: boolean
  isBlockedBy: boolean
}

export interface ProfileLabelInfo {
  accountLabels: Label[]
  profileLabels: Label[]
  isMuted: boolean
  isBlocking: boolean
  isBlockedBy: boolean
}

export enum ModerationBehaviorCode {
  Show,
  Hide,
  Warn,
  WarnContent,
  WarnImages,
}

export interface ModerationBehavior {
  behavior: ModerationBehaviorCode
  isMute?: boolean
  noOverride?: boolean
  reason?: string
}

export interface AvatarModeration {
  warn: boolean
  blur: boolean
}

export interface PostModeration {
  avatar: AvatarModeration
  list: ModerationBehavior
  thread: ModerationBehavior
  view: ModerationBehavior
}

export interface ProfileModeration {
  avatar: AvatarModeration
  list: ModerationBehavior
  view: ModerationBehavior
}
