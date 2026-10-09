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
  it('takes the server seenAt in server mode', () => {
    expect(
      nextSeenAt({load: load(), mode: 'server', snapshot: SNAPSHOT}),
    ).toEqual(new Date(SERVER_SEEN_AT))
  })

  it('clears up to the request in cleared mode', () => {
    expect(
      nextSeenAt({load: load(), mode: 'cleared', snapshot: SNAPSHOT}),
    ).toEqual(new Date(REQUESTED_AT))
  })

  it('clears up to the newest notification when the server clock is ahead', () => {
    const newestAt = REQUESTED_AT + 5000
    expect(
      nextSeenAt({load: load({newestAt}), mode: 'cleared', snapshot: SNAPSHOT}),
    ).toEqual(new Date(newestAt))
  })

  it('keeps the snapshot in kept mode, or without a mode', () => {
    expect(nextSeenAt({load: load(), mode: 'kept', snapshot: SNAPSHOT})).toBe(
      SNAPSHOT,
    )
    expect(
      nextSeenAt({load: load(), mode: undefined, snapshot: SNAPSHOT}),
    ).toBe(SNAPSHOT)
  })

  it('takes the server seenAt when there is no snapshot yet, whatever the mode', () => {
    for (const mode of ['server', 'cleared', 'kept', undefined] as const) {
      expect(nextSeenAt({load: load(), mode, snapshot: undefined})).toEqual(
        new Date(SERVER_SEEN_AT),
      )
    }
  })

  it('treats a missing or invalid server seenAt as everything seen', () => {
    for (const seenAt of [undefined, '', 'not a date']) {
      expect(
        nextSeenAt({load: load({seenAt}), mode: 'server', snapshot: undefined}),
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
})
