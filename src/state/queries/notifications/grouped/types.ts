import {type DidString} from '@atproto/syntax'

import {type app} from '#/lexicons'

/**
 * The `feed` values accepted by `app.bsky.notification.getGroupedNotifications`.
 */
export type GroupedNotificationsFeed =
  'all' | 'people-i-follow' | 'conversations' | 'followers' | 'activity'

type ProfileView = app.bsky.actor.defs.ProfileViewBasic
type PostView = app.bsky.feed.defs.PostView
type GeneratorView = app.bsky.feed.defs.GeneratorView
type StarterPackView = app.bsky.graph.defs.StarterPackViewBasic

/**
 * Guarantees a primary actor, so rows never have to handle an empty list.
 */
export type NonEmptyArray<T> = [T, ...T[]]

export function isNonEmpty<T>(items: T[]): items is NonEmptyArray<T> {
  return items.length > 0
}

/**
 * A parent post that may no longer be viewable. Kept explicit so the row can
 * say "replied to a deleted post" rather than dropping the notification.
 */
export type ParentPost =
  {type: 'post'; post: PostView} | {type: 'blocked'} | {type: 'notFound'}

type Base = {
  /**
   * Group id from the API, used as the list key.
   */
  id: string
  isRead: boolean
  indexedAt: string
  /**
   * Total number of underlying notifications. This is authoritative for copy
   * like "and 24 others", and is usually larger than the number of resolved
   * actors, since the API only includes views for the newest 10 per group.
   */
  count: number
}

/**
 * The people in a group of notifications from different actors, e.g.
 * everyone who liked a post.
 */
export type ActorGroup = {
  /**
   * The actors with a profile in `relatedViews`, newest first. The first is
   * the group's primary actor.
   */
  actors: NonEmptyArray<ProfileView>
  /**
   * Every actor in the group, newest first, including those without a
   * profile in `relatedViews`. A superset of the DIDs in `actors`, so the
   * rest can be loaded on demand. List-time moderation removes hidden
   * actors from both. May still be fewer than `count`.
   */
  actorDids: DidString[]
}

/**
 * A notification group from `getGroupedNotifications`, with every DID and
 * at-uri resolved against the page's `relatedViews`.
 *
 * Views are the original objects from the response (never copies), because
 * post and profile shadows are keyed by object identity.
 */
export type NotificationView =
  | (Base & ActorGroup & {type: 'like'; post: PostView})
  | (Base & {
      type: 'multiPostLike'
      actor: ProfileView
      posts: NonEmptyArray<PostView>
    })
  | (Base & {
      type: 'multiPostRepost'
      actor: ProfileView
      posts: NonEmptyArray<PostView>
    })
  | (Base & {
      /**
       * Likes of several posts via the viewer's reposts of them. `posts` are
       * the original posts.
       */
      type: 'multiPostLikeViaRepost'
      actor: ProfileView
      posts: NonEmptyArray<PostView>
    })
  | (Base & {
      /**
       * Reposts of several posts via the viewer's reposts of them. `posts`
       * are the original posts.
       */
      type: 'multiPostRepostViaRepost'
      actor: ProfileView
      posts: NonEmptyArray<PostView>
    })
  | (Base & ActorGroup & {type: 'repost'; post: PostView})
  | (Base &
      ActorGroup & {
        type: 'likeViaRepost'
        post: PostView
        viaRepost: string
      })
  | (Base &
      ActorGroup & {
        type: 'repostViaRepost'
        post: PostView
        viaRepost: string
      })
  | (Base &
      ActorGroup & {
        type: 'follow'
        /**
         * Only set when every follow in the group came via the same pack.
         */
        starterPack?: StarterPackView
      })
  | (Base & {
      type: 'subscribedPost'
      items: NonEmptyArray<{
        actor: ProfileView
        post: PostView
        /**
         * Set when the post replies to another.
         */
        parent?: ParentPost
      }>
    })
  | (Base & ActorGroup & {type: 'generatorLike'; generator: GeneratorView})
  | (Base & {type: 'reply'; post: PostView; parent: ParentPost})
  | (Base & {type: 'quote'; post: PostView; parent?: ParentPost})
  | (Base & {type: 'mention'; post: PostView; parent?: ParentPost})
  | (Base & {
      type: 'followBack'
      actor: ProfileView
      starterPack?: StarterPackView
    })
  | (Base & {type: 'verified'; actor: ProfileView})
  | (Base & {type: 'unverified'; actor: ProfileView})
  | (Base & {
      type: 'starterPackJoined'
      actor: ProfileView
      starterPack: StarterPackView
    })
  | (Base & {type: 'contactMatch'; actor: ProfileView})

export type NotificationViewType = NotificationView['type']

/**
 * One page of the grouped notifications query, after hydration.
 */
export type GroupedNotificationsPage = {
  cursor?: string
  seenAt?: string
  notifications: NotificationView[]
  /**
   * When the newest group in the response was indexed, in ms since the
   * epoch, counting groups that were dropped while hydrating. Undefined when
   * the response had none.
   */
  newestAt: number | undefined
}
