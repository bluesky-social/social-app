import {describe, expect, it} from '@jest/globals'

import {isInGroupedFeed} from '#/state/queries/notifications/grouped/membership'
import {type GroupedNotificationsFeed} from '#/state/queries/notifications/grouped/types'
import {type app} from '#/lexicons'

type Notification = app.bsky.notification.listNotifications.Notification

const FEEDS: GroupedNotificationsFeed[] = [
  'all',
  'people-i-follow',
  'followers',
  'conversations',
  'activity',
]

/*
 * The generated view brands `did`/`uri`/`cid`/`indexedAt`, and these are
 * plain test strings, so the literal is asserted once. Membership only reads
 * the reason and the author's viewer state.
 */
function notification(
  reason: string,
  {following = false}: {following?: boolean} = {},
): Notification {
  return {
    uri: 'at://did:plc:author/app.bsky.feed.post/1',
    cid: 'cid',
    author: {
      did: 'did:plc:author',
      handle: 'author.test',
      viewer: following
        ? {following: 'at://did:plc:viewer/app.bsky.graph.follow/1'}
        : {},
    },
    reason,
    record: {},
    isRead: false,
    indexedAt: '2026-10-09T12:00:00.000Z',
  }
}

function feedsFor(notif: Notification) {
  return FEEDS.filter(feed => isInGroupedFeed(feed, notif))
}

describe('isInGroupedFeed', () => {
  it('puts every known reason in All', () => {
    for (const reason of [
      'like',
      'repost',
      'follow',
      'mention',
      'reply',
      'quote',
      'starterpack-joined',
      'verified',
      'unverified',
      'like-via-repost',
      'repost-via-repost',
      'subscribed-post',
      'contact-match',
    ]) {
      expect(isInGroupedFeed('all', notification(reason))).toBe(true)
    }
  })

  it('leaves unknown reasons out of every feed', () => {
    expect(feedsFor(notification('something-new', {following: true}))).toEqual(
      [],
    )
  })

  it('puts replies, quotes and mentions in Replies', () => {
    for (const reason of ['reply', 'quote', 'mention']) {
      expect(feedsFor(notification(reason))).toEqual(['all', 'conversations'])
    }
  })

  it('puts follows in Followers', () => {
    expect(feedsFor(notification('follow'))).toEqual(['all', 'followers'])
  })

  it('puts subscribed posts in Activity', () => {
    expect(feedsFor(notification('subscribed-post'))).toEqual([
      'all',
      'activity',
    ])
  })

  it('keeps everything else to All', () => {
    for (const reason of ['like', 'repost', 'verified', 'contact-match']) {
      expect(feedsFor(notification(reason))).toEqual(['all'])
    }
  })

  it('adds anything from people the viewer follows to People you follow', () => {
    expect(feedsFor(notification('like', {following: true}))).toEqual([
      'all',
      'people-i-follow',
    ])
    expect(feedsFor(notification('follow', {following: true}))).toEqual([
      'all',
      'people-i-follow',
      'followers',
    ])
    expect(feedsFor(notification('reply', {following: true}))).toEqual([
      'all',
      'people-i-follow',
      'conversations',
    ])
  })
})
