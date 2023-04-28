import {ComAtprotoLabelDefs} from '@atproto/api'
import {LabelPreferencesModel} from 'state/models/ui/preferences'

export type Label = ComAtprotoLabelDefs.Label

export interface LabelValGroup {
  id: keyof LabelPreferencesModel | 'illegal' | 'unknown'
  title: string
  imagesOnly: boolean
  subtitle?: string
  warning: string
  values: string[]
}

export interface PostLabelInfo {
  postLabels: Label[]
  accountLabels: Label[]
  profileLabels: Label[]
  isMuted: boolean
  isBlocked: boolean
}

export interface ProfileLabelInfo {
  accountLabels: Label[]
  profileLabels: Label[]
  isMuted: boolean
  isBlocked: boolean
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
