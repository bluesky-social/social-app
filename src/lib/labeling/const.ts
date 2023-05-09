import {LabelPreferencesModel} from 'state/models/ui/preferences'
import {LabelValGroup} from './types'

export const ILLEGAL_LABEL_GROUP: LabelValGroup = {
  id: 'illegal',
  title: 'Illegal Content',
  warning: 'Illegal Content',
  values: ['csam', 'dmca-violation', 'nudity-nonconsentual'],
}

export const ALWAYS_FILTER_LABEL_GROUP: LabelValGroup = {
  id: 'always-filter',
  title: 'Content Warning',
  warning: 'Content Warning',
  values: ['!filter'],
}

export const ALWAYS_WARN_LABEL_GROUP: LabelValGroup = {
  id: 'always-warn',
  title: 'Content Warning',
  warning: 'Content Warning',
  values: ['!warn'],
}

export const UNKNOWN_LABEL_GROUP: LabelValGroup = {
  id: 'unknown',
  title: 'Unknown Label',
  warning: 'Content Warning',
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
    isAdultImagery: true,
  },
  nudity: {
    id: 'nudity',
    title: 'Other Nudity',
    subtitle: 'Including non-sexual and artistic',
    warning: 'Nudity',
    values: ['nudity'],
    isAdultImagery: true,
  },
  suggestive: {
    id: 'suggestive',
    title: 'Sexually Suggestive',
    subtitle: 'Does not include nudity',
    warning: 'Sexually Suggestive',
    values: ['sexual'],
    isAdultImagery: true,
  },
  gore: {
    id: 'gore',
    title: 'Violent / Bloody',
    subtitle: 'Gore, self-harm, torture',
    warning: 'Violence',
    values: ['gore', 'self-harm', 'torture'],
    isAdultImagery: true,
  },
  hate: {
    id: 'hate',
    title: 'Political Hate-Groups',
    warning: 'Hate',
    values: ['icon-kkk', 'icon-nazi', 'icon-intolerant', 'behavior-intolerant'],
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
