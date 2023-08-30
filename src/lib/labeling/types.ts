import {ComAtprotoLabelDefs} from '@atproto/api'
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
