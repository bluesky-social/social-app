import {
  LabelPreference,
  ComAtprotoLabelDefs,
  ModerationOpts,
} from '@atproto/api'

import {
  LabelGroup,
  ConfigurableLabelGroup,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences/types'

export type Label = ComAtprotoLabelDefs.Label

export type LabelGroupConfig = {
  id: LabelGroup
  title: string
  isAdultImagery?: boolean
  subtitle?: string
  warning: string
  values: string[]
}

export const DEFAULT_LABEL_PREFERENCES: Record<
  ConfigurableLabelGroup,
  LabelPreference
> = {
  nsfw: 'hide',
  nudity: 'warn',
  suggestive: 'warn',
  gore: 'warn',
  hate: 'hide',
  spam: 'hide',
  impersonation: 'hide',
}

export const ILLEGAL_LABEL_GROUP: LabelGroupConfig = {
  id: 'illegal',
  title: 'Illegal Content',
  warning: 'Illegal Content',
  values: ['csam', 'dmca-violation', 'nudity-nonconsensual'],
}

export const ALWAYS_FILTER_LABEL_GROUP: LabelGroupConfig = {
  id: 'always-filter',
  title: 'Content Warning',
  warning: 'Content Warning',
  values: ['!filter'],
}

export const ALWAYS_WARN_LABEL_GROUP: LabelGroupConfig = {
  id: 'always-warn',
  title: 'Content Warning',
  warning: 'Content Warning',
  values: ['!warn', 'account-security'],
}

export const UNKNOWN_LABEL_GROUP: LabelGroupConfig = {
  id: 'unknown',
  title: 'Unknown Label',
  warning: 'Content Warning',
  values: [],
}

export const CONFIGURABLE_LABEL_GROUPS: Record<
  ConfigurableLabelGroup,
  LabelGroupConfig
> = {
  nsfw: {
    id: 'nsfw',
    title: 'Explicit Sexual Images',
    subtitle: 'i.e. pornography',
    warning: 'Sexually Explicit',
    values: ['porn', 'nsfl'],
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
    values: ['gore', 'self-harm', 'torture', 'nsfl', 'corpse'],
    isAdultImagery: true,
  },
  hate: {
    id: 'hate',
    title: 'Hate Group Iconography',
    subtitle: 'Images of terror groups, articles covering events, etc.',
    warning: 'Hate Groups',
    values: ['icon-kkk', 'icon-nazi', 'icon-intolerant', 'behavior-intolerant'],
  },
  spam: {
    id: 'spam',
    title: 'Spam',
    subtitle: 'Excessive unwanted interactions',
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

export function getModerationOpts({
  userDid,
  preferences,
}: {
  userDid: string
  preferences: UsePreferencesQueryResponse
}): ModerationOpts {
  return {
    userDid: userDid,
    adultContentEnabled: preferences.adultContentEnabled,
    labels: {
      porn: preferences.contentLabels.nsfw,
      sexual: preferences.contentLabels.suggestive,
      nudity: preferences.contentLabels.nudity,
      nsfl: preferences.contentLabels.gore,
      corpse: preferences.contentLabels.gore,
      gore: preferences.contentLabels.gore,
      torture: preferences.contentLabels.gore,
      'self-harm': preferences.contentLabels.gore,
      'intolerant-race': preferences.contentLabels.hate,
      'intolerant-gender': preferences.contentLabels.hate,
      'intolerant-sexual-orientation': preferences.contentLabels.hate,
      'intolerant-religion': preferences.contentLabels.hate,
      intolerant: preferences.contentLabels.hate,
      'icon-intolerant': preferences.contentLabels.hate,
      spam: preferences.contentLabels.spam,
      impersonation: preferences.contentLabels.impersonation,
      scam: 'warn',
    },
    labelers: [
      {
        labeler: {
          did: '',
          displayName: 'Bluesky Social',
        },
        labels: {},
      },
    ],
  }
}
