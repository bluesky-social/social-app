import {type DidString} from '@atproto/syntax'
import {describe, expect, it, jest} from '@jest/globals'

import {type FeedNotification, type FeedPage, type Notification} from '../types'
import {
  groupNotifications,
  markUnreadCheckSeen,
  newestNotificationAt,
  summarizeUnreadCheck,
} from '../util'

jest.mock('#/state/queries/profile', () => ({precacheProfile: jest.fn()}))

/*
 * Fixture builder. The generated view brands `did`/`uri`/`cid`/`indexedAt`, and
 * these are plain test strings, so the whole literal is asserted once - the
 * grouping logic under test only compares them as strings.
 */
function makeFollowNotification(
  did: DidString,
  starterPackUri?: string,
): Notification {
  return {
    uri: `at://${did}/app.bsky.graph.follow/follow`,
    cid: `cid-${did}`,
    author: {
      did,
      handle: `${did}.test`,
      displayName: did,
      avatar: undefined,
      associated: undefined,
      viewer: {},
      labels: [],
      createdAt: '2026-07-28T12:00:00.000Z',
    },
    reason: 'follow',
    record: {},
    starterPack: starterPackUri
      ? ({uri: starterPackUri} as Notification['starterPack'])
      : undefined,
    isRead: false,
    indexedAt: '2026-07-28T12:00:00.000Z',
  }
}

describe('groupNotifications', () => {
  it('does not group a Starter Pack follow with an organic follow', () => {
    const pack = 'at://did:plc:alice/app.bsky.graph.starterpack/a'

    const grouped = groupNotifications([
      makeFollowNotification('did:plc:a'),
      makeFollowNotification('did:plc:b', pack),
    ])

    expect(grouped).toHaveLength(2)
    expect(grouped[0].notification.author.did).toBe('did:plc:a')
    expect(grouped[0].notification.starterPack).toBeUndefined()
    expect(grouped[0].additional).toBeUndefined()
    expect(grouped[1].notification.author.did).toBe('did:plc:b')
    expect(grouped[1].notification.starterPack?.uri).toBe(pack)
    expect(grouped[1].additional).toBeUndefined()
  })

  it('groups follows by Starter Pack', () => {
    const packA = 'at://did:plc:alice/app.bsky.graph.starterpack/a'
    const packB = 'at://did:plc:bob/app.bsky.graph.starterpack/b'

    const grouped = groupNotifications([
      makeFollowNotification('did:plc:a', packA),
      makeFollowNotification('did:plc:b', packB),
      makeFollowNotification('did:plc:c', packA),
      makeFollowNotification('did:plc:d'),
      makeFollowNotification('did:plc:e', packB),
      makeFollowNotification('did:plc:f'),
    ])

    expect(
      grouped.map(item => [
        item.notification.author.did,
        ...(item.additional ?? []).map(notification => notification.author.did),
      ]),
    ).toEqual([
      ['did:plc:a', 'did:plc:c'],
      ['did:plc:b', 'did:plc:e'],
      ['did:plc:d', 'did:plc:f'],
    ])
  })
})

function makeNotification({
  reason,
  indexedAt,
  isRead = false,
}: {
  reason: string
  indexedAt: string
  isRead?: boolean
}): Notification {
  return {
    ...makeFollowNotification('did:plc:a'),
    uri: `at://did:plc:a/${reason}/${indexedAt}`,
    reason,
    isRead,
    indexedAt,
  } as Notification
}

function makePage(
  items: Array<Notification | Notification[]>,
  requestedAt = 0,
): FeedPage {
  return {
    cursor: undefined,
    seenAt: new Date(0),
    requestedAt,
    items: items.map((entry): FeedNotification => {
      const [notification, ...additional] = Array.isArray(entry)
        ? entry
        : [entry]
      return {
        _reactKey: notification.uri,
        type: 'unknown',
        notification,
        additional: additional.length ? additional : undefined,
      }
    }),
  }
}

const at = (iso: string) => Date.parse(iso)

describe('newestNotificationAt', () => {
  it('finds the newest notification, grouped ones included', () => {
    const page = makePage([
      [
        makeNotification({reason: 'like', indexedAt: '2026-09-28T10:00:00Z'}),
        makeNotification({reason: 'like', indexedAt: '2026-09-28T12:00:00Z'}),
      ],
      makeNotification({reason: 'reply', indexedAt: '2026-09-28T11:00:00Z'}),
    ])
    expect(newestNotificationAt([page])).toBe(at('2026-09-28T12:00:00Z'))
  })

  it('can skip notifications the server reported as read', () => {
    const page = makePage([
      makeNotification({
        reason: 'like',
        indexedAt: '2026-09-28T12:00:00Z',
        isRead: true,
      }),
      makeNotification({reason: 'like', indexedAt: '2026-09-28T11:00:00Z'}),
    ])
    expect(newestNotificationAt([page], {unreadOnly: true})).toBe(
      at('2026-09-28T11:00:00Z'),
    )
  })

  it('can count only some reasons', () => {
    const page = makePage([
      makeNotification({reason: 'like', indexedAt: '2026-09-28T12:00:00Z'}),
      makeNotification({reason: 'mention', indexedAt: '2026-09-28T11:00:00Z'}),
    ])
    expect(newestNotificationAt([page], {reasons: ['mention']})).toBe(
      at('2026-09-28T11:00:00Z'),
    )
  })

  it('looks past empty pages, and stops at the first with a match', () => {
    const pages = [
      makePage([]),
      makePage([
        makeNotification({reason: 'like', indexedAt: '2026-09-27T12:00:00Z'}),
      ]),
      makePage([
        makeNotification({reason: 'like', indexedAt: '2026-09-28T12:00:00Z'}),
      ]),
    ]
    expect(newestNotificationAt(pages)).toBe(at('2026-09-27T12:00:00Z'))
  })

  it('is undefined when nothing matches', () => {
    expect(newestNotificationAt([])).toBeUndefined()
    expect(newestNotificationAt([makePage([])])).toBeUndefined()
    expect(
      newestNotificationAt(
        [
          makePage([
            makeNotification({
              reason: 'like',
              indexedAt: '2026-09-28T12:00:00Z',
              isRead: true,
            }),
          ]),
        ],
        {unreadOnly: true},
      ),
    ).toBeUndefined()
  })
})

describe('summarizeUnreadCheck', () => {
  it('keeps the newest unread notification for each list', () => {
    const page = makePage(
      [
        makeNotification({reason: 'like', indexedAt: '2026-09-28T12:00:00Z'}),
        makeNotification({reason: 'reply', indexedAt: '2026-09-28T11:00:00Z'}),
        makeNotification({
          reason: 'mention',
          indexedAt: '2026-09-28T10:00:00Z',
        }),
      ],
      1234,
    )
    expect(summarizeUnreadCheck(page, {loadsIntoFeed: false})).toEqual({
      requestedAt: 1234,
      newestUnreadAt: {
        all: at('2026-09-28T12:00:00Z'),
        mentions: at('2026-09-28T11:00:00Z'),
      },
      loadsIntoFeed: false,
    })
  })

  it('finds nothing for Mentions among likes and follows', () => {
    const page = makePage([
      makeNotification({reason: 'like', indexedAt: '2026-09-28T12:00:00Z'}),
      makeNotification({reason: 'follow', indexedAt: '2026-09-28T11:00:00Z'}),
    ])
    expect(
      summarizeUnreadCheck(page, {loadsIntoFeed: true}).newestUnreadAt.mentions,
    ).toBeUndefined()
  })
})

describe('markUnreadCheckSeen', () => {
  const check = {
    requestedAt: 1234,
    newestUnreadAt: {
      all: at('2026-09-28T12:00:00Z'),
      mentions: at('2026-09-28T11:00:00Z'),
    },
    loadsIntoFeed: false,
  }

  it('clears whatever was indexed before the new seenAt', () => {
    expect(
      markUnreadCheckSeen(check, at('2026-09-28T11:30:00Z'))?.newestUnreadAt,
    ).toEqual({all: at('2026-09-28T12:00:00Z'), mentions: undefined})
    expect(
      markUnreadCheckSeen(check, at('2026-09-28T13:00:00Z'))?.newestUnreadAt,
    ).toEqual({all: undefined, mentions: undefined})
  })

  it('leaves the rest of the check alone', () => {
    const seen = markUnreadCheckSeen(check, at('2026-09-28T13:00:00Z'))
    expect(seen?.requestedAt).toBe(1234)
    expect(seen?.loadsIntoFeed).toBe(false)
    expect(markUnreadCheckSeen(undefined, 0)).toBeUndefined()
  })
})
