import {type Unknown$Type} from '@atproto/lex'
import {type AtUriString, type DidString} from '@atproto/syntax'
import {describe, expect, it} from '@jest/globals'

import {
  createGroupedNotificationsFixture,
  VIEWER_DID,
} from '#/state/queries/notifications/grouped/__fixtures__'
import {hydratePage} from '#/state/queries/notifications/grouped/hydrate'
import {
  type GroupedNotificationsPage,
  type NotificationView,
  type NotificationViewType,
} from '#/state/queries/notifications/grouped/types'
import {type app} from '#/lexicons'

type OutputBody = app.bsky.notification.getGroupedNotifications.$OutputBody
type Group = app.bsky.notification.getGroupedNotifications.Group
type Kind = Group['kind']

const NOW = new Date('2026-10-08T12:00:00.000Z')
const NS = 'app.bsky.notification.getGroupedNotifications'

/*
 * Views that exist in the fixture's `relatedViews`.
 */
const FUNGUS_POST: AtUriString = `at://${VIEWER_DID}/app.bsky.feed.post/fungus`
const PLANTS_POST: AtUriString = `at://${VIEWER_DID}/app.bsky.feed.post/plants`
const PRIYA_POST: AtUriString = 'at://did:plc:priya/app.bsky.feed.post/oyster'
const DANIELLE_REPLY: AtUriString =
  'at://did:plc:danielleyuhan/app.bsky.feed.post/reply-fungus'
const BLOCKED_POST: AtUriString =
  'at://did:plc:blockeduser/app.bsky.feed.post/blocked'
const NOT_FOUND_POST: AtUriString =
  'at://did:plc:deleted/app.bsky.feed.post/deleted'
const FUNGI_FEED: AtUriString = `at://${VIEWER_DID}/app.bsky.feed.generator/fungi`
const MYCOLOGY_PACK: AtUriString = `at://${VIEWER_DID}/app.bsky.graph.starterpack/mycology`
const SCICOMM_PACK: AtUriString =
  'at://did:plc:priya/app.bsky.graph.starterpack/scicomm'
const DANIELLE: DidString = 'did:plc:danielleyuhan'
const MICHAEL: DidString = 'did:plc:michaelblack'

/*
 * Things that don't.
 */
const MISSING_POST: AtUriString = 'at://did:plc:nobody/app.bsky.feed.post/gone'
const MISSING_PACK: AtUriString =
  'at://did:plc:nobody/app.bsky.graph.starterpack/gone'
const GHOST: DidString = 'did:plc:ghost'

const ALL_TYPES: NotificationViewType[] = [
  'like',
  'multiPostLike',
  'repost',
  'likeViaRepost',
  'repostViaRepost',
  'follow',
  'subscribedPost',
  'generatorLike',
  'reply',
  'quote',
  'mention',
  'followBack',
  'verified',
  'unverified',
  'starterPackJoined',
  'contactMatch',
]

function setup() {
  const res = createGroupedNotificationsFixture(NOW)
  const page = hydratePage(res, {viewerDid: VIEWER_DID})
  return {res, page}
}

/**
 * A shared fixture for tests that hydrate their own groups. Hydration never
 * mutates its input, so sharing one keeps identity assertions simple.
 */
const BASE = createGroupedNotificationsFixture(NOW)

/**
 * Hydrates the given kinds against the fixture's `relatedViews`.
 */
function hydrateKinds(...kinds: Kind[]): GroupedNotificationsPage {
  return hydratePage(
    {
      ...BASE,
      groups: kinds.map((kind, i) => ({
        id: `group-${i}`,
        isRead: false,
        indexedAt: '2026-10-08T11:00:00.000Z',
        count: 1,
        kind,
      })),
    },
    {viewerDid: VIEWER_DID},
  )
}

function hydrateKind(kind: Kind): NotificationView | undefined {
  return hydrateKinds(kind).notifications[0]
}

/**
 * The original view object for a DID or uri, for identity assertions.
 */
function related(res: OutputBody, key: string): unknown {
  const view = res.relatedViews?.find(v => {
    const candidate = v as {$type: string; did?: string; uri?: string}
    return candidate.$type === 'app.bsky.actor.defs#profileViewDetailed'
      ? candidate.did === key
      : candidate.uri === key
  })
  if (!view) throw new Error(`No related view for ${key}`)
  return view
}

function get<T extends NotificationViewType>(
  page: GroupedNotificationsPage,
  id: string,
  type: T,
): Extract<NotificationView, {type: T}> {
  const notification = page.notifications.find(n => n.id === id)
  if (notification?.type !== type) {
    throw new Error(`Expected ${id} to be a ${type}, got ${notification?.type}`)
  }
  return notification as Extract<NotificationView, {type: T}>
}

function narrow<T extends NotificationViewType>(
  notification: NotificationView | undefined,
  type: T,
): Extract<NotificationView, {type: T}> {
  if (notification?.type !== type) {
    throw new Error(`Expected a ${type}, got ${notification?.type}`)
  }
  return notification as Extract<NotificationView, {type: T}>
}

describe('hydratePage', () => {
  describe('with the fixture', () => {
    it('passes through cursor and seenAt', () => {
      const {res, page} = setup()
      expect(page.cursor).toBe(res.cursor)
      expect(page.seenAt).toBe(res.seenAt)
    })

    it('records when the newest group was indexed', () => {
      const {res, page} = setup()
      const newest = Math.max(
        ...res.groups.map(group => Date.parse(group.indexedAt)),
      )
      expect(page.newestAt).toBe(newest)
    })

    it('keeps every renderable group, in order, and drops the rest', () => {
      const {res, page} = setup()
      const dropped = [
        'unknown-kind',
        'like-blocked-post',
        'like-unresolvable-actors',
      ]
      expect(page.notifications.map(n => n.id)).toEqual(
        res.groups.map(g => g.id).filter(id => !dropped.includes(id)),
      )
    })

    it('covers every notification type', () => {
      const {page} = setup()
      expect(new Set(page.notifications.map(n => n.type))).toEqual(
        new Set(ALL_TYPES),
      )
    })

    it('keeps id, isRead, indexedAt and count as given', () => {
      const {res, page} = setup()
      for (const notification of page.notifications) {
        const group = res.groups.find(g => g.id === notification.id)!
        expect({
          id: notification.id,
          isRead: notification.isRead,
          indexedAt: notification.indexedAt,
          count: notification.count,
        }).toEqual({
          id: group.id,
          isRead: group.isRead,
          indexedAt: group.indexedAt,
          count: group.count,
        })
      }
    })

    it('maps a large like group', () => {
      const {res, page} = setup()
      const like = get(page, 'like-fungus', 'like')
      expect(like.count).toBe(25)
      expect(like.post).toBe(related(res, FUNGUS_POST))
      expect(like.actors).toHaveLength(10)
      expect(like.actors[0]).toBe(related(res, DANIELLE))
      for (const actor of like.actors) {
        expect(actor).toBe(related(res, actor.did))
      }
    })

    it('maps a single like', () => {
      const {res, page} = setup()
      const like = get(page, 'like-plants', 'like')
      expect(like.count).toBe(1)
      expect(like.post).toBe(related(res, PLANTS_POST))
      expect(like.actors).toEqual([related(res, MICHAEL)])
    })

    it('maps reposts and via-repost groups', () => {
      const {res, page} = setup()
      const repost = get(page, 'repost-fungus', 'repost')
      expect(repost.post).toBe(related(res, FUNGUS_POST))
      expect(repost.actors).toHaveLength(4)

      const viaRepost = `at://${VIEWER_DID}/app.bsky.feed.repost/bronco`
      const bronco = related(
        res,
        'at://did:plc:darrin/app.bsky.feed.post/bronco',
      )
      const likeVia = get(page, 'like-via-repost-bronco', 'likeViaRepost')
      expect(likeVia.post).toBe(bronco)
      expect(likeVia.viaRepost).toBe(viaRepost)
      expect(likeVia.actors).toHaveLength(3)
      const repostVia = get(page, 'repost-via-repost-bronco', 'repostViaRepost')
      expect(repostVia.post).toBe(bronco)
      expect(repostVia.viaRepost).toBe(viaRepost)
      expect(repostVia.actors).toHaveLength(2)
    })

    it('maps a multi-post like', () => {
      const {res, page} = setup()
      const multi = get(page, 'multi-post-like-rafael', 'multiPostLike')
      expect(multi.actor).toBe(related(res, 'did:plc:rafael'))
      expect(multi.posts).toHaveLength(3)
      for (const post of multi.posts) {
        expect(post).toBe(related(res, post.uri))
      }
    })

    it('maps follows, with and without a starter pack', () => {
      const {res, page} = setup()
      const many = get(page, 'follow-many', 'follow')
      expect(many.actors).toHaveLength(5)
      expect(many.starterPack).toBeUndefined()

      const viaPack = get(page, 'follow-starter-pack', 'follow')
      expect(viaPack.actors).toEqual([related(res, 'did:plc:sofia')])
      expect(viaPack.starterPack).toBe(related(res, SCICOMM_PACK))

      const single = get(page, 'follow-single', 'follow')
      expect(single.actors).toHaveLength(1)
      expect(single.starterPack).toBeUndefined()
    })

    it('maps follow backs, with and without a starter pack', () => {
      const {res, page} = setup()
      const plain = get(page, 'follow-back', 'followBack')
      expect(plain.actor).toBe(related(res, 'did:plc:priya'))
      expect(plain.starterPack).toBeUndefined()

      const viaPack = get(page, 'follow-back-starter-pack', 'followBack')
      expect(viaPack.actor).toBe(related(res, 'did:plc:noah'))
      expect(viaPack.starterPack).toBe(related(res, SCICOMM_PACK))
    })

    it('maps subscribed posts in all three shapes', () => {
      const {res, page} = setup()
      const single = get(page, 'subscribed-samuel', 'subscribedPost')
      expect(single.items).toHaveLength(1)
      expect(single.items[0].actor).toBe(related(res, 'did:plc:samuel'))
      expect(single.items[0].post).toBe(
        related(res, 'at://did:plc:samuel/app.bsky.feed.post/blog'),
      )

      const oneActor = get(page, 'subscribed-danielle', 'subscribedPost')
      expect(oneActor.items).toHaveLength(3)
      expect(new Set(oneActor.items.map(item => item.actor))).toEqual(
        new Set([related(res, DANIELLE)]),
      )

      const manyActors = get(page, 'subscribed-many', 'subscribedPost')
      expect(manyActors.items).toHaveLength(3)
      for (const item of manyActors.items) {
        expect(item.actor).toBe(related(res, item.post.author.did))
        expect(item.post).toBe(related(res, item.post.uri))
      }
    })

    it('maps a feed generator like', () => {
      const {res, page} = setup()
      const like = get(page, 'generator-like-fungi', 'generatorLike')
      expect(like.generator).toBe(related(res, FUNGI_FEED))
      expect(like.actors).toHaveLength(3)
    })

    it('maps replies with each parent state', () => {
      const {res, page} = setup()
      const toYou = get(page, 'reply-fungus', 'reply')
      expect(toYou.post).toBe(related(res, DANIELLE_REPLY))
      expect(toYou.parent).toEqual({type: 'post', post: expect.anything()})
      expect(toYou.parent.type === 'post' ? toYou.parent.post : undefined).toBe(
        related(res, FUNGUS_POST),
      )

      const inThread = get(page, 'reply-oyster', 'reply')
      expect(
        inThread.parent.type === 'post' ? inThread.parent.post : undefined,
      ).toBe(related(res, PRIYA_POST))

      expect(get(page, 'reply-blocked-parent', 'reply').parent).toEqual({
        type: 'blocked',
      })
      expect(get(page, 'reply-not-found-parent', 'reply').parent).toEqual({
        type: 'notFound',
      })
    })

    it('maps quotes and mentions', () => {
      const {res, page} = setup()
      const quote = get(page, 'quote-fungus', 'quote')
      expect(quote.post).toBe(
        related(res, 'at://did:plc:marcus/app.bsky.feed.post/quote-fungus'),
      )
      expect(quote).not.toHaveProperty('parent')

      const mention = get(page, 'mention-demo', 'mention')
      expect(mention.post).toBe(
        related(res, 'at://did:plc:samuel/app.bsky.feed.post/mention-demo'),
      )
      expect(mention).not.toHaveProperty('parent')

      const inReply = get(page, 'mention-oyster', 'mention')
      expect(
        inReply.parent?.type === 'post' ? inReply.parent.post : undefined,
      ).toBe(related(res, PRIYA_POST))
    })

    it('maps single-actor kinds', () => {
      const {res, page} = setup()
      const bluesky = related(res, 'did:plc:bluesky')
      expect(get(page, 'verified', 'verified').actor).toBe(bluesky)
      expect(get(page, 'unverified', 'unverified').actor).toBe(bluesky)

      const joined = get(page, 'starter-pack-joined', 'starterPackJoined')
      expect(joined.actor).toBe(related(res, 'did:plc:lena'))
      expect(joined.starterPack).toBe(related(res, MYCOLOGY_PACK))

      expect(get(page, 'contact-match', 'contactMatch').actor).toBe(
        related(res, 'did:plc:jonas'),
      )
    })

    it('shares one view object across notifications', () => {
      const {res, page} = setup()
      const fungus = related(res, FUNGUS_POST)
      expect(get(page, 'like-fungus', 'like').post).toBe(fungus)
      expect(get(page, 'repost-fungus', 'repost').post).toBe(fungus)
      const reply = get(page, 'reply-fungus', 'reply')
      expect(reply.parent.type === 'post' && reply.parent.post).toBe(fungus)
    })

    it('encodes the mention facet at the right byte offsets', () => {
      const {res} = setup()
      const post = related(
        res,
        'at://did:plc:samuel/app.bsky.feed.post/mention-demo',
      ) as {
        record: {
          text: string
          facets: {index: {byteStart: number; byteEnd: number}}[]
        }
      }
      const {byteStart, byteEnd} = post.record.facets[0].index
      const bytes = new TextEncoder().encode(post.record.text)
      expect(new TextDecoder().decode(bytes.slice(byteStart, byteEnd))).toBe(
        '@tim.bsky.team',
      )
    })
  })

  describe('newestAt', () => {
    it('counts groups that were dropped while hydrating', () => {
      const page = hydratePage(
        {
          ...BASE,
          groups: [
            {
              id: 'dropped',
              isRead: false,
              indexedAt: '2026-10-08T11:30:00.000Z',
              count: 1,
              kind: {
                $type: `${NS}#likeGroup`,
                post: MISSING_POST,
                items: [{actor: DANIELLE}],
              },
            },
            {
              id: 'kept',
              isRead: false,
              indexedAt: '2026-10-08T11:00:00.000Z',
              count: 1,
              kind: {
                $type: `${NS}#likeGroup`,
                post: FUNGUS_POST,
                items: [{actor: DANIELLE}],
              },
            },
          ],
        },
        {viewerDid: VIEWER_DID},
      )
      expect(page.notifications.map(n => n.id)).toEqual(['kept'])
      expect(page.newestAt).toBe(Date.parse('2026-10-08T11:30:00.000Z'))
    })

    it('is undefined for an empty response', () => {
      const page = hydratePage({...BASE, groups: []}, {viewerDid: VIEWER_DID})
      expect(page.newestAt).toBeUndefined()
    })
  })

  describe('subject posts', () => {
    const kinds: [string, (post: AtUriString) => Kind][] = [
      [
        'like',
        post => ({
          $type: `${NS}#likeGroup`,
          post,
          items: [{actor: DANIELLE}],
        }),
      ],
      [
        'repost',
        post => ({
          $type: `${NS}#repostGroup`,
          post,
          items: [{actor: DANIELLE}],
        }),
      ],
      [
        'likeViaRepost',
        post => ({
          $type: `${NS}#likeViaRepostGroup`,
          post,
          viaRepost: `at://${VIEWER_DID}/app.bsky.feed.repost/x`,
          items: [{actor: DANIELLE}],
        }),
      ],
      [
        'repostViaRepost',
        post => ({
          $type: `${NS}#repostViaRepostGroup`,
          post,
          viaRepost: `at://${VIEWER_DID}/app.bsky.feed.repost/x`,
          items: [{actor: DANIELLE}],
        }),
      ],
      [
        'reply',
        post => ({
          $type: `${NS}#replyNotification`,
          post,
          parent: FUNGUS_POST,
        }),
      ],
      ['quote', post => ({$type: `${NS}#quoteNotification`, post})],
      ['mention', post => ({$type: `${NS}#mentionNotification`, post})],
    ]

    it.each(kinds)('keeps a %s with a viewable post', (type, kind) => {
      expect(hydrateKind(kind(FUNGUS_POST))?.type).toBe(type)
    })

    it.each(kinds)('drops a %s whose post is missing', (_type, kind) => {
      expect(hydrateKind(kind(MISSING_POST))).toBeUndefined()
    })

    it.each(kinds)('drops a %s whose post is blocked', (_type, kind) => {
      expect(hydrateKind(kind(BLOCKED_POST))).toBeUndefined()
    })

    it.each(kinds)('drops a %s whose post is not found', (_type, kind) => {
      expect(hydrateKind(kind(NOT_FOUND_POST))).toBeUndefined()
    })
  })

  describe('other subjects', () => {
    it('drops a generator like whose generator is missing', () => {
      const kind = (generator: AtUriString): Kind => ({
        $type: `${NS}#generatorLikeGroup`,
        generator,
        items: [{actor: DANIELLE}],
      })
      expect(hydrateKind(kind(FUNGI_FEED))?.type).toBe('generatorLike')
      expect(hydrateKind(kind(MISSING_POST))).toBeUndefined()
    })

    it('drops a starter pack join whose pack is missing', () => {
      const kind = (starterPack: AtUriString): Kind => ({
        $type: `${NS}#starterPackJoinedNotification`,
        actor: DANIELLE,
        starterPack,
      })
      expect(hydrateKind(kind(MYCOLOGY_PACK))?.type).toBe('starterPackJoined')
      expect(hydrateKind(kind(MISSING_PACK))).toBeUndefined()
    })
  })

  describe('actors', () => {
    it('drops unresolved actors, dedupes, and removes the viewer', () => {
      const res = BASE
      const like = narrow(
        hydrateKind({
          $type: `${NS}#likeGroup`,
          post: FUNGUS_POST,
          items: [
            {actor: GHOST},
            {actor: VIEWER_DID},
            {actor: DANIELLE},
            {actor: MICHAEL},
            {actor: DANIELLE},
          ],
        }),
        'like',
      )
      expect(like.actors).toEqual([
        related(res, DANIELLE),
        related(res, MICHAEL),
      ])
      expect(like.actors[0]).toBe(related(res, DANIELLE))
    })

    it('removes the viewer even when their profile is in relatedViews', () => {
      const res = createGroupedNotificationsFixture(NOW)
      const viewer = {
        $type: 'app.bsky.actor.defs#profileViewDetailed' as const,
        did: VIEWER_DID,
        handle: 'tim.bsky.team' as const,
      }
      const page = hydratePage(
        {
          ...res,
          relatedViews: [...(res.relatedViews ?? []), viewer],
          groups: [
            {
              id: 'self-like',
              isRead: false,
              indexedAt: '2026-10-08T11:00:00.000Z',
              count: 2,
              kind: {
                $type: `${NS}#likeGroup`,
                post: FUNGUS_POST,
                items: [{actor: VIEWER_DID}, {actor: DANIELLE}],
              },
            },
          ],
        },
        {viewerDid: VIEWER_DID},
      )
      expect(narrow(page.notifications[0], 'like').actors).toEqual([
        related(res, DANIELLE),
      ])
    })

    it('drops an aggregate group when no actor resolves', () => {
      expect(
        hydrateKinds(
          {
            $type: `${NS}#likeGroup`,
            post: FUNGUS_POST,
            items: [{actor: GHOST}, {actor: VIEWER_DID}],
          },
          {
            $type: `${NS}#followGroup`,
            items: [{actor: GHOST}],
          },
          {
            $type: `${NS}#generatorLikeGroup`,
            generator: FUNGI_FEED,
            items: [{actor: GHOST}],
          },
        ).notifications,
      ).toEqual([])
    })

    const singleActorKinds: [string, (actor: DidString) => Kind][] = [
      ['verified', actor => ({$type: `${NS}#verifiedNotification`, actor})],
      ['unverified', actor => ({$type: `${NS}#unverifiedNotification`, actor})],
      ['followBack', actor => ({$type: `${NS}#followBackNotification`, actor})],
      [
        'starterPackJoined',
        actor => ({
          $type: `${NS}#starterPackJoinedNotification`,
          actor,
          starterPack: MYCOLOGY_PACK,
        }),
      ],
      [
        'contactMatch',
        actor => ({$type: `${NS}#contactMatchNotification`, actor}),
      ],
      [
        'multiPostLike',
        actor => ({
          $type: `${NS}#multiPostLikeGroup`,
          actor,
          items: [{post: FUNGUS_POST}, {post: PLANTS_POST}],
        }),
      ],
    ]

    it.each(singleActorKinds)(
      'keeps a %s with a resolved actor',
      (type, kind) => {
        const res = BASE
        const notification = hydrateKind(kind(DANIELLE))
        expect(notification?.type).toBe(type)
        expect((notification as {actor: unknown}).actor).toBe(
          related(res, DANIELLE),
        )
      },
    )

    it.each(singleActorKinds)(
      'drops a %s whose actor is missing',
      (_type, kind) => {
        expect(hydrateKind(kind(GHOST))).toBeUndefined()
      },
    )
  })

  describe('multiPostLike', () => {
    it('drops unresolved, blocked and not-found posts', () => {
      const res = BASE
      const multi = narrow(
        hydrateKind({
          $type: `${NS}#multiPostLikeGroup`,
          actor: DANIELLE,
          items: [
            {post: FUNGUS_POST},
            {post: BLOCKED_POST},
            {post: MISSING_POST},
            {post: NOT_FOUND_POST},
            {post: PLANTS_POST},
          ],
        }),
        'multiPostLike',
      )
      expect(multi.posts).toHaveLength(2)
      expect(multi.posts[0]).toBe(related(res, FUNGUS_POST))
      expect(multi.posts[1]).toBe(related(res, PLANTS_POST))
    })

    it('drops the group when no post remains', () => {
      expect(
        hydrateKind({
          $type: `${NS}#multiPostLikeGroup`,
          actor: DANIELLE,
          items: [{post: BLOCKED_POST}, {post: MISSING_POST}],
        }),
      ).toBeUndefined()
    })
  })

  describe('subscribedPost', () => {
    it('keeps only items whose actor and post both resolve', () => {
      const res = BASE
      const subscribed = narrow(
        hydrateKind({
          $type: `${NS}#subscribedPostGroup`,
          items: [
            {actor: DANIELLE, post: FUNGUS_POST},
            {actor: GHOST, post: PLANTS_POST},
            {actor: MICHAEL, post: BLOCKED_POST},
            {actor: MICHAEL, post: MISSING_POST},
          ],
        }),
        'subscribedPost',
      )
      expect(subscribed.items).toHaveLength(1)
      expect(subscribed.items[0].actor).toBe(related(res, DANIELLE))
      expect(subscribed.items[0].post).toBe(related(res, FUNGUS_POST))
    })

    it('drops the group when no item remains', () => {
      expect(
        hydrateKind({
          $type: `${NS}#subscribedPostGroup`,
          items: [
            {actor: GHOST, post: FUNGUS_POST},
            {actor: DANIELLE, post: NOT_FOUND_POST},
          ],
        }),
      ).toBeUndefined()
    })
  })

  describe('parents', () => {
    const parentKinds: [string, (parent: AtUriString) => Kind][] = [
      [
        'reply',
        parent => ({
          $type: `${NS}#replyNotification`,
          post: DANIELLE_REPLY,
          parent,
        }),
      ],
      [
        'quote',
        parent => ({
          $type: `${NS}#quoteNotification`,
          post: DANIELLE_REPLY,
          parent,
        }),
      ],
      [
        'mention',
        parent => ({
          $type: `${NS}#mentionNotification`,
          post: DANIELLE_REPLY,
          parent,
        }),
      ],
    ]

    function parentOf(notification: NotificationView | undefined) {
      if (
        notification?.type !== 'reply' &&
        notification?.type !== 'quote' &&
        notification?.type !== 'mention'
      ) {
        throw new Error(`Unexpected ${notification?.type}`)
      }
      return notification.parent
    }

    it.each(parentKinds)('maps a viewable %s parent', (_type, kind) => {
      const res = BASE
      const parent = parentOf(hydrateKind(kind(PRIYA_POST)))
      expect(parent?.type).toBe('post')
      expect(parent?.type === 'post' && parent.post).toBe(
        related(res, PRIYA_POST),
      )
    })

    it.each(parentKinds)('maps a blocked %s parent', (_type, kind) => {
      expect(parentOf(hydrateKind(kind(BLOCKED_POST)))).toEqual({
        type: 'blocked',
      })
    })

    it.each(parentKinds)('maps a not-found %s parent', (_type, kind) => {
      expect(parentOf(hydrateKind(kind(NOT_FOUND_POST)))).toEqual({
        type: 'notFound',
      })
    })

    it.each(parentKinds)(
      'treats a %s parent with no view as not found',
      (_type, kind) => {
        expect(parentOf(hydrateKind(kind(MISSING_POST)))).toEqual({
          type: 'notFound',
        })
      },
    )
  })

  describe('follow starter packs', () => {
    function followPack(items: {starterPack?: AtUriString}[]) {
      return narrow(
        hydrateKind({
          $type: `${NS}#followGroup`,
          items: items.map(item => ({...item, actor: DANIELLE})),
        }),
        'follow',
      ).starterPack
    }

    it('is set when every follow came via the same resolvable pack', () => {
      const res = BASE
      expect(
        followPack([{starterPack: SCICOMM_PACK}, {starterPack: SCICOMM_PACK}]),
      ).toBe(related(res, SCICOMM_PACK))
    })

    it('is unset when some follows came via a different pack', () => {
      expect(
        followPack([{starterPack: SCICOMM_PACK}, {starterPack: MYCOLOGY_PACK}]),
      ).toBeUndefined()
    })

    it('is unset when some follows came via no pack', () => {
      expect(followPack([{starterPack: SCICOMM_PACK}, {}])).toBeUndefined()
      expect(followPack([{}, {starterPack: SCICOMM_PACK}])).toBeUndefined()
    })

    it('is unset when the shared pack does not resolve', () => {
      expect(
        followPack([{starterPack: MISSING_PACK}, {starterPack: MISSING_PACK}]),
      ).toBeUndefined()
    })

    it('leaves a follow back without its pack when it does not resolve', () => {
      const followBack = narrow(
        hydrateKind({
          $type: `${NS}#followBackNotification`,
          actor: DANIELLE,
          starterPack: MISSING_PACK,
        }),
        'followBack',
      )
      expect(followBack.starterPack).toBeUndefined()
    })
  })

  describe('unknown kinds', () => {
    it('skips them without affecting other groups', () => {
      const page = hydrateKinds(
        {$type: `${NS}#someFutureGroup` as Unknown$Type},
        {$type: 'com.example.notification#whatever' as Unknown$Type},
        {$type: `${NS}#verifiedNotification`, actor: DANIELLE},
      )
      expect(page.notifications.map(n => n.type)).toEqual(['verified'])
    })

    it('handles a response without relatedViews', () => {
      const res = createGroupedNotificationsFixture(NOW)
      const page = hydratePage(
        {groups: res.groups, cursor: res.cursor},
        {viewerDid: VIEWER_DID},
      )
      expect(page.notifications).toEqual([])
      expect(page.cursor).toBe(res.cursor)
    })
  })
})
