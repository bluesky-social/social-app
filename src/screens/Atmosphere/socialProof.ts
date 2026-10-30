import {
  getActivityPostView,
  getArticleExternalView,
} from '#/screens/Atmosphere/externalViews'
import {getActivityActor} from '#/screens/Atmosphere/presentation'
import {
  getActivityDocumentUri,
  getSharePostHref,
} from '#/screens/Atmosphere/relationships'
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
