import {type DidString} from '@atproto/syntax'
import {describe, expect, it, jest} from '@jest/globals'

import {type Notification} from '../types'
import {groupNotifications} from '../util'

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
  it('does not group a starter pack follow with an organic follow', () => {
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

  it('groups follows by starter pack', () => {
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
