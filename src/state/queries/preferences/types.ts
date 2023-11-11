import {LabelPreference as APILabelPreference} from '@atproto/api'

export type LabelPreference = APILabelPreference | 'show'
export type ConfigurableLabelGroup =
  | 'nsfw'
  | 'nudity'
  | 'suggestive'
  | 'gore'
  | 'hate'
  | 'spam'
  | 'impersonation'
export type LabelGroup =
  | ConfigurableLabelGroup
  | 'illegal'
  | 'always-filter'
  | 'always-warn'
  | 'unknown'
