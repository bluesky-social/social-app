import {AtUri} from '@atproto/syntax'

import {isInvalidHandle} from '#/lib/strings/handles'
import {
  type ActivityGroupRowItem,
  type ActivityListItem,
  type ActivityRowItem,
} from './model'
import {getActivityContent} from './relationships'
import {
  type ActivityActor,
  type ActivityActors,
  activityCollections,
  type ActivityGroupItem,
  type ActivityItem,
  isActorGroup,
} from './types'

export type ActivityPresentationItem = ActivityRowItem | ActivityGroupRowItem

export type ActivityComputedView = {
  /** Ordered, unique, usable actor references from the item's hydrated actors. */
  actors: ActivityActor[]

  /** Subscription state of the rendered document, not unhydrated group members. */
  subscriptionState?: 'all' | 'none'
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

  const content = getActivityContent(item)
  return content ? (content.viewerState.subscribed ? 'all' : 'none') : undefined
}

/** Returns the original hydrated actor when usable, without a fallback identity. */
export function getActivityActor(
  activity: ActivityItem | ActivityGroupItem,
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
  if (item.type === 'group' && !isActorGroup(item.group)) {
    const seen = new Set<string>()
    return item.group.actors.filter(actor => {
      if (
        !isUsableActivityActor(actor) ||
        !isDid(actor.did) ||
        seen.has(actor.did)
      )
        return false
      seen.add(actor.did)
      return true
    })
  }
  const did =
    item.type === 'activity'
      ? tryGetAuthorityDid(item.activity.record.uri)
      : isActorGroup(item.group) && isDid(item.group.actor)
        ? item.group.actor
        : undefined
  const actor = did ? item.actors[did] : undefined
  return isUsableActivityActor(actor) && actor.did === did ? [actor] : []
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
