import {
  ComAtprotoLabelDefs,
  AppBskyLabelerDefs,
  DEFAULT_LABEL_SETTINGS,
  LABELS,
  BSKY_LABELER_DID,
  interpretLabelValueDefinition,
  interpretLabelValueDefinitions,
  InterprettedLabelValueDefinition,
} from '@atproto/api'
import {useLingui} from '@lingui/react'
import * as bcp47Match from 'bcp-47-match'

import {
  LabelGroup,
  ConfigurableLabelGroup,
} from '#/state/queries/preferences/types'
import {usePreferencesQuery} from './index'
import {useLabelersDetailedInfoQuery} from '../labeler'
import {
  useGlobalLabelStrings,
  GlobalLabelStrings,
} from '#/lib/moderation/useGlobalLabelStrings'

export type LabelGroupConfig = {
  id: LabelGroup
  title: string
  isAdultImagery?: boolean
  subtitle?: string
  warning: string
  values: string[]
}

/**
 * More strict than our default settings for logged in users.
 */
export const DEFAULT_LOGGED_OUT_LABEL_PREFERENCES: typeof DEFAULT_LABEL_SETTINGS =
  Object.fromEntries(
    Object.entries(DEFAULT_LABEL_SETTINGS).map(([key, _pref]) => [key, 'hide']),
  )

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

export function useMyLabelers() {
  const prefs = usePreferencesQuery()
  const dids = prefs.data?.moderationPrefs.mods.map(m => m.did) || []
  if (!dids.includes(BSKY_LABELER_DID)) {
    dids.push(BSKY_LABELER_DID)
  }
  const labelers = useLabelersDetailedInfoQuery({dids})
  return labelers.data || []
}

export function useLabelDefinitions() {
  const labelers = useMyLabelers()
  return {
    labelDefs: Object.fromEntries(
      labelers.map(labeler => [
        labeler.creator.did,
        interpretLabelValueDefinitions(labeler),
      ]),
    ),
    labelers,
  }
}
