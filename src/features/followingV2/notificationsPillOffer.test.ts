import {describe, expect, it} from '@jest/globals'

import {type UnreadCheck} from '#/state/queries/notifications/types'
import {isNotificationsPillOffered} from '#/features/followingV2/notificationsPillOffer'

/* Times are small integers: only their order matters. */
function check(
  requestedAt: number,
  newestUnreadAt: Partial<UnreadCheck['newestUnreadAt']>,
  loadsIntoFeed = false,
): UnreadCheck {
  return {
    requestedAt,
    newestUnreadAt: {all: undefined, mentions: undefined, ...newestUnreadAt},
    loadsIntoFeed,
  }
}

function loaded(requestedAt: number, newestAt: number | undefined) {
  return {requestedAt, newestAt, isFetching: false}
}

describe('isNotificationsPillOffered', () => {
  it('offers unread notifications newer than anything loaded', () => {
    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: check(20, {all: 15}),
        top: loaded(10, 9),
      }),
    ).toBe(true)
  })

  it('ignores unread notifications the list already shows', () => {
    // e.g. marked read with an older seenAt than the page it was marking
    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: check(20, {all: 9}),
        top: loaded(10, 9),
      }),
    ).toBe(false)
    // older unread rows not paged in yet are not new either
    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: check(20, {all: 5}),
        top: loaded(10, 9),
      }),
    ).toBe(false)
  })

  it('has nothing to offer without an unread check', () => {
    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: undefined,
        top: loaded(10, 9),
      }),
    ).toBe(false)
    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: check(20, {}),
        top: loaded(10, 9),
      }),
    ).toBe(false)
  })

  it('stays out of the way of a check that is loading the lists itself', () => {
    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: check(20, {all: 15}, true),
        top: loaded(10, 9),
      }),
    ).toBe(false)
  })

  it('waits for a list that has not loaded yet', () => {
    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: check(20, {all: 15}),
        top: {requestedAt: undefined, newestAt: undefined, isFetching: false},
      }),
    ).toBe(false)
  })

  it('offers anything unread to a list that loaded empty', () => {
    expect(
      isNotificationsPillOffered({
        filter: 'mentions',
        check: check(20, {mentions: 15}),
        top: loaded(10, undefined),
      }),
    ).toBe(true)
  })

  it('reads the check for its own list', () => {
    // an unread like is new to All, and nothing to Mentions
    const likeOnly = check(20, {all: 15})
    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: likeOnly,
        top: loaded(10, 9),
      }),
    ).toBe(true)
    expect(
      isNotificationsPillOffered({
        filter: 'mentions',
        check: likeOnly,
        top: loaded(10, 9),
      }),
    ).toBe(false)
    expect(
      isNotificationsPillOffered({
        filter: 'mentions',
        check: check(20, {all: 15, mentions: 12}),
        top: loaded(10, 9),
      }),
    ).toBe(true)
  })

  /*
   * One list through a whole offer: a check finds more, the reader presses the
   * pill (or anything else refreshes the list), and only a later check can
   * bring the pill back.
   */
  it('hides from the start of a fetch until a later check finds more', () => {
    const found = check(20, {all: 15})
    const offered = (top: Parameters<typeof loaded> | 'fetching') =>
      isNotificationsPillOffered({
        filter: 'all',
        check: found,
        top:
          top === 'fetching'
            ? {requestedAt: 10, newestAt: 9, isFetching: true}
            : loaded(...top),
      })

    expect(offered([10, 9])).toBe(true)
    expect(offered('fetching')).toBe(false)
    // loaded, with what the check found
    expect(offered([30, 15])).toBe(false)
    // loaded, without it: deleted since, say; still nothing new to offer
    expect(offered([30, 9])).toBe(false)

    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: check(40, {all: 35}),
        top: loaded(30, 15),
      }),
    ).toBe(true)
  })

  it('comes back after a failed fetch, so the reader can retry', () => {
    const found = check(20, {all: 15})
    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: found,
        top: {requestedAt: 10, newestAt: 9, isFetching: true},
      }),
    ).toBe(false)
    // the fetch failed: the list still has its old first page
    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: found,
        top: loaded(10, 9),
      }),
    ).toBe(true)
  })

  it('ignores a check no newer than the first page of the list', () => {
    // a poll that finished while a refresh was already on its way
    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: check(15, {all: 25}),
        top: loaded(20, 9),
      }),
    ).toBe(false)
    // the check's own page, taken as the list's first page
    expect(
      isNotificationsPillOffered({
        filter: 'all',
        check: check(20, {all: 25}),
        top: loaded(20, 9),
      }),
    ).toBe(false)
  })
})
