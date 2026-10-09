import {type DidString} from '@atproto/syntax'
import {type ModerationOpts} from '@bsky/sdk/moderation'
import {describe, expect, it} from '@jest/globals'

import {
  createGroupedNotificationsFixture,
  UNRESOLVED_FOLLOWER_DIDS,
  VIEWER_DID,
} from '#/state/queries/notifications/grouped/__fixtures__'
import {
  createFollowActorsPage,
  FOLLOW_ACTORS_PAGE_SIZE,
  type FollowActorsPage,
  getNextActorDids,
  getUnresolvedActorDids,
  selectLoadedActors,
} from '#/state/queries/notifications/grouped/follow-actors'
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

function page(requested: DidString[], returned = requested): FollowActorsPage {
  return createFollowActorsPage(
    requested,
    returned.map(did => profile(did)),
  )
}

function hideableOffense(actor: ProfileView): ProfileView {
  const label: com.atproto.label.defs.Label = {
    src: LABELER,
    uri: actor.did,
    val: '!hide',
    cts: NOW.toISOString() as com.atproto.label.defs.Label['cts'],
  }
  return {...actor, labels: [label]}
}

describe('getUnresolvedActorDids', () => {
  it('is the group’s DIDs without a resolved profile', () => {
    expect(getUnresolvedActorDids(followMany())).toEqual(
      UNRESOLVED_FOLLOWER_DIDS,
    )
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
      unresolved.slice(0, FOLLOW_ACTORS_PAGE_SIZE),
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

describe('createFollowActorsPage', () => {
  it('orders profiles as requested and drops missing ones', () => {
    const [a, b, c] = dids(3)
    expect(createFollowActorsPage([a, b, c], [profile(c), profile(a)])).toEqual(
      {dids: [a, b, c], profiles: [profile(a), profile(c)]},
    )
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
      createFollowActorsPage([a, b, c], [profile(a), blocked, muted]),
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
        [createFollowActorsPage([a], [followed])],
        [a],
        MODERATION_OPTS,
      ),
    ).toEqual([followed])
  })

  it('hides hideable offenses without moderation opts', () => {
    const [a, b] = dids(2)
    const pages = [
      createFollowActorsPage([a, b], [profile(a), hideableOffense(profile(b))]),
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
