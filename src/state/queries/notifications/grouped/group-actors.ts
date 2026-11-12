import {type DidString} from '@atproto/syntax'
import {type ModerationOpts} from '@bsky/sdk/moderation'

import {isActorHidden} from '#/state/queries/notifications/grouped/moderate'
import {
  type ActorGroup,
  type NonEmptyArray,
  type NotificationView,
} from '#/state/queries/notifications/grouped/types'
import {type app} from '#/lexicons'

type ProfileView = app.bsky.actor.defs.ProfileViewDetailed

/**
 * A notification that can be from a group of people, e.g. everyone who liked
 * a post.
 */
export type GroupNotificationView = Extract<
  NotificationView,
  {
    type:
      | 'like'
      | 'repost'
      | 'likeViaRepost'
      | 'repostViaRepost'
      | 'generatorLike'
      | 'follow'
      | 'subscribedPost'
  }
>

/**
 * The people in a group notification.
 */
export type NotificationGroup = ActorGroup & {
  /**
   * How many people the group is from, including any without a resolved
   * profile.
   */
  count: number
}

/**
 * Everyone in a group notification, with the actors it resolved first.
 *
 * A subscribed post group lists each author once. It only has the authors
 * whose profile and post both resolved, and its `count` counts posts, so
 * those authors are everyone.
 */
export function getNotificationGroup(
  notification: GroupNotificationView,
): NotificationGroup {
  if (notification.type !== 'subscribedPost') {
    const {actors, actorDids, count} = notification
    return {actors, actorDids, count}
  }
  const [first, ...rest] = notification.items
  const actors: NonEmptyArray<app.bsky.actor.defs.ProfileViewBasic> = [
    first.actor,
  ]
  for (const {actor} of rest) {
    if (!actors.some(other => other.did === actor.did)) {
      actors.push(actor)
    }
  }
  return {
    actors,
    actorDids: actors.map(actor => actor.did),
    count: actors.length,
  }
}

/**
 * How many actors "Show more" loads at once, the most
 * `app.bsky.actor.getProfiles` accepts.
 */
export const GROUP_ACTORS_PAGE_SIZE = 25

/**
 * One page of a group's actors, loaded beyond those its notification
 * resolved.
 */
export type GroupActorsPage = {
  /**
   * Every DID requested, including any that didn't come back, e.g. deleted
   * or taken down accounts, so that they're never requested again.
   */
  dids: DidString[]
  /**
   * The profiles that came back, in the order they were requested.
   */
  profiles: ProfileView[]
}

/**
 * The actors in a group that hydration couldn't resolve, newest first.
 */
export function getUnresolvedActorDids(group: ActorGroup): DidString[] {
  const resolved = new Set(group.actors.map(actor => actor.did))
  return group.actorDids.filter(did => !resolved.has(did))
}

/**
 * The DIDs for the next page: the first unresolved ones that no page has
 * requested yet. Empty once every one has been.
 */
export function getNextActorDids(
  unresolvedDids: DidString[],
  pages: GroupActorsPage[],
): DidString[] {
  const requested = new Set(pages.flatMap(page => page.dids))
  return unresolvedDids
    .filter(did => !requested.has(did))
    .slice(0, GROUP_ACTORS_PAGE_SIZE)
}

/**
 * Builds a page from a `getProfiles` response, putting the profiles back in
 * the order requested.
 */
export function createGroupActorsPage(
  dids: DidString[],
  profiles: ProfileView[],
): GroupActorsPage {
  const byDid = new Map(profiles.map(profile => [profile.did, profile]))
  return {
    dids,
    profiles: dids.flatMap(did => {
      const profile = byDid.get(did)
      return profile ? [profile] : []
    }),
  }
}

/**
 * The loaded actors to show, in order, with the same list-time moderation as
 * the notification's own actors. Only those still unresolved in the
 * notification are kept, so none repeat its actors even if it has changed
 * since they loaded.
 */
export function selectLoadedActors(
  pages: GroupActorsPage[],
  unresolvedDids: DidString[],
  moderationOpts: ModerationOpts | undefined,
): ProfileView[] {
  const unresolved = new Set(unresolvedDids)
  const seen = new Set<string>()
  return pages
    .flatMap(page => page.profiles)
    .filter(profile => {
      if (!unresolved.has(profile.did) || seen.has(profile.did)) return false
      seen.add(profile.did)
      return !isActorHidden(profile, moderationOpts)
    })
}
