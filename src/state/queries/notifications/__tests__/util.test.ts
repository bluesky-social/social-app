import {
  type AtUriString,
  type DatetimeString,
  type DidString,
} from '@atproto/syntax'
import {describe, expect, it, jest} from '@jest/globals'

import {type Notification} from '../types'
import {groupNotifications, mergeGroupedNotifications} from '../util'

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

function makeLikeNotification(
  authorDid: DidString,
  subjectUri: string,
  indexedAt = '2026-07-28T12:00:00.000Z',
): Notification {
  return {
    uri: `at://${authorDid}/app.bsky.feed.like/like-${authorDid}`,
    cid: `cid-${authorDid}`,
    author: {
      did: authorDid,
      handle: `${authorDid}.test`,
      displayName: authorDid,
      avatar: undefined,
      associated: undefined,
      viewer: {},
      labels: [],
      createdAt: '2026-07-28T12:00:00.000Z',
    },
    reason: 'like',
    record: {
      $type: 'app.bsky.feed.like',
      subject: {uri: subjectUri, cid: 'cid-post'},
      createdAt: indexedAt,
    },
    reasonSubject: subjectUri as AtUriString,
    isRead: false,
    indexedAt: indexedAt as DatetimeString,
  }
}

function makeSubscribedPostNotification(
  authorDid: DidString,
  postRkey: string,
  indexedAt = '2026-07-28T12:00:00.000Z',
): Notification {
  return {
    uri: `at://${authorDid}/app.bsky.feed.post/${postRkey}`,
    cid: `cid-${postRkey}`,
    author: {
      did: authorDid,
      handle: `${authorDid}.test`,
      displayName: authorDid,
      avatar: undefined,
      associated: undefined,
      viewer: {},
      labels: [],
      createdAt: '2026-07-28T12:00:00.000Z',
    },
    reason: 'subscribed-post',
    record: {
      $type: 'app.bsky.feed.post',
      text: `Post ${postRkey}`,
      createdAt: indexedAt,
    },
    isRead: false,
    indexedAt: indexedAt as DatetimeString,
  }
}

describe('mergeGroupedNotifications', () => {
  it('merges notification groups across page boundaries for the same post like', () => {
    const postUri = 'at://did:plc:author/app.bsky.feed.post/post1'
    const page0 = groupNotifications([
      makeLikeNotification('did:plc:alice', postUri),
      makeLikeNotification('did:plc:bob', postUri),
    ])
    const page1 = groupNotifications([
      makeLikeNotification('did:plc:charlie', postUri),
      makeLikeNotification('did:plc:dave', postUri),
    ])

    expect(page0).toHaveLength(1)
    expect(page1).toHaveLength(1)

    const merged = mergeGroupedNotifications([...page0, ...page1])

    expect(merged).toHaveLength(1)
    expect(merged[0].notification.author.did).toBe('did:plc:alice')
    expect(merged[0].additional?.map(n => n.author.did)).toEqual([
      'did:plc:bob',
      'did:plc:charlie',
      'did:plc:dave',
    ])
  })

  it('merges subscribed-post notifications across page boundaries', () => {
    const page0 = groupNotifications([
      makeSubscribedPostNotification('did:plc:alice', 'post1'),
      makeSubscribedPostNotification('did:plc:alice', 'post2'),
    ])
    const page1 = groupNotifications([
      makeSubscribedPostNotification('did:plc:alice', 'post3'),
    ])

    expect(page0).toHaveLength(1)
    expect(page1).toHaveLength(1)

    const merged = mergeGroupedNotifications([...page0, ...page1])

    expect(merged).toHaveLength(1)
    expect(merged[0].notification.uri).toBe(
      'at://did:plc:alice/app.bsky.feed.post/post1',
    )
    expect(merged[0].additional?.map(n => n.uri)).toEqual([
      'at://did:plc:alice/app.bsky.feed.post/post2',
      'at://did:plc:alice/app.bsky.feed.post/post3',
    ])
  })

  it('does not merge likes on different posts', () => {
    const post1 = 'at://did:plc:author/app.bsky.feed.post/post1'
    const post2 = 'at://did:plc:author/app.bsky.feed.post/post2'
    const page0 = groupNotifications([
      makeLikeNotification('did:plc:alice', post1),
    ])
    const page1 = groupNotifications([
      makeLikeNotification('did:plc:bob', post2),
    ])

    const merged = mergeGroupedNotifications([...page0, ...page1])

    expect(merged).toHaveLength(2)
  })
})
