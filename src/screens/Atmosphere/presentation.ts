import {AtUri} from '@atproto/syntax'

import {isInvalidHandle} from '#/lib/strings/handles'
import {
  type ActivityGroupRowItem,
  type ActivityListItem,
  type ActivityRowItem,
} from './model'
import {
  type ActivityActor,
  type ActivityActors,
  activityCollections,
  type ActivityItem,
} from './types'

export type ActivityPresentationItem = ActivityRowItem | ActivityGroupRowItem

export type ActivityComputedView = {
  /** Ordered, unique, usable actor references from the item's hydrated actors. */
  actors: ActivityActor[]

  /** Aggregate publication subscription state for document-root activity only. */
  subscriptionState?: 'all' | 'some' | 'none'
}

export type ActivityPresentationListItem = {
  item: ActivityListItem
  computedItemView: ActivityComputedView | undefined
}

export type ActivityPresentationProps = {
  item: ActivityPresentationItem
  computedItemView: ActivityComputedView
}

export function buildActivityPresentationListItems(
  items: ActivityListItem[],
): ActivityPresentationListItem[] {
  const firstItem = items[0]
  if (!firstItem) {
    return [{item: {type: 'empty', key: 'empty'}, computedItemView: undefined}]
  }

  const presentationItems: ActivityPresentationListItem[] = []
  for (const item of items) {
    if (!isPresentationItem(item)) {
      presentationItems.push({item, computedItemView: undefined})
      continue
    }

    const computedItemView = buildActivityComputedView(item)
    if (computedItemView) {
      presentationItems.push({item, computedItemView})
    }
  }

  return presentationItems.length > 0
    ? presentationItems
    : [{item: {type: 'empty', key: 'empty'}, computedItemView: undefined}]
}

function buildActivityComputedView(
  item: ActivityPresentationItem,
): ActivityComputedView | undefined {
  const actors = resolveActivityActors(item)
  if (actors.length === 0) {
    return undefined
  }

  const subscriptionState = getDocumentSubscriptionState(item)
  return subscriptionState ? {actors, subscriptionState} : {actors}
}

function getDocumentSubscriptionState(
  item: ActivityPresentationItem,
): ActivityComputedView['subscriptionState'] {
  const collection =
    item.type === 'activity' ? item.activity.collection : item.group.collection
  if (collection !== activityCollections.document) {
    return undefined
  }

  const activities =
    item.type === 'activity' ? [item.activity] : item.group.items
  const subscribedCount = activities.filter(
    activity => activity.viewerState.subscribed,
  ).length

  if (subscribedCount === 0) return 'none'
  if (subscribedCount === activities.length) return 'all'
  return 'some'
}

/** Returns the original hydrated actor when usable, without a fallback identity. */
export function getActivityActor(
  activity: ActivityItem,
  actors: ActivityActors,
): ActivityActor | undefined {
  return getRecordActor(activity.record.uri, actors)
}

/** Resolves a record's owner without inventing a missing profile. */
export function getRecordActor(
  uri: string | undefined,
  actors: ActivityActors,
): ActivityActor | undefined {
  const did = tryGetAuthorityDid(uri)
  const actor = did ? actors[did] : undefined
  return isUsableActivityActor(actor) && actor.did === did ? actor : undefined
}

function resolveActivityActors(
  item: ActivityPresentationItem,
): ActivityActor[] {
  return getCandidateActorDids(item).flatMap(did => {
    const actor = item.actors[did]
    return isUsableActivityActor(actor) && actor.did === did ? [actor] : []
  })
}

function getCandidateActorDids(item: ActivityPresentationItem): string[] {
  if (item.type === 'activity') {
    return dedupeDefined([tryGetAuthorityDid(item.activity.record.uri)])
  }

  if (item.group.groupBy === 'actor') {
    const groupActorDid = isDid(item.group.actor)
      ? item.group.actor
      : tryGetAuthorityDid(item.group.items[0]?.record.uri)

    return dedupeDefined([groupActorDid])
  }

  return dedupeDefined(
    item.group.items.map(activity => tryGetAuthorityDid(activity.record.uri)),
  )
}

function tryGetAuthorityDid(uri: string | undefined): string | undefined {
  if (!uri) return undefined

  try {
    const did = new AtUri(uri).host
    return isDid(did) ? did : undefined
  } catch {
    return undefined
  }
}

function dedupeDefined(values: Array<string | undefined>): string[] {
  const seen = new Set<string>()
  const deduped: string[] = []

  for (const value of values) {
    if (!value || seen.has(value)) continue
    seen.add(value)
    deduped.push(value)
  }

  return deduped
}

function isPresentationItem(
  item: ActivityListItem,
): item is ActivityPresentationItem {
  return item.type === 'activity' || item.type === 'group'
}

function isUsableActivityActor(
  actor: ActivityActor | undefined,
): actor is ActivityActor {
  return Boolean(actor?.did && actor.handle && !isInvalidHandle(actor.handle))
}

function isDid(value: string | undefined): value is string {
  return Boolean(value?.startsWith('did:'))
}
