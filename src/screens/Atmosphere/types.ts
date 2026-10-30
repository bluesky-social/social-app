import {type app} from '#/lexicons'

export const activityCollections = {
  document: 'site.standard.document',
  publication: 'site.standard.publication',
  recommendation: 'site.standard.graph.recommend',
  subscription: 'site.standard.graph.subscription',
  livestream: 'place.stream.livestream',
  grainGallery: 'social.grain.gallery',
  grainFavorite: 'social.grain.favorite',
  share: 'app.bsky.feed.post',
} as const

export type KnownActivityCollection =
  (typeof activityCollections)[keyof typeof activityCollections]

const knownActivityCollections = new Set<string>(
  Object.values(activityCollections),
)

export function isKnownActivityCollection(
  collection: string,
): collection is KnownActivityCollection {
  return knownActivityCollections.has(collection)
}

export type ActivityItem = app.bsky.unspecced.getAtmosphereTimeline.ActivityItem
export type ActivityRecord =
  app.bsky.unspecced.getAtmosphereTimeline.ActivityRecord
export type ActivityView = ActivityItem['view']
export type ActivityGroup =
  app.bsky.unspecced.getAtmosphereTimeline.ActivityGroup
export type ActivityOverflow =
  app.bsky.unspecced.getAtmosphereTimeline.ActivityItemOverflow
export type ActivityFeedEntry =
  app.bsky.unspecced.getAtmosphereTimeline.$OutputBody['feed'][number]
export type CollectionActivityItem<TCollection extends string> =
  ActivityItem & {
    collection: TCollection
  }
export type ActivityActor = Omit<app.bsky.actor.defs.ProfileViewBasic, '$type'>
export type ActivityActors = Record<string, ActivityActor>
export type AtmosphereActivityPage =
  app.bsky.unspecced.getAtmosphereTimeline.$OutputBody & {
    actors: ActivityActors
  }
