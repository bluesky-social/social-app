import {getActivityActor} from '#/screens/Atmosphere/presentation'
import {getSharePostHref} from '#/screens/Atmosphere/relationships'
import {
  type ActivityActor,
  activityCollections,
  type ActivityContent,
  type ActivityShare,
} from '#/screens/Atmosphere/types'

/** Related buckets contain references and profiles, never hydrated action views. */
export function getDocumentSocialProof(document: ActivityContent): {
  recommenders: ActivityActor[]
  shares: ActivityShare[]
} {
  const recommenders: ActivityActor[] = []
  const shares: ActivityShare[] = []
  const recommenderDids = new Set<string>()
  const shareUris = new Set<string>()
  if (
    !('collection' in document) ||
    document.collection !== activityCollections.document
  )
    return {recommenders, shares}

  for (const bucket of document.relatedActivity ?? []) {
    const actors = Object.fromEntries(
      bucket.actors.map(actor => [actor.did, actor]),
    )
    for (const activity of bucket.activities) {
      if (activity.collection !== bucket.collection) continue
      const actor = getActivityActor(activity, actors)
      if (!actor) continue
      if (bucket.collection === activityCollections.recommendation) {
        if (recommenderDids.has(actor.did)) continue
        recommenderDids.add(actor.did)
        recommenders.push(actor)
      } else if (bucket.collection === activityCollections.share) {
        if (
          shareUris.has(activity.record.uri) ||
          !getSharePostHref(activity, actor)
        )
          continue
        shareUris.add(activity.record.uri)
        shares.push({activity, actor})
      }
    }
  }
  return {recommenders, shares}
}
