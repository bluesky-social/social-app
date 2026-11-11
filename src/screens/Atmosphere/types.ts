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
export type ActivityActorGroup =
  app.bsky.unspecced.getAtmosphereTimeline.ActivityActorGroup
export type ActivitySubjectGroup =
  app.bsky.unspecced.getAtmosphereTimeline.ActivitySubjectGroup
export type ActivityGroup = ActivityActorGroup | ActivitySubjectGroup
export type ActivityGroupItem =
  app.bsky.unspecced.getAtmosphereTimeline.ActivityGroupItem
export type ActivityRelatedGroup =
  app.bsky.unspecced.getAtmosphereTimeline.ActivityRelatedGroup
export type ActivitySubject =
  app.bsky.unspecced.getAtmosphereTimeline.ActivitySubject
export type ActivityContent = ActivityItem | ActivitySubject
export type ActivityFeedEntry =
  app.bsky.unspecced.getAtmosphereTimeline.$OutputBody['feed'][number]
export type CollectionActivityItem<TCollection extends string> =
  ActivityItem & {
    collection: TCollection
  }
export type ActivityActor = Omit<app.bsky.actor.defs.ProfileViewBasic, '$type'>
export type ActivityActors = Record<string, ActivityActor>
export type ActivityShare = {
  activity: ActivityItem | ActivityGroupItem
  actor: ActivityActor
}

export function isActorGroup(
  group: ActivityGroup,
): group is ActivityActorGroup {
  return (
    group.$type ===
    'app.bsky.unspecced.getAtmosphereTimeline#activityActorGroup'
  )
}

export function isSubjectGroup(
  group: ActivityGroup,
): group is ActivitySubjectGroup {
  return (
    group.$type ===
    'app.bsky.unspecced.getAtmosphereTimeline#activitySubjectGroup'
  )
}

export type AtmosphereActivityPage =
  app.bsky.unspecced.getAtmosphereTimeline.$OutputBody & {
    actors: ActivityActors
  }
