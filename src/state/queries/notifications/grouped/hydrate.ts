import {
  type GroupedNotificationsPage,
  isNonEmpty,
  type NonEmptyArray,
  type NotificationView,
  type ParentPost,
} from '#/state/queries/notifications/grouped/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

type OutputBody = app.bsky.notification.getGroupedNotifications.$OutputBody
type Group = app.bsky.notification.getGroupedNotifications.Group
type ProfileView = app.bsky.actor.defs.ProfileViewDetailed
type PostView = app.bsky.feed.defs.PostView
type GeneratorView = app.bsky.feed.defs.GeneratorView
type StarterPackView = app.bsky.graph.defs.StarterPackView

const defs = app.bsky.notification.getGroupedNotifications

/**
 * Lookups built from a page's `relatedViews`, plus the viewer to exclude from
 * actor lists.
 */
type Context = {
  viewerDid: string | undefined
  profiles: Map<string, ProfileView>
  /**
   * Every post-like view by uri. Blocked and not-found posts are kept as
   * markers so a reply can say why its parent is missing.
   */
  posts: Map<string, ParentPost>
  generators: Map<string, GeneratorView>
  starterPacks: Map<string, StarterPackView>
}

/**
 * Resolves every DID and at-uri in a `getGroupedNotifications` response
 * against its `relatedViews`, dropping groups that can't be rendered (unknown
 * kinds, missing subjects, no resolvable actors).
 *
 * Views in the result are the original objects from `res`, never copies,
 * since post and profile shadows are keyed by object identity.
 */
export function hydratePage(
  res: OutputBody,
  {viewerDid}: {viewerDid?: string},
): GroupedNotificationsPage {
  const ctx = createContext(res.relatedViews, viewerDid)
  const notifications: NotificationView[] = []
  let newestAt: number | undefined
  for (const group of res.groups) {
    const indexedAt = Date.parse(group.indexedAt)
    if (indexedAt > (newestAt ?? -Infinity)) {
      newestAt = indexedAt
    }
    const notification = hydrateGroup(group, ctx)
    if (notification) {
      notifications.push(notification)
    }
  }
  return {
    cursor: res.cursor,
    seenAt: res.seenAt,
    notifications,
    newestAt,
  }
}

function createContext(
  relatedViews: OutputBody['relatedViews'],
  viewerDid: string | undefined,
): Context {
  const ctx: Context = {
    viewerDid,
    profiles: new Map(),
    posts: new Map(),
    generators: new Map(),
    starterPacks: new Map(),
  }
  for (const view of relatedViews ?? []) {
    if (bsky.isType(app.bsky.actor.defs.profileViewDetailed, view)) {
      ctx.profiles.set(view.did, view)
    } else if (bsky.isType(app.bsky.feed.defs.postView, view)) {
      ctx.posts.set(view.uri, {type: 'post', post: view})
    } else if (bsky.isType(app.bsky.feed.defs.blockedPost, view)) {
      ctx.posts.set(view.uri, {type: 'blocked'})
    } else if (bsky.isType(app.bsky.feed.defs.notFoundPost, view)) {
      ctx.posts.set(view.uri, {type: 'notFound'})
    } else if (bsky.isType(app.bsky.feed.defs.generatorView, view)) {
      ctx.generators.set(view.uri, view)
    } else if (bsky.isType(app.bsky.graph.defs.starterPackView, view)) {
      ctx.starterPacks.set(view.uri, view)
    }
  }
  return ctx
}

function hydrateGroup(
  group: Group,
  ctx: Context,
): NotificationView | undefined {
  const {kind} = group
  const base = {
    id: group.id,
    isRead: group.isRead,
    indexedAt: group.indexedAt,
    count: group.count,
  }

  if (bsky.isType(defs.likeGroup, kind)) {
    const post = resolvePost(kind.post, ctx)
    const actors = resolveActors(kind.items, ctx)
    if (!post || !actors) return
    return {...base, type: 'like', post, actors}
  }

  if (bsky.isType(defs.repostGroup, kind)) {
    const post = resolvePost(kind.post, ctx)
    const actors = resolveActors(kind.items, ctx)
    if (!post || !actors) return
    return {...base, type: 'repost', post, actors}
  }

  if (bsky.isType(defs.likeViaRepostGroup, kind)) {
    const post = resolvePost(kind.post, ctx)
    const actors = resolveActors(kind.items, ctx)
    if (!post || !actors) return
    return {
      ...base,
      type: 'likeViaRepost',
      post,
      viaRepost: kind.viaRepost,
      actors,
    }
  }

  if (bsky.isType(defs.repostViaRepostGroup, kind)) {
    const post = resolvePost(kind.post, ctx)
    const actors = resolveActors(kind.items, ctx)
    if (!post || !actors) return
    return {
      ...base,
      type: 'repostViaRepost',
      post,
      viaRepost: kind.viaRepost,
      actors,
    }
  }

  if (bsky.isType(defs.multiPostLikeGroup, kind)) {
    const actor = resolveActor(kind.actor, ctx)
    const posts = nonEmpty(
      kind.items.flatMap(item => {
        const post = resolvePost(item.post, ctx)
        return post ? [post] : []
      }),
    )
    if (!actor || !posts) return
    return {...base, type: 'multiPostLike', actor, posts}
  }

  if (bsky.isType(defs.followGroup, kind)) {
    const actors = resolveActors(kind.items, ctx)
    if (!actors) return
    /*
     * Only attribute the group to a starter pack when every follow came via
     * the same one, otherwise "via <pack>" would be wrong for some actors.
     */
    const packUri = kind.items[0]?.starterPack
    const starterPack =
      packUri && kind.items.every(item => item.starterPack === packUri)
        ? ctx.starterPacks.get(packUri)
        : undefined
    return starterPack
      ? {...base, type: 'follow', actors, starterPack}
      : {...base, type: 'follow', actors}
  }

  if (bsky.isType(defs.subscribedPostGroup, kind)) {
    const items = nonEmpty(
      kind.items.flatMap(item => {
        const actor = resolveActor(item.actor, ctx)
        const post = resolvePost(item.post, ctx)
        return actor && post ? [{actor, post}] : []
      }),
    )
    if (!items) return
    return {...base, type: 'subscribedPost', items}
  }

  if (bsky.isType(defs.generatorLikeGroup, kind)) {
    const generator = ctx.generators.get(kind.generator)
    const actors = resolveActors(kind.items, ctx)
    if (!generator || !actors) return
    return {...base, type: 'generatorLike', generator, actors}
  }

  if (bsky.isType(defs.replyNotification, kind)) {
    const post = resolvePost(kind.post, ctx)
    if (!post) return
    return {
      ...base,
      type: 'reply',
      post,
      parent: resolveParent(kind.parent, ctx),
    }
  }

  if (bsky.isType(defs.quoteNotification, kind)) {
    const post = resolvePost(kind.post, ctx)
    if (!post) return
    return kind.parent
      ? {...base, type: 'quote', post, parent: resolveParent(kind.parent, ctx)}
      : {...base, type: 'quote', post}
  }

  if (bsky.isType(defs.mentionNotification, kind)) {
    const post = resolvePost(kind.post, ctx)
    if (!post) return
    return kind.parent
      ? {
          ...base,
          type: 'mention',
          post,
          parent: resolveParent(kind.parent, ctx),
        }
      : {...base, type: 'mention', post}
  }

  if (bsky.isType(defs.followBackNotification, kind)) {
    const actor = resolveActor(kind.actor, ctx)
    if (!actor) return
    const starterPack = kind.starterPack
      ? ctx.starterPacks.get(kind.starterPack)
      : undefined
    return starterPack
      ? {...base, type: 'followBack', actor, starterPack}
      : {...base, type: 'followBack', actor}
  }

  if (bsky.isType(defs.verifiedNotification, kind)) {
    const actor = resolveActor(kind.actor, ctx)
    if (!actor) return
    return {...base, type: 'verified', actor}
  }

  if (bsky.isType(defs.unverifiedNotification, kind)) {
    const actor = resolveActor(kind.actor, ctx)
    if (!actor) return
    return {...base, type: 'unverified', actor}
  }

  if (bsky.isType(defs.starterPackJoinedNotification, kind)) {
    const actor = resolveActor(kind.actor, ctx)
    const starterPack = ctx.starterPacks.get(kind.starterPack)
    if (!actor || !starterPack) return
    return {...base, type: 'starterPackJoined', actor, starterPack}
  }

  if (bsky.isType(defs.contactMatchNotification, kind)) {
    const actor = resolveActor(kind.actor, ctx)
    if (!actor) return
    return {...base, type: 'contactMatch', actor}
  }

  // Unknown kind, which the lexicon tells clients to ignore.
  return undefined
}

/**
 * Resolves a DID to its profile view. The viewer is treated as unresolved,
 * so self-likes and the like never show up as actors.
 */
function resolveActor(did: string, ctx: Context): ProfileView | undefined {
  if (did === ctx.viewerDid) return undefined
  return ctx.profiles.get(did)
}

/**
 * Resolves each item's actor, skipping unresolved ones and duplicates. The
 * first resolved actor is the group's primary actor.
 */
function resolveActors(
  items: {actor: string}[],
  ctx: Context,
): NonEmptyArray<ProfileView> | undefined {
  const seen = new Set<string>()
  const actors: ProfileView[] = []
  for (const {actor: did} of items) {
    if (seen.has(did)) continue
    seen.add(did)
    const actor = resolveActor(did, ctx)
    if (actor) {
      actors.push(actor)
    }
  }
  return nonEmpty(actors)
}

/**
 * Resolves an at-uri to a viewable post. Blocked and not-found posts resolve
 * to `undefined`.
 */
function resolvePost(uri: string, ctx: Context): PostView | undefined {
  const entry = ctx.posts.get(uri)
  return entry?.type === 'post' ? entry.post : undefined
}

/**
 * Resolves a parent at-uri. A uri with no view at all is treated as not
 * found, since there's nothing to render either way.
 */
function resolveParent(uri: string, ctx: Context): ParentPost {
  return ctx.posts.get(uri) ?? {type: 'notFound'}
}

function nonEmpty<T>(items: T[]): NonEmptyArray<T> | undefined {
  return isNonEmpty(items) ? items : undefined
}
