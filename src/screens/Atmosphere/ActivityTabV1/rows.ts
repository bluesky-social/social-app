import {AtUri} from '@atproto/syntax'

import {
  getAssociatedProfile,
  getGalleryImage,
} from '#/screens/Atmosphere/data/exploreData'
import {app, place, site, social} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {type ActorProfiles} from './actorProfiles'

const timeline = app.bsky.unspecced.getAtmosphereTimeline

type Profile = bsky.profile.AnyProfileView
export type TimelineEntry =
  app.bsky.unspecced.getAtmosphereTimeline.$OutputBody['feed'][number]
type EntryView = app.bsky.unspecced.getAtmosphereTimeline.ActivityItem['view']

/** Activity collections this tab knows how to render. */
export type ActivityCollection =
  'document' | 'recommend' | 'subscription' | 'gallery' | 'livestream'

const RECOMMEND_NSID = 'site.standard.graph.recommend'

const collections: Record<string, ActivityCollection> = {
  [site.standard.document.$type]: 'document',
  // The client doesn't generate site.standard.graph lexicons.
  [RECOMMEND_NSID]: 'recommend',
  'site.standard.graph.subscription': 'subscription',
  [social.grain.gallery.$type]: 'gallery',
  [place.stream.livestream.$type]: 'livestream',
}

/** The view each card renders, already checked to be renderable. */
export type ActivityContent =
  | {type: 'article'; view: app.bsky.embed.external.ViewArticle}
  | {type: 'publication'; view: app.bsky.embed.external.ViewArticlePublication}
  | {type: 'gallery'; view: app.bsky.embed.external.ViewGallery}
  | {type: 'livestream'; view: app.bsky.embed.external.ViewLivestream}

/** One pill below the card, e.g. "Recommended by Danielle +2". */
export type RelatedActivity = {
  collection: 'recommend'
  actors: app.bsky.actor.defs.ProfileViewBasic[]
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
  indexedAt: string
  content: ActivityContent
  related: RelatedActivity[]
}

export type ActivityWarningRow = {
  kind: 'warning'
  key: string
  reason: 'unsupported-entry' | 'unexpected-content' | 'missing-actor'
}

export type ActivityRow = ActivityCardRow | ActivityWarningRow

/**
 * The single boundary between the API response and the UI. Every entry
 * becomes exactly one row, and anything we can't fully render becomes a
 * visible warning instead of being dropped.
 *
 * `profiles` resolves actors for entries that only carry a DID. It's
 * temporary until the timeline returns actor profiles itself.
 */
export function toActivityRows(
  feed: TimelineEntry[],
  profiles: ActorProfiles,
  /** Position of this page in the list; keeps fallback row keys unique. */
  pageIndex: number,
): ActivityRow[] {
  return feed.map((entry, index) =>
    toActivityRow(entry, `unsupported:${pageIndex}:${index}`, profiles),
  )
}

function toActivityRow(
  entry: TimelineEntry,
  /** For entries with no identity of their own. */
  fallbackKey: string,
  profiles: ActorProfiles,
): ActivityRow {
  if (bsky.isType(timeline.activityItem, entry)) {
    return toCardRow({
      key: entry.record.uri,
      collection: entry.collection,
      actor: profiles.get(new AtUri(entry.record.uri).host),
      otherActorCount: 0,
      activityCount: 1,
      indexedAt: entry.record.indexedAt,
      view: entry.view,
      related: toRelatedActivity(entry.relatedActivity),
    })
  }
  if (bsky.isType(timeline.activityActorGroup, entry)) {
    return toCardRow({
      key: entry.id,
      collection: entry.collection,
      actor: profiles.get(entry.actor),
      otherActorCount: 0,
      activityCount: entry.uris.length,
      indexedAt: entry.indexedAt,
      view: entry.item.view,
      related: toRelatedActivity(entry.item.relatedActivity),
    })
  }
  if (bsky.isType(timeline.activitySubjectGroup, entry)) {
    return toCardRow({
      key: entry.id,
      collection: entry.collection,
      actor: entry.actors[0],
      otherActorCount: Math.max(entry.actors.length - 1, 0),
      activityCount: 1,
      indexedAt: entry.indexedAt,
      view: entry.subject.view,
      related: [],
    })
  }
  return {kind: 'warning', key: fallbackKey, reason: 'unsupported-entry'}
}

function toCardRow({
  key,
  collection: nsid,
  actor,
  view,
  ...rest
}: Omit<ActivityCardRow, 'kind' | 'collection' | 'actor' | 'content'> & {
  collection: string
  actor: Profile | undefined
  view: EntryView
}): ActivityRow {
  const collection = collections[nsid]
  if (!collection) return {kind: 'warning', key, reason: 'unsupported-entry'}
  if (!actor) return {kind: 'warning', key, reason: 'missing-actor'}
  const content = toContent(collection, view)
  if (!content) return {kind: 'warning', key, reason: 'unexpected-content'}
  return {kind: 'card', key, collection, actor, content, ...rest}
}

/** Each collection must carry exactly one kind of view. */
function toContent(
  collection: ActivityCollection,
  view: EntryView,
): ActivityContent | undefined {
  const external = app.bsky.embed.external
  switch (collection) {
    case 'document':
    case 'recommend':
      return bsky.isType(external.viewArticle, view)
        ? {type: 'article', view}
        : undefined
    case 'subscription':
      return bsky.isType(external.viewArticlePublication, view)
        ? {type: 'publication', view}
        : undefined
    case 'gallery': {
      if (!bsky.isType(external.viewGallery, view)) return undefined
      // The card needs a photo to show and an author for the photo dialog.
      return getGalleryImage(view) &&
        getAssociatedProfile(view.associatedProfiles)
        ? {type: 'gallery', view}
        : undefined
    }
    case 'livestream':
      return bsky.isType(external.viewLivestream, view)
        ? {type: 'livestream', view}
        : undefined
  }
}

function toRelatedActivity(
  buckets: app.bsky.unspecced.getAtmosphereTimeline.ActivityRelatedGroup[] = [],
): RelatedActivity[] {
  return buckets.flatMap(bucket =>
    // Recommends are the only related activity the timeline returns today.
    bucket.collection === RECOMMEND_NSID && bucket.actors.length > 0
      ? [{collection: 'recommend', actors: bucket.actors}]
      : [],
  )
}
