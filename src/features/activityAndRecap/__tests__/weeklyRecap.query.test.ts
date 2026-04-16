/**
 * Unit tests for `computeWeeklyRecap` (the pure core of the weeklyRecap
 * TanStack query). We exercise:
 *   - getAuthorFeed pagination + R3 short-circuit (oldest predates window)
 *   - WEEKLY_RECAP_MAX_PAGES hard cap
 *   - own-author + in-window filtering
 *   - top-post ranking + candidates list (B10)
 *   - graceful follower-delta degrade when getProfile throws (R2)
 *   - shape of the returned WeeklyRecap
 */

import {beforeEach, describe, expect, jest, test} from '@jest/globals'

// Inline MMKV mock (required transitively via storage.ts -> readFollowerSnapshots).
jest.mock('@bsky.app/react-native-mmkv', () => ({
  MMKV: class MMKVMock {
    _store = new Map<string, string>()
    set(key: string, value: string) {
      this._store.set(key, value)
    }
    getString(key: string) {
      return this._store.get(key)
    }
    delete(key: string) {
      this._store.delete(key)
    }
    addOnValueChangedListener(_cb: (key: string) => void) {
      return {remove: () => {}}
    }
    clearAll() {
      this._store.clear()
    }
  },
}))

// Stub the React hook modules so importing weeklyRecap.ts doesn't drag the
// session / dialog / native module graph into the test bundle. We only test
// the pure `computeWeeklyRecap` function here; useWeeklyRecapQuery is
// covered by the integration suite in QA.
jest.mock(
  '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled',
  () => ({
    useStreaksAndRecapEnabled: () => false,
  }),
)
jest.mock('#/features/activityAndRecap/hooks/useShowRecapPreference', () => ({
  useShowRecapPreference: () => [false, () => {}],
}))
jest.mock('#/state/session', () => ({
  useAgent: () => ({}),
  useSession: () => ({currentAccount: undefined}),
}))
jest.mock('#/state/queries', () => ({
  STALE: {HOURS: {ONE: 60 * 60 * 1000}},
  GCTIME: {INFINITY: Infinity},
}))

import {
  WEEKLY_RECAP_MAX_PAGES,
  WEEKLY_RECAP_PAGE_LIMIT,
} from '#/features/activityAndRecap/constants'
import {computeWeeklyRecap} from '#/features/activityAndRecap/queries/weeklyRecap'
import {upsertFollowerSnapshot} from '#/features/activityAndRecap/storage'

const DID = 'did:plc:author'
const ZONE = 'America/New_York'
const WEEK = '2026-W15' // Mon Apr 6 — Sun Apr 12, 2026 (local)

// Helpers ------------------------------------------------------------------
function isoOnDay(year: number, month: number, day: number, hour = 12) {
  return new Date(Date.UTC(year, month - 1, day, hour)).toISOString()
}

function postItem(opts: {
  uri: string
  cid: string
  indexedAt: string
  authorDid?: string
  likeCount?: number
  repostCount?: number
  replyCount?: number
}) {
  return {
    post: {
      uri: opts.uri,
      cid: opts.cid,
      indexedAt: opts.indexedAt,
      author: {did: opts.authorDid ?? DID},
      likeCount: opts.likeCount ?? 0,
      repostCount: opts.repostCount ?? 0,
      replyCount: opts.replyCount ?? 0,
    },
  }
}

/**
 * Build a fake AtpAgent with controllable getAuthorFeed pages and a
 * configurable getProfile response.
 */
function makeAgent(opts: {
  pages: Array<{feed: any[]; cursor?: string}>
  followersCount?: number
  profileThrows?: boolean
}) {
  const getAuthorFeed = jest.fn(async ({cursor: _cursor}: any) => {
    const idx = getAuthorFeed.mock.calls.length - 1
    const page = opts.pages[idx] ?? {feed: [], cursor: undefined}
    return {data: page}
  })
  const getProfile = jest.fn(async () => {
    if (opts.profileThrows) throw new Error('boom')
    return {data: {followersCount: opts.followersCount ?? 0}}
  })
  return {
    getAuthorFeed,
    getProfile,
    app: {
      bsky: {
        feed: {getAuthorFeed},
        actor: {getProfile},
      },
    },
  } as any
}

beforeEach(() => {
  jest.clearAllMocks()
})

// Tests --------------------------------------------------------------------
describe('computeWeeklyRecap', () => {
  test('returns canonical empty shape when no posts at all', async () => {
    const agent = makeAgent({
      pages: [{feed: [], cursor: undefined}],
      followersCount: 100,
    })
    const recap = await computeWeeklyRecap({
      agent,
      did: DID,
      weekIso: WEEK,
      zone: ZONE,
      now: Date.UTC(2026, 3, 13, 12),
    })
    expect(recap.weekIso).toBe(WEEK)
    expect(recap.postsCount).toBe(0)
    expect(recap.topPost).toBeNull()
    expect(recap.topPostCandidates).toEqual([])
    expect(recap.followerDelta).toBe(0) // no prior snapshot in storage
    expect(typeof recap.windowStart).toBe('string')
    expect(typeof recap.windowEnd).toBe('string')
  })

  test('counts only own-author in-window posts and ranks topPost', async () => {
    // Seed a start-of-window follower snapshot so the delta has a baseline.
    // The synthesized "today" snapshot (count=105 below) lands at endDay
    // when `now` is set to a Date inside the window.
    upsertFollowerSnapshot(DID, {day: '2026-04-06', count: 100})

    const agent = makeAgent({
      pages: [
        {
          feed: [
            // Three in-window own posts — the top one should be the second
            // (3+1+0 = 4 engagement vs 1+0+0 = 1, 0+0+0 = 0).
            postItem({
              uri: 'at://x/1',
              cid: 'b1',
              indexedAt: isoOnDay(2026, 4, 7),
              likeCount: 1,
            }),
            postItem({
              uri: 'at://x/2',
              cid: 'b2',
              indexedAt: isoOnDay(2026, 4, 8),
              likeCount: 3,
              repostCount: 1,
            }),
            postItem({
              uri: 'at://x/3',
              cid: 'b3',
              indexedAt: isoOnDay(2026, 4, 9),
            }),
            // Out-of-window — ignored.
            postItem({
              uri: 'at://x/old',
              cid: 'bold',
              indexedAt: isoOnDay(2026, 3, 30),
            }),
            // Other-author — ignored.
            postItem({
              uri: 'at://y/1',
              cid: 'bo',
              indexedAt: isoOnDay(2026, 4, 9),
              authorDid: 'did:plc:other',
            }),
          ],
          cursor: undefined,
        },
      ],
      followersCount: 105,
    })

    const recap = await computeWeeklyRecap({
      agent,
      did: DID,
      weekIso: WEEK,
      zone: ZONE,
      // Inside the window (Sun Apr 12 EDT local) so the synthesized
      // "today" snapshot is at endDay and the delta resolves.
      now: Date.UTC(2026, 3, 12, 16),
    })
    expect(recap.postsCount).toBe(3)
    expect(recap.topPost).toEqual({uri: 'at://x/2', cid: 'b2'})
    // All three in-window candidates should appear, ordered by score desc.
    expect(recap.topPostCandidates).toEqual([
      {uri: 'at://x/2', cid: 'b2'},
      {uri: 'at://x/1', cid: 'b1'},
      {uri: 'at://x/3', cid: 'b3'},
    ])
    expect(recap.followerDelta).toBe(5)
  })

  test('R3: short-circuits pagination when oldest item predates window', async () => {
    const agent = makeAgent({
      pages: [
        {
          feed: [
            postItem({
              uri: 'at://x/new',
              cid: 'b',
              indexedAt: isoOnDay(2026, 4, 8),
            }),
            // Tail item is BEFORE window → triggers short-circuit.
            postItem({
              uri: 'at://x/older',
              cid: 'bo',
              indexedAt: isoOnDay(2026, 3, 1),
            }),
          ],
          cursor: 'next',
        },
        {feed: [], cursor: undefined},
      ],
      followersCount: 0,
    })

    await computeWeeklyRecap({
      agent,
      did: DID,
      weekIso: WEEK,
      zone: ZONE,
      now: Date.UTC(2026, 3, 13, 12),
    })
    // Only first page should have been fetched.
    expect(agent.getAuthorFeed).toHaveBeenCalledTimes(1)
    expect(agent.getAuthorFeed).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: DID,
        limit: WEEKLY_RECAP_PAGE_LIMIT,
        filter: 'posts_with_replies',
      }),
    )
  })

  test('hard cap: never fetches more than WEEKLY_RECAP_MAX_PAGES', async () => {
    // Every page returns items still inside the window (so the R3
    // short-circuit never trips) and a non-empty cursor.
    const pages = Array.from({length: WEEKLY_RECAP_MAX_PAGES + 3}, (_, i) => ({
      feed: [
        postItem({
          uri: `at://x/p${i}`,
          cid: `b${i}`,
          indexedAt: isoOnDay(2026, 4, 8),
        }),
      ],
      cursor: `c${i}`,
    }))
    const agent = makeAgent({pages, followersCount: 0})

    await computeWeeklyRecap({
      agent,
      did: DID,
      weekIso: WEEK,
      zone: ZONE,
      now: Date.UTC(2026, 3, 13, 12),
    })
    expect(agent.getAuthorFeed).toHaveBeenCalledTimes(WEEKLY_RECAP_MAX_PAGES)
  })

  test('R2: degrades to followerDelta=0 when getProfile throws', async () => {
    const agent = makeAgent({
      pages: [{feed: [], cursor: undefined}],
      profileThrows: true,
    })
    const recap = await computeWeeklyRecap({
      agent,
      did: DID,
      weekIso: WEEK,
      zone: ZONE,
      now: Date.UTC(2026, 3, 13, 12),
    })
    expect(recap.followerDelta).toBe(0)
    // Still produced a valid recap shape.
    expect(recap.weekIso).toBe(WEEK)
  })

  test('throws on malformed weekIso', async () => {
    const agent = makeAgent({pages: [{feed: [], cursor: undefined}]})
    await expect(
      computeWeeklyRecap({
        agent,
        did: DID,
        weekIso: 'not-a-week',
        zone: ZONE,
      }),
    ).rejects.toThrow(/invalid weekIso/)
  })

  test('topPost is null but candidates empty when only out-of-window own posts exist', async () => {
    const agent = makeAgent({
      pages: [
        {
          feed: [
            postItem({
              uri: 'at://x/old',
              cid: 'b',
              indexedAt: isoOnDay(2026, 3, 30),
            }),
          ],
          cursor: undefined,
        },
      ],
    })
    const recap = await computeWeeklyRecap({
      agent,
      did: DID,
      weekIso: WEEK,
      zone: ZONE,
      now: Date.UTC(2026, 3, 13, 12),
    })
    expect(recap.postsCount).toBe(0)
    expect(recap.topPost).toBeNull()
    expect(recap.topPostCandidates).toEqual([])
  })
})
