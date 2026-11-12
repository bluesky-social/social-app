/*
 * TEMPORARY: the timeline doesn't return profiles for the actors of
 * standalone items and actor groups yet. Until the backend does, this fills
 * them in. To remove, delete this file and then follow the typechecker:
 * - `fetchActorProfiles` and `ActivityTimelinePage.profiles` in
 *   `useActivityTimelineQuery.ts`
 * - the `profiles` argument to `toActivityRows` (`rows.ts`, `index.tsx`, tests)
 * - read actors from the entries instead; `missing-actor` warnings may then
 *   only be needed if the backend can still omit them
 */
import {type Client} from '@atproto/lex'
import {AtUri, type DidString, isValidDid} from '@atproto/syntax'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {type TimelineEntry} from './rows'

type Profile = bsky.profile.AnyProfileView
type EntryView = app.bsky.unspecced.getAtmosphereTimeline.ActivityItem['view']

export type ActorProfiles = ReadonlyMap<string, Profile>

const timeline = app.bsky.unspecced.getAtmosphereTimeline
const GET_PROFILES_LIMIT = 25

/**
 * Resolves only the DIDs that need it: first from profiles already in the
 * page, then from `getProfiles` for whatever is left.
 */
export async function fetchActorProfiles(
  client: Client,
  feed: TimelineEntry[],
): Promise<ActorProfiles> {
  const profiles = findActorProfiles(feed)
  const missing = [...getActorDids(feed)].filter(did => !profiles.has(did))
  for (let i = 0; i < missing.length; i += GET_PROFILES_LIMIT) {
    const res = await client.call(app.bsky.actor.getProfiles, {
      actors: missing.slice(i, i + GET_PROFILES_LIMIT),
    })
    for (const profile of res.profiles) profiles.set(profile.did, profile)
  }
  return profiles
}

/** Actors that the response identifies by DID only. */
export function getActorDids(feed: TimelineEntry[]): Set<DidString> {
  const dids = new Set<DidString>()
  for (const entry of feed) {
    if (bsky.isType(timeline.activityItem, entry)) {
      const did = new AtUri(entry.record.uri).host
      if (isValidDid(did)) dids.add(did)
    } else if (bsky.isType(timeline.activityActorGroup, entry)) {
      dids.add(entry.actor)
    }
  }
  return dids
}

/** Keeps only profiles for actor DIDs, not every profile in the page. */
export function findActorProfiles(feed: TimelineEntry[]): Map<string, Profile> {
  const dids = getActorDids(feed)
  const found = new Map<string, Profile>()
  for (const entry of feed) {
    for (const profile of profilesIn(entry)) {
      if (dids.has(profile.did)) found.set(profile.did, profile)
    }
  }
  return found
}

function* profilesIn(entry: TimelineEntry): Generator<Profile> {
  if (bsky.isType(timeline.activityItem, entry)) {
    yield* profilesInView(entry.view)
    for (const bucket of entry.relatedActivity ?? []) yield* bucket.actors
  } else if (bsky.isType(timeline.activityActorGroup, entry)) {
    yield* profilesInView(entry.item.view)
  } else if (bsky.isType(timeline.activitySubjectGroup, entry)) {
    yield* entry.actors
    yield* profilesInView(entry.subject.view)
  }
}

function* profilesInView(view: EntryView): Generator<Profile> {
  const external = app.bsky.embed.external
  if (bsky.isType(external.viewArticle, view)) {
    yield* view.associatedProfiles ?? []
    yield* view.likers ?? []
    yield* view.publisher?.associatedProfiles ?? []
  } else if (bsky.isType(external.viewArticlePublication, view)) {
    yield* view.associatedProfiles ?? []
    yield* view.subscribers ?? []
  } else if (bsky.isType(external.viewGallery, view)) {
    yield* view.associatedProfiles ?? []
    yield* view.likers ?? []
  } else if (bsky.isType(external.viewLivestream, view)) {
    yield* view.associatedProfiles ?? []
  }
}
