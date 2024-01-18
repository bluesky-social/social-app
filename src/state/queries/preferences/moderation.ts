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

/**
 * More strict than our default settings for logged in users.
 *
 * TODO(pwi)
 */
export const DEFAULT_LOGGED_OUT_LABEL_PREFERENCES: Record<
  ConfigurableLabelGroup,
  LabelPreference
> = {
  nsfw: 'hide',
  nudity: 'hide',
  suggestive: 'hide',
  gore: 'hide',
  hate: 'hide',
  spam: 'hide',
  impersonation: 'hide',
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
