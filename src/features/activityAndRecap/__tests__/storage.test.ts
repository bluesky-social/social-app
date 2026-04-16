import {beforeEach, describe, expect, jest, test} from '@jest/globals'

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

import {MAX_FOLLOWER_SNAPSHOTS} from '#/features/activityAndRecap/constants'
import {
  clearAllForDid,
  dismissRecapWeek,
  getRecapCardFirstShown,
  isRecapWeekDismissed,
  markRecapCardFirstShown,
  patchPrefs,
  readFollowerSnapshots,
  readPrefs,
  readStreak,
  upsertFollowerSnapshot,
  writePrefs,
  writeStreak,
} from '#/features/activityAndRecap/storage'
import {
  STREAK_STORE_VERSION,
  type StreakStore,
} from '#/features/activityAndRecap/types'
import {account} from '#/storage'

const DID = 'did:plc:testuser'

function baseStreak(): StreakStore {
  return {
    version: STREAK_STORE_VERSION,
    currentStreak: 3,
    longestStreak: 5,
    lastVisitDay: '2026-04-14',
    lastVisitZone: 'America/New_York',
    lastVisitAtUtcMs: Date.UTC(2026, 3, 14),
    graceUsedForCurrentStreak: false,
  }
}

beforeEach(() => {
  clearAllForDid(DID)
})

describe('streak read/write', () => {
  test('roundtrips', () => {
    expect(readStreak(DID)).toBeUndefined()
    const s = baseStreak()
    writeStreak(DID, s)
    expect(readStreak(DID)).toEqual(s)
  })

  test('version mismatch returns raw value (reducer handles)', () => {
    const broken = {...baseStreak(), version: 999 as any}
    account.set([DID, 'streak'], broken)
    const read = readStreak(DID)
    expect(read?.version).toBe(999)
  })
})

describe('follower snapshots ring buffer', () => {
  test('upsert replaces same-day entry', () => {
    upsertFollowerSnapshot(DID, {day: '2026-04-14', count: 100})
    upsertFollowerSnapshot(DID, {day: '2026-04-14', count: 101})
    const out = readFollowerSnapshots(DID)
    expect(out).toHaveLength(1)
    expect(out[0].count).toBe(101)
  })

  test('trims to MAX_FOLLOWER_SNAPSHOTS, dropping oldest', () => {
    for (let i = 0; i < MAX_FOLLOWER_SNAPSHOTS + 3; i++) {
      const d = new Date(2026, 0, 1 + i)
      const iso = d.toISOString().slice(0, 10)
      upsertFollowerSnapshot(DID, {day: iso, count: i})
    }
    const out = readFollowerSnapshots(DID)
    expect(out).toHaveLength(MAX_FOLLOWER_SNAPSHOTS)
    // First 3 inserted days should have been dropped.
    expect(out[0].day).not.toBe('2026-01-01')
  })

  test('sorts by day ascending', () => {
    upsertFollowerSnapshot(DID, {day: '2026-04-14', count: 100})
    upsertFollowerSnapshot(DID, {day: '2026-04-13', count: 99})
    upsertFollowerSnapshot(DID, {day: '2026-04-15', count: 101})
    const out = readFollowerSnapshots(DID)
    expect(out.map(s => s.day)).toEqual([
      '2026-04-13',
      '2026-04-14',
      '2026-04-15',
    ])
  })
})

describe('prefs + dismissals + firstShown', () => {
  test('readPrefs default empty; patchPrefs merges', () => {
    expect(readPrefs(DID)).toEqual({})
    patchPrefs(DID, {showStreak: true})
    expect(readPrefs(DID)).toEqual({showStreak: true})
    patchPrefs(DID, {showRecap: false})
    expect(readPrefs(DID)).toEqual({showStreak: true, showRecap: false})
  })

  test('dismissRecapWeek persists + isRecapWeekDismissed detects', () => {
    expect(isRecapWeekDismissed(DID, '2026-W15')).toBe(false)
    dismissRecapWeek(DID, '2026-W15')
    expect(isRecapWeekDismissed(DID, '2026-W15')).toBe(true)
  })

  test('markRecapCardFirstShown only writes first time', () => {
    markRecapCardFirstShown(DID, '2026-W15', 1000)
    markRecapCardFirstShown(DID, '2026-W15', 2000) // ignored
    expect(getRecapCardFirstShown(DID, '2026-W15')).toBe(1000)
  })
})

describe('clearAllForDid (A10)', () => {
  test('removes streak, snapshots, and prefs', () => {
    writeStreak(DID, baseStreak())
    upsertFollowerSnapshot(DID, {day: '2026-04-14', count: 100})
    writePrefs(DID, {showStreak: false, dismissedRecapWeekIds: ['2026-W15']})
    clearAllForDid(DID)
    expect(readStreak(DID)).toBeUndefined()
    expect(readFollowerSnapshots(DID)).toEqual([])
    expect(readPrefs(DID)).toEqual({})
  })
})
