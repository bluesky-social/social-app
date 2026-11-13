import {type AtUriString} from '@atproto/syntax'
import {type ModerationOpts, type ModerationUI} from '@bsky/sdk/moderation'

import {
  getAssociatedProfile,
  getGalleryImage,
} from '#/screens/Atmosphere/data/exploreData'
import {app, place, site, social} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {isActivityHidden, isActorHidden, moderateActivity} from './moderation'

const timeline = app.bsky.unspecced.getAtmosphereTimelineV2

type Profile = bsky.profile.AnyProfileView
type Profiles = ReadonlyMap<string, app.bsky.actor.defs.ProfileViewBasic>
export type TimelinePage = Pick<
  app.bsky.unspecced.getAtmosphereTimelineV2.$OutputBody,
  'feed' | 'relatedViews'
>
export type TimelineEntry = TimelinePage['feed'][number]
type SubjectView =
  app.bsky.unspecced.getAtmosphereTimelineV2.ActivitySubject['view']

/** Activity collections (record NSIDs) this tab knows how to render. */
const ACTIVITY_COLLECTIONS = [
  site.standard.document.$type,
  site.standard.graph.recommend.$type,
  site.standard.graph.subscription.$type,
  social.grain.gallery.$type,
  place.stream.livestream.$type,
] as const

export type ActivityCollection = (typeof ACTIVITY_COLLECTIONS)[number]

function isActivityCollection(nsid: string): nsid is ActivityCollection {
  return (ACTIVITY_COLLECTIONS as readonly string[]).includes(nsid)
}

/** The view each card renders, already checked to be renderable. */
export type ActivityContent =
  | {type: 'article'; view: app.bsky.embed.external.ViewArticle}
  | {type: 'publication'; view: app.bsky.embed.external.ViewArticlePublication}
  | {type: 'gallery'; view: app.bsky.embed.external.ViewGallery}
  | {type: 'livestream'; view: app.bsky.embed.external.ViewLivestream}

/** One pill below the card, e.g. "Recommended by Danielle +2". */
export type RelatedActivity = {
  collection: typeof site.standard.graph.recommend.$type
  /** Actors to show, with moderated ones left out. Never empty. */
  actors: app.bsky.actor.defs.ProfileViewBasic[]
  /** Every actor, including moderated ones, for "+N". */
  actorCount: number
}

export type ActivityCardRow = {
  kind: 'card'
  key: string
  collection: ActivityCollection
  /** The lead actor, shown as the avatar and first name in the sentence. */
  actor: Profile
  /** Distinct actors besides `actor` ("and 2 others"). */
  otherActorCount: number
  /** Activities in this row; more than one means an actor group. */
  activityCount: number
  /**
   * What each activity in an actor group targets (the articles, not the
   * recommends), newest first, for View all.
   */
  subjectUris?: AtUriString[]
  indexedAt: string
  content: ActivityContent
  related: RelatedActivity[]
  /** Hidden cards are already dropped, so any blur here can be revealed. */
  moderation: ModerationUI
}

export type ActivityWarningRow = {
  kind: 'warning'
  key: string
  reason: 'unsupported-entry' | 'unexpected-content' | 'missing-actor'
}

export type ActivityRow = ActivityCardRow | ActivityWarningRow

/**
 * The single boundary between the API response and the UI. Every entry
 * becomes at most one row. Moderation drops cards the user must not see (see
 * `isActivityHidden`); anything else we can't fully render becomes a visible
 * warning instead of being dropped.
 */
export function toActivityRows(
  {feed, relatedViews}: TimelinePage,
  /** Position of this page in the list; keeps fallback row keys unique. */
  pageIndex: number,
  moderationOpts: ModerationOpts,
): ActivityRow[] {
  const profiles = new Map<string, app.bsky.actor.defs.ProfileViewBasic>()
  for (const view of relatedViews) {
    if (bsky.isType(app.bsky.actor.defs.profileViewBasic, view)) {
      profiles.set(view.did, view)
    }
  }
  return feed.flatMap((entry, index) => {
    const row = toActivityRow(
      entry,
      `unsupported:${pageIndex}:${index}`,
      profiles,
      moderationOpts,
    )
    return row ? [row] : []
  })
}

function toActivityRow(
  entry: TimelineEntry,
  /** For entries with no identity of their own. */
  fallbackKey: string,
  profiles: Profiles,
  moderationOpts: ModerationOpts,
): ActivityRow | undefined {
  if (bsky.isType(timeline.activityItem, entry)) {
    return toCardRow(moderationOpts, {
      key: entry.ref.uri,
      collection: entry.collection,
      actor: profiles.get(entry.actor),
      otherActorCount: 0,
      activityCount: 1,
      indexedAt: entry.indexedAt,
      view: entry.subject.view,
      related: toRelatedActivity(
        entry.relatedActivity,
        profiles,
        moderationOpts,
      ),
    })
  }
  if (bsky.isType(timeline.activityActorGroup, entry)) {
    return toCardRow(moderationOpts, {
      key: entry.activities[0].ref.uri,
      collection: entry.collection,
      actor: profiles.get(entry.actor),
      otherActorCount: 0,
      activityCount: entry.activities.length,
      subjectUris: distinct(entry.activities.map(a => a.subject)),
      indexedAt: entry.indexedAt,
      // Only the newest subject is hydrated.
      view: entry.subjects[0].view,
      related: [],
    })
  }
  if (bsky.isType(timeline.activitySubjectGroup, entry)) {
    const actors = distinct(entry.activities.map(a => a.actor))
    /*
     * Lead with the newest actor the viewer can see, so one muted actor
     * doesn't hide the group. If none is visible, the newest one leads and
     * moderation drops the card.
     */
    const lead =
      actors
        .map(did => profiles.get(did))
        .find(actor => actor && !isActorHidden(actor, moderationOpts)) ??
      profiles.get(actors[0])
    return toCardRow(moderationOpts, {
      key: entry.activities[0].ref.uri,
      collection: entry.collection,
      actor: lead,
      otherActorCount: actors.length - 1,
      activityCount: 1,
      indexedAt: entry.indexedAt,
      view: entry.subject.view,
      related: [],
    })
  }
  return {kind: 'warning', key: fallbackKey, reason: 'unsupported-entry'}
}

function toCardRow(
  moderationOpts: ModerationOpts,
  {
    key,
    collection,
    actor,
    view,
    ...rest
  }: Omit<
    ActivityCardRow,
    'kind' | 'collection' | 'actor' | 'content' | 'moderation'
  > & {
    collection: string
    actor: Profile | undefined
    view: SubjectView
  },
): ActivityRow | undefined {
  if (!isActivityCollection(collection)) {
    return {kind: 'warning', key, reason: 'unsupported-entry'}
  }
  if (!actor) return {kind: 'warning', key, reason: 'missing-actor'}
  const content = toContent(collection, view)
  if (!content) return {kind: 'warning', key, reason: 'unexpected-content'}
  const moderation = moderateActivity(content, actor, moderationOpts)
  if (isActivityHidden(moderation)) return undefined
  return {kind: 'card', key, collection, actor, content, moderation, ...rest}
}

/** The content each collection's activities target. */
const CONTENT_TYPES: Record<ActivityCollection, ActivityContent['type']> = {
  [site.standard.document.$type]: 'article',
  [site.standard.graph.recommend.$type]: 'article',
  [site.standard.graph.subscription.$type]: 'publication',
  [social.grain.gallery.$type]: 'gallery',
  [place.stream.livestream.$type]: 'livestream',
}

/** Each collection must carry exactly one kind of view. */
function toContent(
  collection: ActivityCollection,
  view: SubjectView,
): ActivityContent | undefined {
  const content = toViewContent(view)
  return content?.type === CONTENT_TYPES[collection] ? content : undefined
}

/**
 * The card for one record on the activity list, or undefined when its view is
 * missing or can't be rendered.
 */
export function toViewContent(
  view: SubjectView | undefined,
): ActivityContent | undefined {
  const external = app.bsky.embed.external
  if (bsky.isType(external.viewArticle, view)) return {type: 'article', view}
  if (bsky.isType(external.viewArticlePublication, view)) {
    return {type: 'publication', view}
  }
  if (bsky.isType(external.viewGallery, view)) {
    // The card needs a photo to show and an author for the photo dialog.
    return getGalleryImage(view) &&
      getAssociatedProfile(view.associatedProfiles)
      ? {type: 'gallery', view}
      : undefined
  }
  if (bsky.isType(external.viewLivestream, view)) {
    return {type: 'livestream', view}
  }
  return undefined
}

/**
 * One pill per related collection. The timeline only includes profiles for
 * the newest few actors of each, so `actors` can be shorter than
 * `actorCount` even before moderation.
 */
function toRelatedActivity(
  activities: app.bsky.unspecced.getAtmosphereTimelineV2.ActivityItemRelatedActivity[] = [],
  profiles: Profiles,
  moderationOpts: ModerationOpts,
): RelatedActivity[] {
  // Recommends are the only related activity the timeline returns today.
  const actorDids = distinct(
    activities
      .filter(a => a.collection === site.standard.graph.recommend.$type)
      .map(a => a.actor),
  )
  const actors = actorDids.flatMap(did => {
    const actor = profiles.get(did)
    return actor && !isActorHidden(actor, moderationOpts) ? [actor] : []
  })
  // With nobody left to name, there's no pill.
  if (actors.length === 0) return []
  return [
    {
      collection: site.standard.graph.recommend.$type,
      actors,
      actorCount: actorDids.length,
    },
  ]
}

/** Values in first-seen order, without repeats. */
function distinct<T>(values: T[]): T[] {
  return [...new Set(values)]
}
