import {
  AppBskyLabelerDefs,
  BskyAgent,
  InterpretedLabelValueDefinition,
  LABELS,
  ModerationCause,
  ModerationOpts,
  ModerationUI,
} from '@atproto/api'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'

export function getModerationCauseKey(cause: ModerationCause): string {
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
