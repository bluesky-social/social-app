import {describe, expect, it} from '@jest/globals'

import {type Notification, type UnreadCheck} from '../types'
import {markUnreadCheckSeen, summarizeUnreadCheck} from '../util'

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

const REQUESTED_AT = Date.parse('2026-10-09T12:00:00.000Z')

describe('summarizeUnreadCheck', () => {
  it('finds the newest unread notification for each grouped feed', () => {
    const check = summarizeUnreadCheck(
      [
        makeNotification({reason: 'like', indexedAt: '2026-10-09T11:50:00Z'}),
        makeNotification({
          reason: 'reply',
          indexedAt: '2026-10-09T11:40:00Z',
          following: true,
        }),
        makeNotification({
          reason: 'reply',
          indexedAt: '2026-10-09T11:30:00Z',
        }),
        makeNotification({
          reason: 'follow',
          indexedAt: '2026-10-09T11:20:00Z',
          isRead: true,
        }),
      ],
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
    } satisfies UnreadCheck)
  })

  it('finds an unread notification after a read one', () => {
    const check = summarizeUnreadCheck(
      [
        makeNotification({
          reason: 'follow',
          indexedAt: '2026-10-09T11:00:00Z',
          isRead: true,
        }),
        makeNotification({reason: 'follow', indexedAt: '2026-10-09T11:10:00Z'}),
      ],
      REQUESTED_AT,
    )

    expect(check.newestUnreadAt.followers).toBe(
      Date.parse('2026-10-09T11:10:00Z'),
    )
  })

  it('finds nothing when everything is read', () => {
    const check = summarizeUnreadCheck(
      [
        makeNotification({
          reason: 'like',
          indexedAt: '2026-10-09T11:00:00Z',
          isRead: true,
        }),
      ],
      REQUESTED_AT,
    )

    expect(Object.values(check.newestUnreadAt)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ])
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
  }

  it('drops what was indexed up to seenAt', () => {
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
    })
  })

  it('leaves no check as none', () => {
    expect(markUnreadCheckSeen(undefined, REQUESTED_AT)).toBeUndefined()
  })
})
