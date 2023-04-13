import {LabelPreferencesModel} from 'state/models/ui/preferences'

export interface LabelValGroup {
  id: keyof LabelPreferencesModel | 'illegal' | 'unknown'
  title: string
  values: string[]
}

export const ILLEGAL_LABEL_GROUP: LabelValGroup = {
  id: 'illegal',
  title: 'Illegal Content',
  values: ['csam', 'dmca-violation', 'nudity-nonconsentual'],
}

export const UNKNOWN_LABEL_GROUP: LabelValGroup = {
  id: 'unknown',
  title: 'Unknown Label',
  values: [],
}

export const CONFIGURABLE_LABEL_GROUPS: Record<
  keyof LabelPreferencesModel,
  LabelValGroup
> = {
  nsfw: {
    id: 'nsfw',
    title: 'Sexual Content',
    values: ['porn', 'nudity', 'sexual'],
  },
  gore: {
    id: 'gore',
    title: 'Violent / Bloody',
    values: ['gore', 'self-harm', 'torture'],
  },
  hate: {
    id: 'hate',
    title: 'Political Hate-Groups',
    values: ['icon-kkk', 'icon-nazi', 'icon-confederate'],
  },
  spam: {
    id: 'spam',
    title: 'Spam',
    values: ['spam'],
  },
  impersonation: {
    id: 'impersonation',
    title: 'Impersonation',
    values: ['impersonation'],
  },
}
