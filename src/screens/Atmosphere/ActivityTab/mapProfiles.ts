import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {type ActorProfiles} from './actorProfiles'
import {type TimelineEntry} from './rows'

/*
 * Every place a profile lives in the activity queries' cached data, as
 * mappers. The queries' `select` maps profiles through their profile shadows,
 * and their cache finders (registered in `#/state/cache/profile-shadow`) walk
 * the same places, so the two can't drift apart.
 */

type Profile = bsky.profile.AnyProfileView
type ActivityItem = app.bsky.unspecced.getAtmosphereTimeline.ActivityItem
type EntryView = ActivityItem['view']

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

/** A view with its owners (and an article's publisher's owners) mapped. */
export function mapViewProfiles<V extends EntryView | undefined>(
  view: V,
  map: ProfileMapper,
): V {
  if (!view) return view
  return mapOwners(view as OwnedView, map) as V
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
type OwnedView = {associatedProfiles?: Profile[]; publisher?: OwnedView}

function mapOwners(view: OwnedView, map: ProfileMapper): OwnedView {
  return {
    ...view,
    ...(view.associatedProfiles && {
      associatedProfiles: view.associatedProfiles.map(map),
    }),
    ...(view.publisher && {publisher: mapOwners(view.publisher, map)}),
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
