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

import {clearActivityAndRecapDataForDid} from '#/features/activityAndRecap/clearActivityAndRecapDataForDid'
import {
  readFollowerSnapshots,
  readPrefs,
  readStreak,
  upsertFollowerSnapshot,
  writePrefs,
  writeStreak,
} from '#/features/activityAndRecap/storage'
import {STREAK_STORE_VERSION} from '#/features/activityAndRecap/types'

const DID = 'did:plc:clean-me'
const OTHER = 'did:plc:keep-me'

beforeEach(() => {
  clearActivityAndRecapDataForDid({did: DID})
  clearActivityAndRecapDataForDid({did: OTHER})
})

describe('clearActivityAndRecapDataForDid (AC-A10)', () => {
  test('clears streak, snapshots, and prefs for the given DID', () => {
    writeStreak(DID, {
      version: STREAK_STORE_VERSION,
      currentStreak: 3,
      longestStreak: 5,
      lastVisitDay: '2026-04-14',
      lastVisitZone: 'America/New_York',
      lastVisitAtUtcMs: 1,
      graceUsedForCurrentStreak: false,
    })
    upsertFollowerSnapshot(DID, {day: '2026-04-14', count: 100})
    writePrefs(DID, {showStreak: false})

    clearActivityAndRecapDataForDid({did: DID})

    expect(readStreak(DID)).toBeUndefined()
    expect(readFollowerSnapshots(DID)).toEqual([])
    expect(readPrefs(DID)).toEqual({})
  })

  test('does NOT touch other DIDs', () => {
    writeStreak(OTHER, {
      version: STREAK_STORE_VERSION,
      currentStreak: 99,
      longestStreak: 99,
      lastVisitDay: '2026-04-14',
      lastVisitZone: 'UTC',
      lastVisitAtUtcMs: 1,
      graceUsedForCurrentStreak: false,
    })

    clearActivityAndRecapDataForDid({did: DID})

    expect(readStreak(OTHER)?.currentStreak).toBe(99)
  })
})
