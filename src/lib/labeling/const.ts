import {LabelPreferencesModel} from 'state/models/ui/preferences'

export interface LabelValGroup {
  id: keyof LabelPreferencesModel | 'illegal' | 'unknown'
  title: string
  subtitle?: string
  warning?: string
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
    title: 'Explicit Sexual Images',
    subtitle: 'i.e. Pornography',
    warning: 'Sexually Explicit',
    values: ['porn'],
  },
  nudity: {
    id: 'nudity',
    title: 'Other Nudity',
    subtitle: 'Including non-sexual and artistic',
    warning: 'Nudity',
    values: ['nudity'],
  },
  suggestive: {
    id: 'suggestive',
    title: 'Sexually Suggestive',
    subtitle: 'Does not include nudity',
    warning: 'Sexually Suggestive',
    values: ['sexual'],
  },
  gore: {
    id: 'gore',
    title: 'Violent / Bloody',
    subtitle: 'Gore, self-harm, torture',
    warning: 'Violence',
    values: ['gore', 'self-harm', 'torture'],
  },
  hate: {
    id: 'hate',
    title: 'Political Hate-Groups',
    warning: 'Hate',
    values: ['icon-kkk', 'icon-nazi'],
  },
  spam: {
    id: 'spam',
    title: 'Spam',
    subtitle: 'Excessive low-quality posts',
    warning: 'Spam',
    values: ['spam'],
  },
  impersonation: {
    id: 'impersonation',
    title: 'Impersonation',
    subtitle: 'Accounts falsely claiming to be people or orgs',
    warning: 'Impersonation',
    values: ['impersonation'],
  },
}
