import React from 'react'
import {
  ModerationCause,
  ModerationUI,
  AppBskyModerationDefs,
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

export function useConfigurableContentLabelGroups() {
  // TODO removeme
  return []
}

export function useConfigurableProfileLabelGroups() {
  // TODO removeme
  return []
}

export function useConfigurableAccountLabelGroups() {
  // TODO removeme
  return []
}

export function getModerationServiceTitle({
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
