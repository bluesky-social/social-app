import {describe, expect, it} from '@jest/globals'

import {type UnreadCheck} from '#/state/queries/notifications/types'
import {
  type FeedLoad,
  type FeedTimes,
  getMarkReadAt,
  getUnreadTabs,
  isRefreshPillVisible,
  nextSeenAt,
} from '#/screens/Notifications/unread'

const REQUESTED_AT = Date.parse('2026-10-09T12:00:00.000Z')
const SERVER_SEEN_AT = '2026-10-09T09:00:00.000Z'
const SNAPSHOT = new Date('2026-10-09T10:00:00.000Z')
const NO_FEEDS: UnreadCheck['newestAt'] = {
  all: undefined,
  'people-i-follow': undefined,
  followers: undefined,
  conversations: undefined,
  activity: undefined,
}

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

  it('moves an existing snapshot to the server seenAt in server mode, so only what arrived since the last load is tinted', () => {
    // The previous load marked everything up to SERVER_SEEN_AT as seen
    const olderSnapshot = new Date(Date.parse(SERVER_SEEN_AT) - 60_000)
    const next = nextSeenAt({
      load: load(),
      mode: 'server',
      snapshot: olderSnapshot,
    })
    expect(next).toEqual(new Date(SERVER_SEEN_AT))
    // A notification from after the previous load stays unread
    expect(next!.getTime()).toBeLessThan(REQUESTED_AT)
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
    for (const mode of ['server', 'kept', undefined] as const) {
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
    const byFeed = {...NO_FEEDS, ...newestUnreadAt}
    return {requestedAt, newestUnreadAt: byFeed, newestAt: byFeed}
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

describe('getUnreadTabs', () => {
  const FEEDS = Object.keys(NO_FEEDS) as (keyof typeof NO_FEEDS)[]
  const BEFORE = SNAPSHOT.getTime() - 60_000
  const AFTER = SNAPSHOT.getTime() + 60_000
  const LATER = SNAPSHOT.getTime() + 120_000

  function check(newestAt: Partial<UnreadCheck['newestAt']>): UnreadCheck {
    return {
      requestedAt: REQUESTED_AT,
      // As after "All" has marked everything as seen
      newestUnreadAt: NO_FEEDS,
      newestAt: {...NO_FEEDS, ...newestAt},
    }
  }

  function unread(
    overrides: Partial<Parameters<typeof getUnreadTabs>[0]> = {},
  ) {
    return getUnreadTabs({
      feeds: FEEDS,
      activeFeed: 'all',
      check: undefined,
      loadedNewestAt: {},
      seenAt: SNAPSHOT,
      seenUpTo: {},
      ...overrides,
    })
  }

  it('marks a tab that has never loaded, from the unread check', () => {
    const {unreadTabs} = unread({check: check({conversations: AFTER})})
    expect([...unreadTabs]).toEqual(['conversations'])
  })

  it('counts notifications that are already marked as seen, as they are still tinted', () => {
    const {unreadTabs} = unread({
      check: check({all: AFTER, conversations: AFTER, followers: BEFORE}),
    })
    expect([...unreadTabs]).toEqual(['conversations'])
  })

  it('marks a loaded tab with notifications newer than the snapshot', () => {
    const {unreadTabs} = unread({
      activeFeed: 'conversations',
      loadedNewestAt: {all: AFTER, conversations: AFTER},
    })
    expect([...unreadTabs]).toEqual(['all'])
  })

  it('takes the newer of the loaded tab and the unread check', () => {
    expect(
      unread({
        loadedNewestAt: {activity: BEFORE},
        check: check({activity: AFTER}),
      }).unreadTabs.has('activity'),
    ).toBe(true)
    expect(
      unread({
        loadedNewestAt: {activity: AFTER},
        check: check({activity: BEFORE}),
      }).unreadTabs.has('activity'),
    ).toBe(true)
  })

  it('ignores notifications up to the snapshot', () => {
    const {unreadTabs} = unread({
      check: check({conversations: SNAPSHOT.getTime()}),
      loadedNewestAt: {followers: BEFORE},
    })
    expect(unreadTabs.size).toBe(0)
  })

  it('marks nothing before there is a snapshot', () => {
    const {unreadTabs} = unread({
      seenAt: undefined,
      check: check({conversations: AFTER}),
    })
    expect(unreadTabs.size).toBe(0)
  })

  it('never marks the tab in view', () => {
    const {unreadTabs} = unread({
      activeFeed: 'conversations',
      check: check({conversations: AFTER}),
    })
    expect(unreadTabs.size).toBe(0)
  })

  it('counts new followers, even though their rows are not tinted', () => {
    const {unreadTabs} = unread({check: check({followers: AFTER})})
    expect([...unreadTabs]).toEqual(['followers'])
  })

  it('clears a tab once it has been in view, until something newer arrives', () => {
    // Unread on "All"
    let state = unread({check: check({conversations: AFTER})})
    expect(state.unreadTabs.has('conversations')).toBe(true)

    // Switching to it
    state = unread({
      activeFeed: 'conversations',
      check: check({conversations: AFTER}),
      loadedNewestAt: {conversations: AFTER},
      seenUpTo: state.seenUpTo,
    })
    expect(state.seenUpTo.conversations).toBe(AFTER)

    // Switching back
    state = unread({
      check: check({conversations: AFTER}),
      loadedNewestAt: {conversations: AFTER},
      seenUpTo: state.seenUpTo,
    })
    expect(state.unreadTabs.has('conversations')).toBe(false)

    // A newer reply
    state = unread({
      check: check({conversations: LATER}),
      loadedNewestAt: {conversations: AFTER},
      seenUpTo: state.seenUpTo,
    })
    expect(state.unreadTabs.has('conversations')).toBe(true)
  })

  it('counts what arrives while a tab is in view as seen there', () => {
    let state = unread({
      activeFeed: 'conversations',
      loadedNewestAt: {conversations: AFTER},
    })
    // Offered by the "Refresh" pill, but not loaded
    state = unread({
      activeFeed: 'conversations',
      check: check({conversations: LATER}),
      loadedNewestAt: {conversations: AFTER},
      seenUpTo: state.seenUpTo,
    })
    state = unread({
      check: check({conversations: LATER}),
      loadedNewestAt: {conversations: AFTER},
      seenUpTo: state.seenUpTo,
    })
    expect(state.unreadTabs.has('conversations')).toBe(false)
  })

  it('stops marking a tab once pull-to-refresh moves the snapshot past it', () => {
    const args = {
      activeFeed: 'conversations',
      check: check({all: AFTER}),
    } as const
    expect(unread(args).unreadTabs.has('all')).toBe(true)
    expect(
      unread({...args, seenAt: new Date(AFTER)}).unreadTabs.has('all'),
    ).toBe(false)
  })

  it('keeps how far each tab has been seen when nothing new has arrived', () => {
    const seenUpTo: FeedTimes = {all: AFTER}
    expect(unread({loadedNewestAt: {all: AFTER}, seenUpTo}).seenUpTo).toBe(
      seenUpTo,
    )
    // Nor goes backwards, e.g. after the newest notification is deleted
    expect(unread({loadedNewestAt: {all: BEFORE}, seenUpTo}).seenUpTo).toBe(
      seenUpTo,
    )
  })
})
