import {AtUri} from '@atproto/syntax'

import {IS_WEB} from '#/env'
import {type ActivityPresentationItem} from './presentation'
import {
  type ActivityActors,
  type ActivityItem,
  type AssociatedRecords,
  isDocumentRecord,
  isRecommendRecord,
  isSubscriptionRecord,
} from './types'

export function isAtmosphereDebugEnabled() {
  return IS_WEB && hasAtmosphereDebugParam(window.location.search)
}

export function hasAtmosphereDebugParam(search: string) {
  return new URLSearchParams(search).has('debug')
}

/**
 * Returns the row's reachable sidecar data while preserving references to the
 * original activity, associated-record, and actor objects.
 */
export function createAtmosphereDebugItem(
  item: ActivityPresentationItem,
): ActivityPresentationItem {
  const activities = getActivities(item)
  const pendingUris = activities.flatMap(getActivityUris)
  if (item.type === 'group' && item.group.subject) {
    pendingUris.push(item.group.subject)
  }

  const associatedRecords: AssociatedRecords = {}
  const includedUris = new Set<string>()
  for (let index = 0; index < pendingUris.length; index++) {
    const uri = pendingUris[index]
    if (!uri || includedUris.has(uri)) continue
    includedUris.add(uri)

    const associatedRecord = item.associatedRecords[uri]
    if (!associatedRecord) continue
    associatedRecords[uri] = associatedRecord
    pendingUris.push(...getAssociatedRecordReferences(associatedRecord.record))
  }

  const actorDids = new Set<string>()
  if (item.type === 'group' && item.group.actor) {
    actorDids.add(item.group.actor)
  }
  for (const uri of includedUris) {
    const did = getAuthorityDid(uri)
    if (did) actorDids.add(did)
  }

  const actors: ActivityActors = {}
  for (const did of actorDids) {
    const actor = item.actors[did]
    if (actor) actors[did] = actor
  }

  return {...item, associatedRecords, actors}
}

function getActivities(item: ActivityPresentationItem): ActivityItem[] {
  return item.type === 'activity' ? [item.activity] : item.group.items
}

function getActivityUris(activity: ActivityItem): string[] {
  return [
    activity.record.uri,
    ...(activity.relatedActivity?.flatMap(getActivityUris) ?? []),
  ]
}

function getAssociatedRecordReferences(
  record: Record<string, unknown>,
): string[] {
  if (isDocumentRecord(record)) return [record.site]
  if (isRecommendRecord(record)) return [record.document]
  if (isSubscriptionRecord(record)) return [record.publication]
  return []
}

function getAuthorityDid(uri: string): string | undefined {
  try {
    return new AtUri(uri).host
  } catch {
    return undefined
  }
}
