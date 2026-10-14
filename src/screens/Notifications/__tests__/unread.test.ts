import {describe, expect, it} from '@jest/globals'

import {type UnreadCheck} from '#/state/queries/notifications/types'
import {
  type FeedLoad,
  getMarkReadAt,
  isRefreshPillVisible,
  nextSeenAt,
} from '#/screens/Notifications/unread'

const REQUESTED_AT = Date.parse('2026-10-09T12:00:00.000Z')
const SERVER_SEEN_AT = '2026-10-09T09:00:00.000Z'
const SNAPSHOT = new Date('2026-10-09T10:00:00.000Z')

function load(overrides: Partial<FeedLoad> = {}): FeedLoad {
  return {
    feed: 'all',
    requestedAt: REQUESTED_AT,
    newestAt: Date.parse('2026-10-09T11:00:00.000Z'),
    seenAt: SERVER_SEEN_AT,
    ...overrides,
  }
}

describe('nextSeenAt', () => {
  it('takes the server seenAt on a refresh', () => {
    expect(
      nextSeenAt({load: load(), isRefresh: true, snapshot: SNAPSHOT}),
    ).toEqual(new Date(SERVER_SEEN_AT))
  })

  it('moves an existing snapshot to the server seenAt on a refresh, so only what arrived since the last load is tinted', () => {
    // The previous load marked everything up to SERVER_SEEN_AT as seen
    const olderSnapshot = new Date(Date.parse(SERVER_SEEN_AT) - 60_000)
    const next = nextSeenAt({
      load: load(),
      isRefresh: true,
      snapshot: olderSnapshot,
    })
    expect(next).toEqual(new Date(SERVER_SEEN_AT))
    // A notification from after the previous load stays unread
    expect(next!.getTime()).toBeLessThan(REQUESTED_AT)
  })

  it("keeps the snapshot for a load that isn't a refresh, e.g. a tab's first", () => {
    expect(
      nextSeenAt({load: load(), isRefresh: false, snapshot: SNAPSHOT}),
    ).toBe(SNAPSHOT)
  })

  it('takes the server seenAt when there is no snapshot yet, refresh or not', () => {
    for (const isRefresh of [true, false]) {
      expect(
        nextSeenAt({load: load(), isRefresh, snapshot: undefined}),
      ).toEqual(new Date(SERVER_SEEN_AT))
    }
  })

  it('treats a missing or invalid server seenAt as everything seen', () => {
    for (const seenAt of [undefined, '', 'not a date']) {
      expect(
        nextSeenAt({
          load: load({seenAt}),
          isRefresh: true,
          snapshot: undefined,
        }),
      ).toEqual(new Date(REQUESTED_AT))
    }
  })
})

describe('getMarkReadAt', () => {
  it('marks up to the request on All', () => {
    expect(getMarkReadAt(load())).toEqual(new Date(REQUESTED_AT))
  })

  it('marks up to the newest notification when the server clock is ahead', () => {
    const newestAt = REQUESTED_AT + 5000
    expect(getMarkReadAt(load({newestAt}))).toEqual(new Date(newestAt))
  })

  it('never moves the server seenAt backwards', () => {
    const seenAt = new Date(REQUESTED_AT + 60_000).toISOString()
    expect(getMarkReadAt(load({seenAt}))).toEqual(new Date(seenAt))
  })

  it('marks up to the request on an empty feed', () => {
    expect(
      getMarkReadAt(load({newestAt: undefined, seenAt: undefined})),
    ).toEqual(new Date(REQUESTED_AT))
  })

  it('leaves the other feeds to All', () => {
    for (const feed of [
      'people-i-follow',
      'followers',
      'conversations',
      'activity',
    ] as const) {
      expect(getMarkReadAt(load({feed}))).toBeUndefined()
    }
  })
})

describe('isRefreshPillVisible', () => {
  const TOP_REQUESTED_AT = Date.parse('2026-10-09T12:00:00.000Z')
  const TOP_NEWEST_AT = Date.parse('2026-10-09T11:00:00.000Z')

  function check(
    newestUnreadAt: Partial<UnreadCheck['newestUnreadAt']>,
    requestedAt = TOP_REQUESTED_AT + 30_000,
  ): UnreadCheck {
    return {
      requestedAt,
      newestUnreadAt: {
        all: undefined,
        'people-i-follow': undefined,
        followers: undefined,
        conversations: undefined,
        activity: undefined,
        ...newestUnreadAt,
      },
    }
  }

  function visible(
    overrides: Partial<Parameters<typeof isRefreshPillVisible>[0]> = {},
  ) {
    return isRefreshPillVisible({
      feed: 'all',
      isActive: true,
      check: check({all: TOP_NEWEST_AT + 60_000}),
      top: {requestedAt: TOP_REQUESTED_AT, newestAt: TOP_NEWEST_AT},
      isFetchingTop: false,
      ...overrides,
    })
  }

  it('shows for an unread notification newer than the loaded top', () => {
    expect(visible()).toBe(true)
  })

  it('only shows on the tab in view', () => {
    expect(visible({isActive: false})).toBe(false)
  })

  it('hides while the top is fetching', () => {
    expect(visible({isFetchingTop: true})).toBe(false)
  })

  it('hides before the tab has loaded, or before any check', () => {
    expect(visible({top: undefined})).toBe(false)
    expect(visible({check: undefined})).toBe(false)
  })

  it('ignores a check asked before the top was requested', () => {
    expect(
      visible({
        check: check({all: TOP_NEWEST_AT + 60_000}, TOP_REQUESTED_AT - 1),
      }),
    ).toBe(false)
    expect(
      visible({check: check({all: TOP_NEWEST_AT + 60_000}, TOP_REQUESTED_AT)}),
    ).toBe(false)
  })

  it('ignores unread notifications that are already loaded', () => {
    expect(visible({check: check({all: TOP_NEWEST_AT})})).toBe(false)
    expect(visible({check: check({all: TOP_NEWEST_AT - 1})})).toBe(false)
  })

  it('only counts notifications for the tab in view', () => {
    const replyOnly = check({conversations: TOP_NEWEST_AT + 60_000})
    expect(visible({feed: 'conversations', check: replyOnly})).toBe(true)
    expect(visible({feed: 'followers', check: replyOnly})).toBe(false)
  })

  it('shows on an empty tab for anything unread', () => {
    expect(
      visible({top: {requestedAt: TOP_REQUESTED_AT, newestAt: undefined}}),
    ).toBe(true)
  })

  describe('with a peek', () => {
    const nothingUnread = check({})

    it('shows for anything newer than the loaded top, read or not', () => {
      expect(
        visible({
          check: nothingUnread,
          peek: {
            requestedAt: TOP_REQUESTED_AT + 30_000,
            newestAt: TOP_NEWEST_AT + 60_000,
          },
        }),
      ).toBe(true)
    })

    it('shows without any unread check', () => {
      expect(
        visible({
          check: undefined,
          peek: {
            requestedAt: TOP_REQUESTED_AT + 30_000,
            newestAt: TOP_NEWEST_AT + 60_000,
          },
        }),
      ).toBe(true)
    })

    it('ignores a peek asked before the top was requested', () => {
      expect(
        visible({
          check: nothingUnread,
          peek: {
            requestedAt: TOP_REQUESTED_AT,
            newestAt: TOP_NEWEST_AT + 60_000,
          },
        }),
      ).toBe(false)
    })

    it('ignores a peek that found nothing newer, or nothing at all', () => {
      for (const newestAt of [TOP_NEWEST_AT, TOP_NEWEST_AT - 1, undefined]) {
        expect(
          visible({
            check: nothingUnread,
            peek: {requestedAt: TOP_REQUESTED_AT + 30_000, newestAt},
          }),
        ).toBe(false)
      }
    })

    it('still hides off the tab in view, or while the top is fetching', () => {
      const peek = {
        requestedAt: TOP_REQUESTED_AT + 30_000,
        newestAt: TOP_NEWEST_AT + 60_000,
      }
      expect(visible({check: nothingUnread, peek, isActive: false})).toBe(false)
      expect(visible({check: nothingUnread, peek, isFetchingTop: true})).toBe(
        false,
      )
    })
  })
})
