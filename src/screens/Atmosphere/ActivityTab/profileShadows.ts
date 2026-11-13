import {useEffect, useState} from 'react'

import {
  listenProfileShadowUpdate,
  mergeShadow,
  type ProfileShadow,
} from '#/state/cache/profile-shadow'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {type ActorProfiles} from './actorProfiles'
import {type TimelineEntry} from './rows'

/** Follows, mutes, blocks etc. made elsewhere in the app, by DID. */
export type ProfileShadows = ReadonlyMap<string, Partial<ProfileShadow>>

type Profile = bsky.profile.AnyProfileView
type ActivityItem = app.bsky.unspecced.getAtmosphereTimeline.ActivityItem
type EntryView = ActivityItem['view']

const timeline = app.bsky.unspecced.getAtmosphereTimeline

/**
 * Collects profile shadow updates while mounted. The activity queries apply
 * them in `select`, so muting or blocking someone elsewhere updates their
 * activity here without a refetch.
 */
export function useProfileShadows(): ProfileShadows {
  const [shadows, setShadows] = useState<ProfileShadows>(() => new Map())
  useEffect(
    () =>
      listenProfileShadowUpdate(({did, shadow}) => {
        setShadows(prev =>
          new Map(prev).set(did, {...prev.get(did), ...shadow}),
        )
      }),
    [],
  )
  return shadows
}

/** A timeline page with every profile in it shadowed. */
export function shadowTimelinePage(
  page: {feed: TimelineEntry[]; profiles: ActorProfiles},
  shadows: ProfileShadows,
): {feed: TimelineEntry[]; profiles: ActorProfiles} {
  if (shadows.size === 0) return page
  return {
    feed: page.feed.map(entry => shadowEntry(entry, shadows)),
    profiles: new Map(
      [...page.profiles].map(([did, profile]) => [
        did,
        shadowProfile(profile, shadows),
      ]),
    ),
  }
}

/** A view with its owners (and an article's publisher's owners) shadowed. */
export function shadowView<V extends EntryView | undefined>(
  view: V,
  shadows: ProfileShadows,
): V {
  if (!view || shadows.size === 0) return view
  return shadowOwners(view as OwnedView, shadows) as V
}

/** The parts of an external view that hold profiles. */
type OwnedView = {associatedProfiles?: Profile[]; publisher?: OwnedView}

function shadowOwners(view: OwnedView, shadows: ProfileShadows): OwnedView {
  return {
    ...view,
    ...(view.associatedProfiles && {
      associatedProfiles: shadowProfiles(view.associatedProfiles, shadows),
    }),
    ...(view.publisher && {publisher: shadowOwners(view.publisher, shadows)}),
  }
}

function shadowEntry(
  entry: TimelineEntry,
  shadows: ProfileShadows,
): TimelineEntry {
  if (bsky.isType(timeline.activityItem, entry)) {
    return shadowItem(entry, shadows)
  }
  if (bsky.isType(timeline.activityActorGroup, entry)) {
    return {...entry, item: shadowItem(entry.item, shadows)}
  }
  if (bsky.isType(timeline.activitySubjectGroup, entry)) {
    return {
      ...entry,
      actors: shadowProfiles(entry.actors, shadows),
      subject: {
        ...entry.subject,
        view: shadowView(entry.subject.view, shadows),
      },
    }
  }
  return entry
}

function shadowItem<I extends ActivityItem>(
  item: I,
  shadows: ProfileShadows,
): I {
  return {
    ...item,
    view: shadowView(item.view, shadows),
    relatedActivity: item.relatedActivity?.map(bucket => ({
      ...bucket,
      actors: shadowProfiles(bucket.actors, shadows),
    })),
  }
}

function shadowProfiles<P extends Profile>(
  profiles: P[],
  shadows: ProfileShadows,
): P[] {
  return profiles.map(profile => shadowProfile(profile, shadows))
}

function shadowProfile<P extends Profile>(
  profile: P,
  shadows: ProfileShadows,
): P {
  const shadow = shadows.get(profile.did)
  return shadow ? mergeShadow(profile, shadow) : profile
}
