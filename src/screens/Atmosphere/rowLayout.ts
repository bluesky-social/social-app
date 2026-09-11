import {
  createDocumentExternalView,
  createPublicationExternalView,
} from '#/screens/Atmosphere/externalViews'
import {getGrainPhotos} from '#/screens/Atmosphere/photos'
import {
  type ActivityPresentationItem,
  type ActivityPresentationProps,
  getActivityActor,
} from '#/screens/Atmosphere/presentation'
import {
  getActivityDocumentUri,
  getFirstActivity,
  getSharePostHref,
} from '#/screens/Atmosphere/relationships'
import {getActivityPresentationKind} from '#/screens/Atmosphere/socialProof'
import {getLivestreamStatus} from '#/screens/Atmosphere/streams'
import {
  type ActivityActor,
  activityCollections,
  type ActivityItem,
  isLivestreamRecord,
  isShareRecord,
  isSubscriptionRecord,
} from '#/screens/Atmosphere/types'

export type ActivityRowKind = 'card' | 'footnote'

/** Mirrors the actual content fallback, not just a signal-level promotion. */
export function getActivityRowKind(
  props: ActivityPresentationProps,
): ActivityRowKind | undefined {
  const {item, computedItemView} = props
  const first = getFirstActivity(item)
  if (!first || computedItemView.actors.length === 0) return undefined
  const collection =
    item.type === 'group' ? item.group.collection : first.collection

  switch (collection) {
    case activityCollections.document:
    case activityCollections.recommendation:
      return getActivityPresentationKind(props) === 'card' &&
        createDocumentExternalView({
          uri: getArticleActivityUri(item),
          ...item,
        })?.title.trim()
        ? 'card'
        : 'footnote'
    case activityCollections.subscription:
      return getActivityPresentationKind(props) === 'card' &&
        createPublicationExternalView({
          uri: getSubscriptionActivityUri(item),
          ...item,
        })?.title.trim()
        ? 'card'
        : 'footnote'
    case activityCollections.share:
      return getShareActivities(item).length > 0 ? 'card' : 'footnote'
    case activityCollections.grainPhoto:
      return getGrainPhotos(item).length > 0 ? 'card' : 'footnote'
    case activityCollections.livestream: {
      const record = item.associatedRecords[first.record.uri]?.record
      return !(item.type === 'group' && item.group.groupBy === 'actor') &&
        isLivestreamRecord(record) &&
        getLivestreamStatus(record) === 'active'
        ? 'card'
        : 'footnote'
    }
    case activityCollections.publication:
      return (item.type === 'group' ? item.group.items : [first]).some(
        activity =>
          createPublicationExternalView({uri: activity.record.uri, ...item}),
      )
        ? 'card'
        : 'footnote'
    default:
      return 'footnote'
  }
}

/** Only interaction subject groups override the first child's document target. */
export function getArticleActivityUri(item: ActivityPresentationItem) {
  const first = getFirstActivity(item)
  if (!first) return undefined
  const collection =
    item.type === 'group' ? item.group.collection : first.collection
  return item.type === 'group' &&
    item.group.groupBy === 'subject' &&
    (collection === activityCollections.recommendation ||
      collection === activityCollections.share)
    ? (item.group.subject ??
        getActivityDocumentUri(first, item.associatedRecords))
    : getActivityDocumentUri(first, item.associatedRecords)
}

/** Uses the API subject for a subscription cluster, otherwise the first record. */
export function getSubscriptionActivityUri(item: ActivityPresentationItem) {
  const first = getFirstActivity(item)
  const record = first
    ? item.associatedRecords[first.record.uri]?.record
    : undefined
  const target = isSubscriptionRecord(record) ? record.publication : undefined
  return item.type === 'group' && item.group.groupBy === 'subject'
    ? (item.group.subject ?? target)
    : target
}

/** Shared by share rendering and adjacency classification so their fallbacks agree. */
export function getShareActivities(item: ActivityPresentationItem) {
  const first = getFirstActivity(item)
  const documentUri = getArticleActivityUri(item)
  if (!first || !documentUri) return []
  const candidates =
    item.type === 'group' && item.group.groupBy !== 'actor'
      ? item.group.items
      : [first]
  const shares: {activity: ActivityItem; actor: ActivityActor}[] = []
  const seen = new Set<string>()
  for (const activity of candidates) {
    const actor = getActivityActor(activity, item.actors)
    if (
      !actor ||
      !isShareRecord(item.associatedRecords[activity.record.uri]?.record) ||
      !getSharePostHref(activity, actor) ||
      getActivityDocumentUri(activity, item.associatedRecords) !==
        documentUri ||
      seen.has(activity.record.uri)
    )
      continue
    seen.add(activity.record.uri)
    shares.push({activity, actor})
  }
  return shares
}
