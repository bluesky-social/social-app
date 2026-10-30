import {atmospherePresentationConfig} from '#/screens/Atmosphere/config'
import {
  getActivityPostView,
  getArticleExternalView,
} from '#/screens/Atmosphere/externalViews'
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
} from '#/screens/Atmosphere/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/** Keeps separate proof categories and the original activity/profile references. */
export function getDocumentSocialProof(
  document: ActivityItem,
  {actors}: {actors: ActivityActors},
) {
  const recommenders: ActivityActor[] = []
  const shares: {activity: ActivityItem; actor: ActivityActor}[] = []
  const recommenderDids = new Set<string>()
  const sharerDids = new Set<string>()

  if (document.collection === activityCollections.document) {
    for (const activity of document.relatedActivity ?? []) {
      const view = getArticleExternalView(activity)
      if (
        getActivityDocumentUri(activity) !== document.record.uri ||
        !view?.associatedRefs?.some(
          ref =>
            ref.uri === document.record.uri && ref.cid === document.record.cid,
        )
      )
        continue
      const actor = getActivityActor(activity, actors)
      if (!actor) continue
      if (activity.collection === activityCollections.recommendation) {
        if (recommenderDids.has(actor.did)) continue
        recommenderDids.add(actor.did)
        recommenders.push(actor)
      } else if (activity.collection === activityCollections.share) {
        const post = getActivityPostView(activity)
        if (
          !post ||
          !bsky.matches(app.bsky.feed.post, post.record) ||
          !getSharePostHref(activity, actor) ||
          sharerDids.has(actor.did)
        )
          continue
        sharerDids.add(actor.did)
        shares.push({activity, actor})
      }
    }
  }
  return {recommenders, shares}
}

/** Signal-level presentation; renderers still resolve usable content and links. */
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
      if (!getArticleExternalView(first)) return 'footnote'
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
    case activityCollections.grainGallery:
    case activityCollections.grainFavorite:
      return 'card'
    case activityCollections.livestream:
      return !isActorGroup &&
        bsky.isType(app.bsky.embed.external.viewLivestream, first.view) &&
        getLivestreamStatus(first.view) === 'active'
        ? 'card'
        : 'footnote'
    default:
      return 'footnote'
  }
}
