import {type DidString} from '@atproto/syntax'
import {describe, expect, it, jest} from '@jest/globals'

import {type FeedPage, type Notification, type UnreadCheck} from '../types'
import {
  groupNotifications,
  markUnreadCheckSeen,
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
  following = false,
}: {
  reason: string
  indexedAt: string
  isRead?: boolean
  following?: boolean
}): Notification {
  return {
    uri: `at://did:plc:author/app.bsky.feed.post/${indexedAt}`,
    cid: `cid-${indexedAt}`,
    author: {
      did: 'did:plc:author',
      handle: 'author.test',
      viewer: following
        ? {following: 'at://did:plc:viewer/app.bsky.graph.follow/1'}
        : {},
    },
    reason,
    record: {},
    isRead,
    indexedAt: indexedAt as Notification['indexedAt'],
  }
}

function makePage(...groups: Notification[][]): FeedPage {
  return {
    cursor: undefined,
    seenAt: new Date(0),
    items: groups.map(([notification, ...additional]) => ({
      _reactKey: notification.uri,
      type: 'unknown',
      notification,
      additional: additional.length ? additional : undefined,
    })),
  }
}

const REQUESTED_AT = Date.parse('2026-10-09T12:00:00.000Z')

describe('summarizeUnreadCheck', () => {
  it('finds the newest notification, and the newest unread one, for each grouped feed', () => {
    const check = summarizeUnreadCheck(
      makePage(
        [makeNotification({reason: 'like', indexedAt: '2026-10-09T11:50:00Z'})],
        [
          makeNotification({
            reason: 'reply',
            indexedAt: '2026-10-09T11:40:00Z',
            following: true,
          }),
        ],
        [
          makeNotification({
            reason: 'reply',
            indexedAt: '2026-10-09T11:30:00Z',
          }),
        ],
        [
          makeNotification({
            reason: 'follow',
            indexedAt: '2026-10-09T11:20:00Z',
            isRead: true,
          }),
        ],
      ),
      REQUESTED_AT,
    )

    expect(check).toEqual({
      requestedAt: REQUESTED_AT,
      newestUnreadAt: {
        all: Date.parse('2026-10-09T11:50:00Z'),
        'people-i-follow': Date.parse('2026-10-09T11:40:00Z'),
        followers: undefined,
        conversations: Date.parse('2026-10-09T11:40:00Z'),
        activity: undefined,
      },
      newestAt: {
        all: Date.parse('2026-10-09T11:50:00Z'),
        'people-i-follow': Date.parse('2026-10-09T11:40:00Z'),
        followers: Date.parse('2026-10-09T11:20:00Z'),
        conversations: Date.parse('2026-10-09T11:40:00Z'),
        activity: undefined,
      },
    } satisfies UnreadCheck)
  })

  it('counts notifications grouped under another', () => {
    const check = summarizeUnreadCheck(
      makePage([
        makeNotification({
          reason: 'follow',
          indexedAt: '2026-10-09T11:00:00Z',
          isRead: true,
        }),
        makeNotification({reason: 'follow', indexedAt: '2026-10-09T11:10:00Z'}),
      ]),
      REQUESTED_AT,
    )

    expect(check.newestUnreadAt.followers).toBe(
      Date.parse('2026-10-09T11:10:00Z'),
    )
    expect(check.newestAt.followers).toBe(Date.parse('2026-10-09T11:10:00Z'))
  })

  it('finds nothing unread when everything is read', () => {
    const check = summarizeUnreadCheck(
      makePage([
        makeNotification({
          reason: 'like',
          indexedAt: '2026-10-09T11:00:00Z',
          isRead: true,
        }),
      ]),
      REQUESTED_AT,
    )

    expect(Object.values(check.newestUnreadAt)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ])
    expect(check.newestAt.all).toBe(Date.parse('2026-10-09T11:00:00Z'))
  })
})

describe('markUnreadCheckSeen', () => {
  const check: UnreadCheck = {
    requestedAt: REQUESTED_AT,
    newestUnreadAt: {
      all: Date.parse('2026-10-09T11:50:00Z'),
      'people-i-follow': undefined,
      followers: Date.parse('2026-10-09T11:00:00Z'),
      conversations: Date.parse('2026-10-09T11:30:00Z'),
      activity: undefined,
    },
    newestAt: {
      all: Date.parse('2026-10-09T11:50:00Z'),
      'people-i-follow': Date.parse('2026-10-09T10:00:00Z'),
      followers: Date.parse('2026-10-09T11:00:00Z'),
      conversations: Date.parse('2026-10-09T11:30:00Z'),
      activity: undefined,
    },
  }

  it('drops unread notifications indexed up to seenAt, but keeps the newest ones', () => {
    expect(
      markUnreadCheckSeen(check, Date.parse('2026-10-09T11:30:00Z')),
    ).toEqual({
      requestedAt: REQUESTED_AT,
      newestUnreadAt: {
        all: Date.parse('2026-10-09T11:50:00Z'),
        'people-i-follow': undefined,
        followers: undefined,
        conversations: undefined,
        activity: undefined,
      },
      newestAt: check.newestAt,
    })
  })

  it('leaves no check as none', () => {
    expect(markUnreadCheckSeen(undefined, REQUESTED_AT)).toBeUndefined()
  })
})
