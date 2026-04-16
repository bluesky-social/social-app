import {describe, expect, test} from '@jest/globals'

import {computeNextStreak} from '#/features/activityAndRecap/reducer/computeNextStreak'
import {
  STREAK_STORE_VERSION,
  type StreakStore,
} from '#/features/activityAndRecap/types'

const MS_HOUR = 60 * 60 * 1000
const MS_DAY = 24 * MS_HOUR

function makeStore(overrides: Partial<StreakStore> = {}): StreakStore {
  return {
    version: STREAK_STORE_VERSION,
    currentStreak: 1,
    longestStreak: 1,
    lastVisitDay: '2026-04-14',
    lastVisitZone: 'America/New_York',
    lastVisitAtUtcMs: Date.UTC(2026, 3, 14, 14, 0, 0),
    graceUsedForCurrentStreak: false,
    ...overrides,
  }
}

describe('computeNextStreak', () => {
  test('first visit → currentStreak=1, longestStreak=1 (A2)', () => {
    const now = {
      utcMs: Date.UTC(2026, 3, 15, 14, 0),
      zone: 'America/New_York',
      localDay: '2026-04-15',
    }
    const next = computeNextStreak(undefined, now)
    expect(next.currentStreak).toBe(1)
    expect(next.longestStreak).toBe(1)
    expect(next.graceUsedForCurrentStreak).toBe(false)
    expect(next.lastVisitDay).toBe('2026-04-15')
    expect(next.lastVisitZone).toBe('America/New_York')
    expect(next.lastVisitAtUtcMs).toBe(now.utcMs)
  })

  test('consecutive day in same tz → +1 (A2)', () => {
    const prev = makeStore({currentStreak: 3, longestStreak: 3})
    const now = {
      utcMs: prev.lastVisitAtUtcMs + MS_DAY,
      zone: 'America/New_York',
      localDay: '2026-04-15',
    }
    const next = computeNextStreak(prev, now)
    expect(next.currentStreak).toBe(4)
    expect(next.longestStreak).toBe(4)
    expect(next.graceUsedForCurrentStreak).toBe(false)
  })

  test('same-day second visit → unchanged streak, lastVisitAtUtcMs updated (A1)', () => {
    const prev = makeStore({currentStreak: 5})
    const now = {
      utcMs: prev.lastVisitAtUtcMs + 2 * MS_HOUR,
      zone: 'America/New_York',
      localDay: '2026-04-14',
    }
    const next = computeNextStreak(prev, now)
    expect(next.currentStreak).toBe(5)
    expect(next.lastVisitAtUtcMs).toBe(now.utcMs)
  })

  test('exactly 1 day missed, grace unused → unchanged, graceUsed=true (A3)', () => {
    // prev day 04-14, now 04-16 → delta 2 (one day skipped)
    const prev = makeStore({currentStreak: 7, longestStreak: 7})
    const now = {
      utcMs: prev.lastVisitAtUtcMs + 2 * MS_DAY,
      zone: 'America/New_York',
      localDay: '2026-04-16',
    }
    const next = computeNextStreak(prev, now)
    expect(next.currentStreak).toBe(7)
    expect(next.graceUsedForCurrentStreak).toBe(true)
    expect(next.lastVisitDay).toBe('2026-04-16')
  })

  test('1 day missed but grace already used → reset to 1 (A4)', () => {
    const prev = makeStore({
      currentStreak: 7,
      longestStreak: 10,
      graceUsedForCurrentStreak: true,
    })
    const now = {
      utcMs: prev.lastVisitAtUtcMs + 2 * MS_DAY,
      zone: 'America/New_York',
      localDay: '2026-04-16',
    }
    const next = computeNextStreak(prev, now)
    expect(next.currentStreak).toBe(1)
    expect(next.graceUsedForCurrentStreak).toBe(false)
    expect(next.longestStreak).toBe(10) // high-water preserved
  })

  test('2+ days missed → reset to 1, grace cleared (A4)', () => {
    const prev = makeStore({currentStreak: 12, longestStreak: 12})
    const now = {
      utcMs: prev.lastVisitAtUtcMs + 4 * MS_DAY,
      zone: 'America/New_York',
      localDay: '2026-04-18',
    }
    const next = computeNextStreak(prev, now)
    expect(next.currentStreak).toBe(1)
    expect(next.graceUsedForCurrentStreak).toBe(false)
    expect(next.longestStreak).toBe(12)
  })

  test('UTC delta <20h blocks increment regardless of local date (A5)', () => {
    const prev = makeStore({currentStreak: 5})
    const now = {
      utcMs: prev.lastVisitAtUtcMs + 10 * MS_HOUR,
      zone: 'America/New_York',
      // Caller *claims* it's a new day, but 10h hasn't passed — reject.
      localDay: '2026-04-15',
    }
    const next = computeNextStreak(prev, now)
    expect(next).toBe(prev)
  })

  test('tz hop EWR→LAX same local day → no decrement, no increment (A5)', () => {
    // Traveled westward. lastVisitAtUtcMs 14:00 UTC on 2026-04-14 in NY
    // (10:00 EDT). Now 22:00 UTC on 2026-04-14 in LA (15:00 PDT).
    // Same local day "2026-04-14" in LA.
    const prev = makeStore({
      currentStreak: 4,
      lastVisitDay: '2026-04-14',
      lastVisitZone: 'America/New_York',
      lastVisitAtUtcMs: Date.UTC(2026, 3, 14, 14, 0),
    })
    const now = {
      utcMs: Date.UTC(2026, 3, 14, 22, 0),
      zone: 'America/Los_Angeles',
      localDay: '2026-04-14',
    }
    const next = computeNextStreak(prev, now)
    expect(next.currentStreak).toBe(4)
  })

  test('longestStreak never decreases', () => {
    const prev = makeStore({currentStreak: 2, longestStreak: 99})
    const now = {
      utcMs: prev.lastVisitAtUtcMs + 4 * MS_DAY,
      zone: 'America/New_York',
      localDay: '2026-04-18',
    }
    const next = computeNextStreak(prev, now)
    expect(next.currentStreak).toBe(1)
    expect(next.longestStreak).toBe(99)
  })

  test('regression: new localDay earlier than prev does not decrement (A5)', () => {
    const prev = makeStore({
      currentStreak: 4,
      lastVisitDay: '2026-04-14',
    })
    const now = {
      utcMs: prev.lastVisitAtUtcMs + 21 * MS_HOUR,
      zone: 'Pacific/Auckland',
      localDay: '2026-04-13', // earlier!
    }
    const next = computeNextStreak(prev, now)
    expect(next.currentStreak).toBe(4)
  })

  test('consecutive day across DST spring-forward', () => {
    // prev day 2026-03-07 EST, now 2026-03-08 EDT
    const prev = makeStore({
      currentStreak: 3,
      lastVisitDay: '2026-03-07',
      lastVisitAtUtcMs: Date.UTC(2026, 2, 7, 18, 0),
    })
    const now = {
      utcMs: Date.UTC(2026, 2, 8, 18, 0), // 24h later in UTC
      zone: 'America/New_York',
      localDay: '2026-03-08',
    }
    const next = computeNextStreak(prev, now)
    expect(next.currentStreak).toBe(4)
  })

  test('version mismatch triggers defensive reset to 1', () => {
    const prev = {
      ...makeStore({currentStreak: 10, longestStreak: 10}),
      version: 999 as any,
    }
    const now = {
      utcMs: prev.lastVisitAtUtcMs + MS_DAY,
      zone: 'America/New_York',
      localDay: '2026-04-15',
    }
    const next = computeNextStreak(prev, now)
    expect(next.version).toBe(STREAK_STORE_VERSION)
    expect(next.currentStreak).toBe(1)
  })
})
