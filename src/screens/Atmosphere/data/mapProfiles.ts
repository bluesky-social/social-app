import {type ActorProfiles} from '#/screens/Atmosphere/ActivityTab/actorProfiles'
import {type TimelineEntry} from '#/screens/Atmosphere/ActivityTab/rows'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/*
 * Every place a profile lives in the Atmosphere queries' cached data, as
 * mappers. The queries' `select` maps profiles through their profile shadows,
 * and their cache finders (registered in `#/state/cache/profile-shadow`) walk
 * the same places, so the two can't drift apart.
 */

type Profile = bsky.profile.AnyProfileView
type ActivityItem = app.bsky.unspecced.getAtmosphereTimeline.ActivityItem
type ExploreTab = app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody
type ExploreSection = ExploreTab[
  'articles' | 'publications' | 'photos' | 'livestreams']

/** Every lexicon view `mapViewProfiles` accepts. */
type MappableView = NonNullable<
  | ActivityItem['view']
  | app.bsky.unspecced.getAtmosphereTimeline.ActivitySubject['view']
  | app.bsky.unspecced.getAtmosphereRecordViews.RecordView['view']
  | ExploreSection['items'][number]['view']
>

export type ProfileMapper = <P extends Profile>(profile: P) => P

const timeline = app.bsky.unspecced.getAtmosphereTimeline

/** A timeline page with every profile in it passed through `map`. */
export function mapTimelinePageProfiles<
  Page extends {feed: TimelineEntry[]; profiles: ActorProfiles},
>(page: Page, map: ProfileMapper): Page {
  return {
    ...page,
    feed: page.feed.map(entry => mapEntryProfiles(entry, map)),
    profiles: new Map(
      [...page.profiles].map(([did, profile]) => [did, map(profile)]),
    ),
  }
}

/** The Explore tab's data with every profile in its views mapped. */
export function mapExploreProfiles(
  data: ExploreTab,
  map: ProfileMapper,
): ExploreTab {
  function mapSection<S extends {items: {view: MappableView}[]}>(
    section: S,
  ): S {
    return {
      ...section,
      items: section.items.map(item => ({
        ...item,
        view: mapViewProfiles(item.view, map),
      })),
    }
  }
  return {
    ...data,
    articles: mapSection(data.articles),
    publications: mapSection(data.publications),
    photos: mapSection(data.photos),
    livestreams: mapSection(data.livestreams),
  }
}

/**
 * A view with its profiles mapped: owners, likers and subscribers, and the
 * same for an article's publisher.
 */
export function mapViewProfiles<V extends MappableView | undefined>(
  view: V,
  map: ProfileMapper,
): V
export function mapViewProfiles(
  view: OwnedView | undefined,
  map: ProfileMapper,
): OwnedView | undefined {
  if (!view) return view
  return mapOwnedView(view, map)
}

/** The profiles in `walk` with this DID, e.g. for a cache finder. */
export function findProfiles(
  did: string,
  walk: (map: ProfileMapper) => unknown,
): Profile[] {
  const found: Profile[] = []
  walk(profile => {
    if (profile.did === did) found.push(profile)
    return profile
  })
  return found
}

/** The parts of an external view that hold profiles. */
type OwnedView = {
  associatedProfiles?: Profile[]
  likers?: Profile[]
  subscribers?: Profile[]
  publisher?: OwnedView
}

function mapOwnedView(view: OwnedView, map: ProfileMapper): OwnedView {
  return {
    ...view,
    ...(view.associatedProfiles && {
      associatedProfiles: view.associatedProfiles.map(map),
    }),
    ...(view.likers && {likers: view.likers.map(map)}),
    ...(view.subscribers && {subscribers: view.subscribers.map(map)}),
    ...(view.publisher && {publisher: mapOwnedView(view.publisher, map)}),
  }
}

function mapEntryProfiles(
  entry: TimelineEntry,
  map: ProfileMapper,
): TimelineEntry {
  if (bsky.isType(timeline.activityItem, entry)) {
    return mapItemProfiles(entry, map)
  }
  if (bsky.isType(timeline.activityActorGroup, entry)) {
    return {...entry, item: mapItemProfiles(entry.item, map)}
  }
  if (bsky.isType(timeline.activitySubjectGroup, entry)) {
    return {
      ...entry,
      actors: entry.actors.map(map),
      subject: {
        ...entry.subject,
        view: mapViewProfiles(entry.subject.view, map),
      },
    }
  }
  return entry
}

function mapItemProfiles<I extends ActivityItem>(
  item: I,
  map: ProfileMapper,
): I {
  return {
    ...item,
    view: mapViewProfiles(item.view, map),
    relatedActivity: item.relatedActivity?.map(bucket => ({
      ...bucket,
      actors: bucket.actors.map(map),
    })),
  }
}
