import {AtUri} from '@atproto/syntax'
import {type InfiniteData} from '@tanstack/react-query'

import {
  type ActivityActor,
  type ActivityActors,
  type ActivityItem,
  type AssociatedRecords,
  type AtmosphereActivityPage,
  isRecommendRecord,
  isSubscriptionRecord,
} from '#/state/queries/atmosphereActivityTypes'

export type ActivityRowItem = {
  type: 'activity'
  key: string
  activity: ActivityItem
  associatedRecords: AssociatedRecords
  actors: ActivityActors
}

export type ActivityListItem =
  | ActivityRowItem
  | {type: 'loading'; key: 'loading'}
  | {type: 'empty'; key: 'empty'}
  | {type: 'error'; key: 'error'; error: string}

export type ActivityRowContent =
  | {
      type: 'recommendation'
      actorDid?: string
      actor: ActivityActor | undefined
      subjectDid: string
      subjectActor: ActivityActor | undefined
      title?: string
    }
  | {
      type: 'document'
      actorDid?: string
      actor: ActivityActor | undefined
      title?: string
    }
  | {
      type: 'publication'
      actorDid?: string
      actor: ActivityActor | undefined
      name?: string
    }
  | {
      type: 'subscription'
      actorDid?: string
      actor: ActivityActor | undefined
      name?: string
    }
  | {
      type: 'generic'
      actorDid?: string
      actor: ActivityActor | undefined
    }

export function buildActivityListItems(
  data: InfiniteData<AtmosphereActivityPage> | undefined,
  error?: string,
): ActivityListItem[] {
  if (!data) {
    return error
      ? [{type: 'error', key: 'error', error}]
      : [{type: 'loading', key: 'loading'}]
  }

  const associatedRecords: AssociatedRecords = {}
  const actors: ActivityActors = {}
  for (const page of data.pages) {
    Object.assign(associatedRecords, page.associatedRecords)
    Object.assign(actors, page.actors)
  }

  const seen = new Set<string>()
  const items: ActivityRowItem[] = []
  for (const page of data.pages) {
    for (const activity of page.feed) {
      if (seen.has(activity.uri)) continue
      seen.add(activity.uri)
      items.push({
        type: 'activity',
        key: activity.uri,
        activity,
        associatedRecords,
        actors,
      })
    }
  }

  return items.length > 0 ? items : [{type: 'empty', key: 'empty'}]
}

export function getActivityRowContent({
  activity,
  associatedRecords,
  actors,
}: ActivityRowItem): ActivityRowContent {
  const root = parseAtUri(activity.uri)
  const actor = root ? actors[root.did] : undefined
  const generic: ActivityRowContent = {
    type: 'generic',
    actorDid: root?.did,
    actor,
  }
  if (!root) return generic

  const rootRecord = associatedRecords[activity.uri]?.record
  if (!rootRecord) return generic

  switch (root.collection) {
    case 'site.standard.graph.recommend': {
      if (!isRecommendRecord(rootRecord)) return generic
      const documentUri = parseAtUri(rootRecord.document)
      if (!documentUri) return generic
      const document = associatedRecords[rootRecord.document]?.record
      if (!document) return generic
      return {
        type: 'recommendation',
        actorDid: root.did,
        actor,
        subjectDid: documentUri.did,
        subjectActor: actors[documentUri.did],
        title: typeof document.title === 'string' ? document.title : undefined,
      }
    }
    case 'site.standard.document':
      return {
        type: 'document',
        actorDid: root.did,
        actor,
        title:
          typeof rootRecord.title === 'string' ? rootRecord.title : undefined,
      }
    case 'site.standard.publication':
      return {
        type: 'publication',
        actorDid: root.did,
        actor,
        name: typeof rootRecord.name === 'string' ? rootRecord.name : undefined,
      }
    case 'site.standard.graph.subscription': {
      if (!isSubscriptionRecord(rootRecord)) return generic
      const publication = associatedRecords[rootRecord.publication]?.record
      if (!publication || !parseAtUri(rootRecord.publication)) return generic
      return {
        type: 'subscription',
        actorDid: root.did,
        actor,
        name:
          typeof publication.name === 'string' ? publication.name : undefined,
      }
    }
    default:
      return generic
  }
}

function parseAtUri(
  uri: string,
): {did: string; collection: string} | undefined {
  try {
    const parsed = new AtUri(uri)
    return {did: parsed.host, collection: parsed.collection}
  } catch {
    return undefined
  }
}
