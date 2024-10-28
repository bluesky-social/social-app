import React from 'react'
import {
  AppBskyLabelerDefs,
  BskyAgent,
  ComAtprotoLabelDefs,
  InterpretedLabelValueDefinition,
  LABELS,
  ModerationCause,
  ModerationOpts,
  ModerationUI,
} from '@atproto/api'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {AppModerationCause} from '#/components/Pills'

export const ADULT_CONTENT_LABELS = ['sexual', 'nudity', 'porn']
export const OTHER_SELF_LABELS = ['graphic-media']
export const SELF_LABELS = [...ADULT_CONTENT_LABELS, ...OTHER_SELF_LABELS]

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
  label: ComAtprotoLabelDefs.Label,
): boolean {
  return ['!hide', '!takedown'].includes(label.val)
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
    | AppBskyLabelerDefs.LabelerView
    | AppBskyLabelerDefs.LabelerViewDetailed,
): boolean {
  if (typeof labeler === 'string') {
    return BskyAgent.appLabelers.includes(labeler)
  }
  return BskyAgent.appLabelers.includes(labeler.creator.did)
}

export function isLabelerSubscribed(
  labeler:
    | string
    | AppBskyLabelerDefs.LabelerView
    | AppBskyLabelerDefs.LabelerViewDetailed,
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

export function useLabelSubject({label}: {label: ComAtprotoLabelDefs.Label}): {
  subject: Subject
} {
  return React.useMemo(() => {
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
