import {AtUri} from '@atproto/syntax'

import {
  getActivityPostView,
  getArticleExternalView,
  getPublicationExternalView,
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
import {getLivestreamUrl} from '#/screens/Atmosphere/streams'
import {
  type ActivityActor,
  activityCollections,
  type ActivityItem,
} from '#/screens/Atmosphere/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

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
      return getArticleActivityUri(item) &&
        getArticleExternalView(first)?.title.trim()
        ? 'card'
        : 'footnote'
    case activityCollections.subscription:
      return getSubscriptionActivityUri(item) &&
        getPublicationExternalView(first)?.title.trim()
        ? 'card'
        : 'footnote'
    case activityCollections.share:
      return getShareActivities(item).length > 0 ? 'card' : 'footnote'
    case activityCollections.grainGallery:
    case activityCollections.grainFavorite:
      return getGrainPhotos(item).length > 0 ? 'card' : 'footnote'
    case activityCollections.livestream:
      return bsky.isType(app.bsky.embed.external.viewLivestream, first.view) &&
        getLivestreamUrl(first.view)
        ? 'card'
        : 'footnote'
    case activityCollections.publication:
      return (item.type === 'group' ? item.group.items : [first]).some(
        activity => getPublicationExternalView(activity)?.title.trim(),
      )
        ? 'card'
        : 'footnote'
    default:
      return 'footnote'
  }
}

/** A subject group cannot replace the first child's pinned hydrated target. */
export function getArticleActivityUri(item: ActivityPresentationItem) {
  const first = getFirstActivity(item)
  if (!first) return undefined
  const target = getActivityDocumentUri(first)
  return item.type === 'group' &&
    item.group.groupBy === 'subject' &&
    (item.group.collection === activityCollections.recommendation ||
      item.group.collection === activityCollections.share) &&
    item.group.subject &&
    item.group.subject !== target
    ? undefined
    : target
}

/** Uses the publication reference carried by this subscription's hydrated view. */
export function getSubscriptionActivityUri(item: ActivityPresentationItem) {
  const first = getFirstActivity(item)
  if (!first) return undefined
  const refs = getPublicationExternalView(first)?.associatedRefs ?? []
  const target = refs.find(ref => {
    try {
      const uri = new AtUri(ref.uri)
      return (
        uri.host.startsWith('did:') &&
        uri.collection === activityCollections.publication &&
        Boolean(uri.rkey)
      )
    } catch {
      return false
    }
  })?.uri
  return item.type === 'group' &&
    item.group.groupBy === 'subject' &&
    item.group.subject &&
    item.group.subject !== target
    ? undefined
    : target
}

/** Shared by share rendering and adjacency classification so fallbacks agree. */
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
    const post = getActivityPostView(activity)
    if (
      !actor ||
      !post ||
      !bsky.matches(app.bsky.feed.post, post.record) ||
      !getSharePostHref(activity, actor) ||
      getActivityDocumentUri(activity) !== documentUri ||
      seen.has(activity.record.uri)
    )
      continue
    seen.add(activity.record.uri)
    shares.push({activity, actor})
  }
  return shares
}
