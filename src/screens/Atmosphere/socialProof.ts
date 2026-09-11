import {atmospherePresentationConfig} from '#/screens/Atmosphere/config'
import {
  type ActivityPresentationProps,
  getActivityActor,
} from '#/screens/Atmosphere/presentation'
import {
  getActivityDocumentUri,
  getFirstActivity,
  getSharePostHref,
} from '#/screens/Atmosphere/relationships'
import {getLivestreamStatus} from '#/screens/Atmosphere/streams'
import {
  type ActivityActor,
  type ActivityActors,
  activityCollections,
  type ActivityItem,
  type AssociatedRecords,
  isDocumentRecord,
  isLivestreamRecord,
  isShareRecord,
} from '#/screens/Atmosphere/types'

/** Separate proof categories, retaining original activity and actor references. */
export function getDocumentSocialProof(
  document: ActivityItem,
  {
    associatedRecords,
    actors,
  }: {
    associatedRecords: AssociatedRecords
    actors: ActivityActors
  },
) {
  const recommenders: ActivityActor[] = []
  const shares: {activity: ActivityItem; actor: ActivityActor}[] = []
  const recommenderDids = new Set<string>()
  const sharerDids = new Set<string>()

  if (document.collection === activityCollections.document) {
    for (const activity of document.relatedActivity ?? []) {
      if (
        getActivityDocumentUri(activity, associatedRecords) !==
        document.record.uri
      ) {
        continue
      }
      const actor = getActivityActor(activity, actors)
      if (!actor) continue

      if (activity.collection === activityCollections.recommendation) {
        if (recommenderDids.has(actor.did)) continue
        recommenderDids.add(actor.did)
        recommenders.push(actor)
      } else if (
        activity.collection === activityCollections.share &&
        isShareRecord(associatedRecords[activity.record.uri]?.record) &&
        getSharePostHref(activity, actor)
      ) {
        if (sharerDids.has(actor.did)) continue
        sharerDids.add(actor.did)
        shares.push({activity, actor})
      }
    }
  }

  return {recommenders, shares}
}

/**
 * Signal-level presentation only. Renderers still resolve usable content and
 * links before laying out a card; no expanded views are cached on the item.
 */
export function getActivityPresentationKind(
  {item, computedItemView}: ActivityPresentationProps,
  config = atmospherePresentationConfig,
): 'card' | 'footnote' {
  const collection =
    item.type === 'activity' ? item.activity.collection : item.group.collection
  const first = getFirstActivity(item)
  if (!first || computedItemView.actors.length === 0) return 'footnote'
  const isActorGroup = item.type === 'group' && item.group.groupBy === 'actor'

  switch (collection) {
    case activityCollections.document: {
      if (!isDocumentRecord(item.associatedRecords[first.record.uri]?.record)) {
        return 'footnote'
      }
      const {recommenders, shares} = getDocumentSocialProof(first, item)
      return computedItemView.subscriptionState === 'all' ||
        recommenders.length >= config.recommendationCardThreshold ||
        shares.length > 0
        ? 'card'
        : 'footnote'
    }
    case activityCollections.recommendation:
      return !isActorGroup &&
        computedItemView.actors.length >= config.recommendationCardThreshold
        ? 'card'
        : 'footnote'
    case activityCollections.subscription:
      return !isActorGroup &&
        computedItemView.actors.length >= config.subscriptionCardThreshold
        ? 'card'
        : 'footnote'
    case activityCollections.share:
    case activityCollections.grainPhoto:
      return 'card'
    case activityCollections.livestream: {
      if (isActorGroup) return 'footnote'
      const record = item.associatedRecords[first.record.uri]?.record
      return isLivestreamRecord(record) &&
        getLivestreamStatus(record) === 'active'
        ? 'card'
        : 'footnote'
    }
    default:
      return 'footnote'
  }
}
