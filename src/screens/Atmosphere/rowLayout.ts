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
  getActivityContent,
  getActivityDocumentUri,
  getFirstActivity,
  getSharePostHref,
} from '#/screens/Atmosphere/relationships'
import {getLivestreamUrl} from '#/screens/Atmosphere/streams'
import {
  activityCollections,
  type ActivityShare,
  isSubjectGroup,
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
  const content = getActivityContent(item)
  if (!first || !content || computedItemView.actors.length === 0)
    return undefined
  const collection =
    item.type === 'group' ? item.group.collection : first.collection

  switch (collection) {
    case activityCollections.document:
    case activityCollections.recommendation:
      return getArticleActivityUri(item) &&
        getArticleExternalView(content)?.title.trim()
        ? 'card'
        : 'footnote'
    case activityCollections.subscription:
      return getSubscriptionActivityUri(item) &&
        getPublicationExternalView(content)?.title.trim()
        ? 'card'
        : 'footnote'
    case activityCollections.share:
      return getArticleActivityUri(item) &&
        getArticleExternalView(content)?.title.trim() &&
        getShareActivities(item).length > 0
        ? 'card'
        : 'footnote'
    case activityCollections.grainGallery:
    case activityCollections.grainFavorite:
      return getGrainPhotos(item).length > 0 ? 'card' : 'footnote'
    case activityCollections.livestream:
      return bsky.isType(
        app.bsky.embed.external.viewLivestream,
        content.view,
      ) && getLivestreamUrl(content.view)
        ? 'card'
        : 'footnote'
    case activityCollections.publication:
      return getPublicationExternalView(content)?.title.trim()
        ? 'card'
        : 'footnote'
    default:
      return 'footnote'
  }
}

/** Subject groups render their supplied target, not unhydrated action views. */
export function getArticleActivityUri(item: ActivityPresentationItem) {
  const content = getActivityContent(item)
  return content ? getActivityDocumentUri(content) : undefined
}

/** Uses the shared subject or the publication pinned in the hydrated item. */
export function getSubscriptionActivityUri(item: ActivityPresentationItem) {
  const content = getActivityContent(item)
  if (!content) return undefined
  const candidates =
    'uri' in content
      ? [content]
      : (getPublicationExternalView(content)?.associatedRefs ?? [])
  return candidates.find(ref => {
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
}

/** Keeps reference-only shares linkable without manufacturing post content. */
export function getShareActivities(
  item: ActivityPresentationItem,
): ActivityShare[] {
  if (!getArticleActivityUri(item)) return []
  const first = getFirstActivity(item)
  if (!first) return []
  const subjectGroup =
    item.type === 'group' && isSubjectGroup(item.group) ? item.group : undefined
  const candidates = subjectGroup ? subjectGroup.activities : [first]
  const actors = subjectGroup
    ? Object.fromEntries(subjectGroup.actors.map(actor => [actor.did, actor]))
    : item.actors
  const shares: ActivityShare[] = []
  const seen = new Set<string>()
  for (const activity of candidates) {
    const actor = getActivityActor(activity, actors)
    if (
      !actor ||
      !getSharePostHref(activity, actor) ||
      seen.has(activity.record.uri)
    )
      continue
    if (!subjectGroup) {
      const post = getActivityPostView(activity)
      if (!post || !bsky.matches(app.bsky.feed.post, post.record)) continue
    }
    seen.add(activity.record.uri)
    shares.push({activity, actor})
  }
  return shares
}
