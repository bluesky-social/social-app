import React from 'react'
import {ModerationCause, LABEL_GROUPS, LabelGroupDefinition} from '@atproto/api'
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

export function getLabelGroupsFromLabels(labels: string[]) {
  const groups: LabelGroupDefinition[] = []

  for (const label of labels) {
    for (const group in LABEL_GROUPS) {
      const def = LABEL_GROUPS[group as LabelGroupDefinition['id']]
      if (def.labels.find(l => l.id === label)) {
        groups.push(def)
      }
    }
  }

  return Array.from(groups)
}

export function getConfigurableLabelGroups() {
  return Object.values(LABEL_GROUPS).filter(group => group.configurable)
}

export function useConfigurableLabelGroups() {
  return React.useMemo(() => getConfigurableLabelGroups(), [])
}

export function useConfigurableContentLabelGroups() {
  return React.useMemo(() => {
    const groups = getConfigurableLabelGroups()
    return groups.filter(group => {
      return group.labels.every(l => l.targets.includes('content'))
    })
  }, [])
}

export function useConfigurableProfileLabelGroups() {
  return React.useMemo(() => {
    const groups = getConfigurableLabelGroups()
    return groups.filter(group => {
      return group.labels.every(l => l.targets.includes('profile'))
    })
  }, [])
}

export function useConfigurableAccountLabelGroups() {
  return React.useMemo(() => {
    const groups = getConfigurableLabelGroups()
    return groups.filter(group => {
      return group.labels.every(l => l.targets.includes('account'))
    })
  }, [])
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
