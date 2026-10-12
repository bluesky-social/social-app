import {type DidString} from '@atproto/syntax'
import {type ModerationOpts} from '@bsky/sdk/moderation'

import {isActorHidden} from '#/state/queries/notifications/grouped/moderate'
import {type NotificationView} from '#/state/queries/notifications/grouped/types'
import {type app} from '#/lexicons'

type ProfileView = app.bsky.actor.defs.ProfileViewDetailed
type FollowNotificationView = Extract<NotificationView, {type: 'follow'}>

/**
 * How many followers "Show more" loads at once, the most
 * `app.bsky.actor.getProfiles` accepts.
 */
export const FOLLOW_ACTORS_PAGE_SIZE = 25

/**
 * One page of a follow group's followers, loaded beyond those its
 * notification resolved.
 */
export type FollowActorsPage = {
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
 * The followers in a follow group that hydration couldn't resolve, newest
 * first.
 */
export function getUnresolvedActorDids(
  notification: FollowNotificationView,
): DidString[] {
  const resolved = new Set(notification.actors.map(actor => actor.did))
  return notification.actorDids.filter(did => !resolved.has(did))
}

/**
 * The DIDs for the next page: the first unresolved ones that no page has
 * requested yet. Empty once every one has been.
 */
export function getNextActorDids(
  unresolvedDids: DidString[],
  pages: FollowActorsPage[],
): DidString[] {
  const requested = new Set(pages.flatMap(page => page.dids))
  return unresolvedDids
    .filter(did => !requested.has(did))
    .slice(0, FOLLOW_ACTORS_PAGE_SIZE)
}

/**
 * Builds a page from a `getProfiles` response, putting the profiles back in
 * the order requested.
 */
export function createFollowActorsPage(
  dids: DidString[],
  profiles: ProfileView[],
): FollowActorsPage {
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
 * The loaded followers to show, in order, with the same list-time moderation
 * as the notification's own actors. Only those still unresolved in the
 * notification are kept, so none repeat its actors even if it has changed
 * since they loaded.
 */
export function selectLoadedActors(
  pages: FollowActorsPage[],
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
