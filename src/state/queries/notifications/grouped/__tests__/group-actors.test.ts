import {type DidString} from '@atproto/syntax'
import {type ModerationOpts} from '@bsky/sdk/moderation'
import {describe, expect, it} from '@jest/globals'

import {
  createGroupedNotificationsFixture,
  UNRESOLVED_FOLLOWER_DIDS,
  UNRESOLVED_LIKER_DIDS,
  VIEWER_DID,
} from '#/state/queries/notifications/grouped/__fixtures__'
import {
  createGroupActorsPage,
  getNextActorDids,
  getNotificationGroup,
  getUnresolvedActorDids,
  GROUP_ACTORS_PAGE_SIZE,
  type GroupActorsPage,
  type GroupNotificationView,
  selectLoadedActors,
} from '#/state/queries/notifications/grouped/group-actors'
import {hydratePage} from '#/state/queries/notifications/grouped/hydrate'
import {moderateNotification} from '#/state/queries/notifications/grouped/moderate'
import {type NotificationView} from '#/state/queries/notifications/grouped/types'
import {type app, type com} from '#/lexicons'

type ProfileView = app.bsky.actor.defs.ProfileViewDetailed
type FollowNotificationView = Extract<NotificationView, {type: 'follow'}>

const NOW = new Date('2026-10-08T12:00:00.000Z')
const LABELER: DidString = 'did:plc:labeler'

const PAGE = hydratePage(createGroupedNotificationsFixture(NOW), {
  viewerDid: VIEWER_DID,
})

const MODERATION_OPTS: ModerationOpts = {
  userDid: VIEWER_DID,
  prefs: {
    adultContentEnabled: false,
    labels: {},
    labelers: [{did: LABELER, labels: {}}],
    mutedWords: [],
    hiddenPosts: [],
  },
  labelDefs: {},
}

function followMany(): FollowNotificationView {
  const notification = PAGE.notifications.find(n => n.id === 'follow-many')
  if (notification?.type !== 'follow') throw new Error('No follow-many group')
  return notification
}

/**
 * `count` DIDs, `did:plc:follower0` onwards.
 */
function dids(count: number, from = 0): DidString[] {
  return Array.from(
    {length: count},
    (_, i): DidString => `did:plc:follower${from + i}`,
  )
}

function profile(
  did: DidString,
  overrides: Partial<ProfileView> = {},
): ProfileView {
  return {did, handle: `${did.slice(8)}.bsky.social`, ...overrides}
}

function page(requested: DidString[], returned = requested): GroupActorsPage {
  return createGroupActorsPage(
    requested,
    returned.map(did => profile(did)),
  )
}

/**
 * Works on notification actors and on actors loaded with "Show more", which
 * are basic and detailed views respectively.
 */
function hideableOffense<
  T extends Pick<app.bsky.actor.defs.ProfileViewBasic, 'did' | 'labels'>,
>(actor: T): T {
  const label: com.atproto.label.defs.Label = {
    src: LABELER,
    uri: actor.did,
    val: '!hide',
    cts: NOW.toISOString() as com.atproto.label.defs.Label['cts'],
  }
  return {...actor, labels: [label]}
}

function group(id: string): GroupNotificationView {
  const notification = PAGE.notifications.find(n => n.id === id)
  switch (notification?.type) {
    case 'like':
    case 'repost':
    case 'likeViaRepost':
    case 'repostViaRepost':
    case 'generatorLike':
    case 'follow':
    case 'subscribedPost':
      return notification
    default:
      throw new Error(`Expected ${id} to be a group notification`)
  }
}

describe('getNotificationGroup', () => {
  it('counts everyone in the group, resolved or not', () => {
    const like = getNotificationGroup(group('like-photos'))
    expect(like.actors.map(actor => actor.did)).toEqual([
      'did:plc:theo',
      'did:plc:ines',
      'did:plc:omar',
    ])
    expect(like.actorDids).toHaveLength(20)
    expect(like.count).toBe(20)
  })

  it('counts a pair whose second profile did not resolve', () => {
    const repost = getNotificationGroup(group('repost-photos'))
    expect(repost.actors).toHaveLength(1)
    expect(repost.count).toBe(2)
  })

  it('counts subscribed post authors, once each, rather than posts', () => {
    const oneAuthor = getNotificationGroup(group('subscribed-danielle'))
    expect(oneAuthor.actors.map(actor => actor.did)).toEqual([
      'did:plc:danielleyuhan',
    ])
    expect(oneAuthor.count).toBe(1)

    const threeAuthors = getNotificationGroup(group('subscribed-many'))
    expect(threeAuthors.actors.map(actor => actor.did)).toEqual([
      'did:plc:michaelblack',
      'did:plc:rafael',
      'did:plc:darrin',
    ])
    expect(threeAuthors.actorDids).toEqual(
      threeAuthors.actors.map(actor => actor.did),
    )
    expect(threeAuthors.count).toBe(3)
  })
})

describe('getUnresolvedActorDids', () => {
  it('is the group’s DIDs without a resolved profile', () => {
    expect(getUnresolvedActorDids(followMany())).toEqual(
      UNRESOLVED_FOLLOWER_DIDS,
    )
  })

  it('works the same for groups of other kinds', () => {
    const like = PAGE.notifications.find(n => n.id === 'like-fungus')
    if (like?.type !== 'like') throw new Error('No like-fungus group')
    expect(getUnresolvedActorDids(like)).toEqual(UNRESOLVED_LIKER_DIDS)
  })

  it('is empty when every follower resolved', () => {
    const notification = PAGE.notifications.find(n => n.id === 'follow-single')
    if (notification?.type !== 'follow') throw new Error('No follow-single')
    expect(getUnresolvedActorDids(notification)).toEqual([])
  })

  it('leaves out followers that moderation hid', () => {
    const follow = followMany()
    const [first, ...rest] = follow.actors
    const moderated = moderateNotification(
      {...follow, actors: [hideableOffense(first), ...rest]},
      {moderationOpts: undefined, hiddenReplyUris: new Set()},
    )
    if (moderated?.type !== 'follow') throw new Error('Expected a follow')
    expect(getUnresolvedActorDids(moderated)).toEqual(UNRESOLVED_FOLLOWER_DIDS)
    expect(moderated.actorDids).not.toContain(first.did)
  })
})

describe('getNextActorDids', () => {
  it('starts with the first page of unresolved DIDs', () => {
    const unresolved = dids(60)
    expect(getNextActorDids(unresolved, [])).toEqual(
      unresolved.slice(0, GROUP_ACTORS_PAGE_SIZE),
    )
  })

  it('continues after every DID already requested', () => {
    const unresolved = dids(60)
    const first = page(unresolved.slice(0, 25))
    const second = page(unresolved.slice(25, 50))
    expect(getNextActorDids(unresolved, [first])).toEqual(
      unresolved.slice(25, 50),
    )
    expect(getNextActorDids(unresolved, [first, second])).toEqual(
      unresolved.slice(50),
    )
  })

  it('counts DIDs that came back missing as requested', () => {
    const unresolved = dids(30)
    const requested = unresolved.slice(0, 25)
    // Only every other profile came back, e.g. the rest were deleted
    const returned = requested.filter((_, i) => i % 2 === 0)
    expect(getNextActorDids(unresolved, [page(requested, returned)])).toEqual(
      unresolved.slice(25),
    )
  })

  it('is empty once every DID has been requested', () => {
    const unresolved = dids(3)
    expect(getNextActorDids(unresolved, [page(unresolved, [])])).toEqual([])
    expect(getNextActorDids([], [])).toEqual([])
  })
})

describe('createGroupActorsPage', () => {
  it('orders profiles as requested and drops missing ones', () => {
    const [a, b, c] = dids(3)
    expect(createGroupActorsPage([a, b, c], [profile(c), profile(a)])).toEqual({
      dids: [a, b, c],
      profiles: [profile(a), profile(c)],
    })
  })
})

describe('selectLoadedActors', () => {
  it('flattens pages, in order', () => {
    const unresolved = dids(4)
    const pages = [page(unresolved.slice(0, 2)), page(unresolved.slice(2))]
    expect(
      selectLoadedActors(pages, unresolved, MODERATION_OPTS).map(p => p.did),
    ).toEqual(unresolved)
  })

  it('hides the same actors as list-time moderation', () => {
    const [a, b, c] = dids(3)
    const blocked = profile(b, {
      viewer: {blocking: `at://${VIEWER_DID}/app.bsky.graph.block/b`},
    })
    const muted = profile(c, {viewer: {muted: true}})
    const pages = [
      createGroupActorsPage([a, b, c], [profile(a), blocked, muted]),
    ]
    expect(
      selectLoadedActors(pages, [a, b, c], MODERATION_OPTS).map(p => p.did),
    ).toEqual([a])
  })

  it('keeps muted actors the viewer follows', () => {
    const [a] = dids(1)
    const followed = profile(a, {
      viewer: {
        muted: true,
        following: `at://${VIEWER_DID}/app.bsky.graph.follow/a`,
      },
    })
    expect(
      selectLoadedActors(
        [createGroupActorsPage([a], [followed])],
        [a],
        MODERATION_OPTS,
      ),
    ).toEqual([followed])
  })

  it('hides hideable offenses without moderation opts', () => {
    const [a, b] = dids(2)
    const pages = [
      createGroupActorsPage([a, b], [profile(a), hideableOffense(profile(b))]),
    ]
    expect(
      selectLoadedActors(pages, [a, b], undefined).map(p => p.did),
    ).toEqual([a])
  })

  it('drops profiles that are no longer unresolved, and duplicates', () => {
    const [a, b, c] = dids(3)
    const pages = [page([a, b]), page([b, c])]
    expect(
      selectLoadedActors(pages, [b, c], MODERATION_OPTS).map(p => p.did),
    ).toEqual([b, c])
  })
})
