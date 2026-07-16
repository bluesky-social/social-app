import {useMemo} from 'react'
import {api} from '@bsky.app/sdk'
import {
  type InterpretedLabelValueDefinition,
  LABELS,
  type ModerationCause,
  type ModerationOpts,
  type ModerationUI,
} from '@bsky.app/sdk/moderation'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {type AppModerationCause} from '#/components/Pills'
import {type app, type com} from '#/lexicons'

export const ADULT_CONTENT_LABELS = ['sexual', 'nudity', 'porn'] as const
export const OTHER_SELF_LABELS = ['graphic-media'] as const
export const SELF_LABELS = [
  ...ADULT_CONTENT_LABELS,
  ...OTHER_SELF_LABELS,
] as const

export type AdultSelfLabel = (typeof ADULT_CONTENT_LABELS)[number]
export type OtherSelfLabel = (typeof OTHER_SELF_LABELS)[number]
export type SelfLabel = (typeof SELF_LABELS)[number]

export function getModerationCauseKey(
  cause: ModerationCause | AppModerationCause,
): string {
  const source =
    cause.source.type === 'labeler'
      ? cause.source.did
      : cause.source.type === 'list'
        ? cause.source.list.uri
        : 'user'
  if (cause.type === 'label') {
    return `label:${cause.label.val}:${source}`
  }
  return `${cause.type}:${source}`
}

export function isJustAMute(modui: ModerationUI): boolean {
  return modui.filters.length === 1 && modui.filters[0].type === 'muted'
}

export function moduiContainsHideableOffense(modui: ModerationUI): boolean {
  const label = modui.filters.at(0)
  if (label && label.type === 'label') {
    return labelIsHideableOffense(label.label)
  }
  return false
}

export function labelIsHideableOffense(
  label: com.atproto.label.defs.Label,
): boolean {
  return ['!hide', '!takedown'].includes(label.val)
}

/**
 * Filters out labels that are not user-facing: system labels (val prefixed
 * with `!`) and the user's own "bot" self-label.
 */
export function filterUserFacingLabels(
  labels: com.atproto.label.defs.Label[],
  currentAccountDid: string | undefined,
): com.atproto.label.defs.Label[] {
  return labels.filter(
    label =>
      !label.val.startsWith('!') &&
      !(label.val === 'bot' && label.src === currentAccountDid),
  )
}

export function getLabelingServiceTitle({
  displayName,
  handle,
}: {
  displayName?: string
  handle: string
}) {
  return displayName
    ? sanitizeDisplayName(displayName)
    : sanitizeHandle(handle, '@')
}

export function lookupLabelValueDefinition(
  labelValue: string,
  customDefs: InterpretedLabelValueDefinition[] | undefined,
): InterpretedLabelValueDefinition | undefined {
  let def
  if (!labelValue.startsWith('!') && customDefs) {
    def = customDefs.find(d => d.identifier === labelValue)
  }
  if (!def) {
    def = LABELS[labelValue as keyof typeof LABELS]
  }
  return def
}

export function isAppLabeler(
  labeler:
    | string
    | app.bsky.labeler.defs.LabelerView
    | app.bsky.labeler.defs.LabelerViewDetailed,
): boolean {
  if (typeof labeler === 'string') {
    return labeler === api.moderation.did
  }
  return labeler.creator.did === api.moderation.did
}

export function isLabelerSubscribed(
  labeler:
    | string
    | app.bsky.labeler.defs.LabelerView
    | app.bsky.labeler.defs.LabelerViewDetailed,
  modOpts: ModerationOpts,
) {
  labeler = typeof labeler === 'string' ? labeler : labeler.creator.did
  if (isAppLabeler(labeler)) {
    return true
  }
  return modOpts.prefs.labelers.find(l => l.did === labeler)
}

export type Subject =
  | {
      uri: string
      cid: string
    }
  | {
      did: string
    }

export function useLabelSubject({
  label,
}: {
  label: com.atproto.label.defs.Label
}): {
  subject: Subject
} {
  return useMemo(() => {
    const {cid, uri} = label
    if (cid) {
      return {
        subject: {
          uri,
          cid,
        },
      }
    } else {
      return {
        subject: {
          did: uri,
        },
      }
    }
  }, [label])
}

export function unique(
  value: ModerationCause,
  index: number,
  array: ModerationCause[],
) {
  return (
    array.findIndex(
      item => getModerationCauseKey(item) === getModerationCauseKey(value),
    ) === index
  )
}
