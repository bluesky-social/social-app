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
}

export interface ProfileLabelInfo {
  accountLabels: Label[]
  profileLabels: Label[]
  isMuted: boolean
}

export enum ModerationBehavior {
  Show,
  Hide,
  Warn,
  WarnContent,
  WarnImages,
}

export interface ModerationBehaviorWithReason {
  behavior: ModerationBehavior
  reason?: string
}

export interface PostModeration {
  avatar: {
    warn: boolean
    blur: boolean
  }
  list: ModerationBehaviorWithReason
  view: ModerationBehaviorWithReason
}

export interface ProfileModeration {
  avatar: {
    warn: boolean
    blur: boolean
  }
  list: ModerationBehaviorWithReason
  view: ModerationBehaviorWithReason
}
