/**
 * Integration tests for useStreakTracker (S7).
 *
 * We mock the hook's collaborators (session, agent, AppState, route focus,
 * preference, feature flag) and assert that:
 *
 *   - 30s contiguous foreground + Home active + feed-render signal increments
 *     the streak exactly once per day (AC-A1, A2).
 *   - 29s does NOT increment (AC-A1).
 *   - Foreground without HomeTab focus does NOT increment (AC-A1, A6).
 *   - Backgrounding before 30s aborts the timer (AC-A1).
 *   - Toggling showStreak off short-circuits everything (AC-X1).
 *   - Flag off short-circuits everything (AC-X6).
 *   - Listener cleanup on unmount (R4).
 */

import React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, render} from '@testing-library/react-native'

// MMKV mock — used transitively by the storage module.
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

// All mock collaborators must be declared with `mock`-prefixed names so
// Jest's hoisting-time variable guard accepts them. We expose a single
// mutable state object and read from it inside each factory.
const mockState = {
  appStateListeners: [] as Array<(s: string) => void>,
  appStateRemoveCount: 0,
  appStateCurrent: 'active' as string,
  isFocused: true,
  hasSession: true,
  did: 'did:plc:me',
  featureOn: true,
  showStreak: true,
  getProfileCalls: 0,
}

jest.mock('react-native', () => ({
  AppState: {
    get currentState() {
      return mockState.appStateCurrent
    },
    addEventListener: (_: string, cb: (s: string) => void) => {
      mockState.appStateListeners.push(cb)
      return {
        remove: () => {
          const idx = mockState.appStateListeners.indexOf(cb)
          if (idx >= 0) mockState.appStateListeners.splice(idx, 1)
          mockState.appStateRemoveCount += 1
        },
      }
    },
  },
}))

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => mockState.isFocused,
}))

jest.mock('#/state/session', () => ({
  useSession: () => ({
    hasSession: mockState.hasSession,
    currentAccount: mockState.hasSession ? {did: mockState.did} : undefined,
  }),
  useAgent: () => ({
    app: {
      bsky: {
        actor: {
          getProfile: async () => {
            mockState.getProfileCalls += 1
            return {data: {followersCount: 42}}
          },
        },
      },
    },
  }),
}))

jest.mock(
  '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled',
  () => ({
    useStreaksAndRecapEnabled: () => mockState.featureOn,
  }),
)
jest.mock('#/features/activityAndRecap/hooks/useShowStreakPreference', () => ({
  useShowStreakPreference: () => [mockState.showStreak, () => {}],
}))

import {STREAK_QUALIFYING_DWELL_MS} from '#/features/activityAndRecap/constants'
import {
  ActivityAndRecapProvider,
  useStreakTracker,
} from '#/features/activityAndRecap/hooks/useStreakTracker'
import {clearAllForDid, readStreak} from '#/features/activityAndRecap/storage'

function pushAppState(state: string) {
  mockState.appStateCurrent = state
  for (const cb of [...mockState.appStateListeners]) cb(state)
}

function FeedRenderSignaller({onMount}: {onMount: () => void}) {
  React.useEffect(() => {
    onMount()
  }, [onMount])
  return null
}

beforeEach(() => {
  jest.useFakeTimers()
  mockState.appStateListeners.length = 0
  mockState.appStateRemoveCount = 0
  mockState.appStateCurrent = 'active'
  mockState.isFocused = true
  mockState.hasSession = true
  mockState.featureOn = true
  mockState.showStreak = true
  mockState.did = 'did:plc:me'
  mockState.getProfileCalls = 0
  clearAllForDid(mockState.did)
})

describe('useStreakTracker (S7)', () => {
  test('30s foreground + Home focus + feed-render signal increments streak', () => {
    function Tracker() {
      const {signalFeedRender} = useStreakTracker()
      return <FeedRenderSignaller onMount={signalFeedRender} />
    }
    render(<Tracker />)
    act(() => {
      jest.advanceTimersByTime(STREAK_QUALIFYING_DWELL_MS + 100)
    })
    const stored = readStreak(mockState.did)
    expect(stored?.currentStreak).toBe(1)
    expect(stored?.longestStreak).toBe(1)
  })

  test('29s does NOT increment', () => {
    function Tracker() {
      const {signalFeedRender} = useStreakTracker()
      return <FeedRenderSignaller onMount={signalFeedRender} />
    }
    render(<Tracker />)
    act(() => {
      jest.advanceTimersByTime(STREAK_QUALIFYING_DWELL_MS - 1000)
    })
    expect(readStreak(mockState.did)).toBeUndefined()
  })

  test('without HomeTab focus, no increment', () => {
    mockState.isFocused = false
    function Tracker() {
      const {signalFeedRender} = useStreakTracker()
      return <FeedRenderSignaller onMount={signalFeedRender} />
    }
    render(<Tracker />)
    act(() => {
      jest.advanceTimersByTime(STREAK_QUALIFYING_DWELL_MS + 100)
    })
    expect(readStreak(mockState.did)).toBeUndefined()
  })

  test('backgrounding cancels in-flight timer', () => {
    function Tracker() {
      const {signalFeedRender} = useStreakTracker()
      return <FeedRenderSignaller onMount={signalFeedRender} />
    }
    render(<Tracker />)
    act(() => {
      jest.advanceTimersByTime(10_000)
      pushAppState('background')
      jest.advanceTimersByTime(STREAK_QUALIFYING_DWELL_MS + 100)
    })
    expect(readStreak(mockState.did)).toBeUndefined()
  })

  test('showStreak preference off short-circuits', () => {
    mockState.showStreak = false
    function Tracker() {
      const {signalFeedRender} = useStreakTracker()
      return <FeedRenderSignaller onMount={signalFeedRender} />
    }
    render(<Tracker />)
    act(() => {
      jest.advanceTimersByTime(STREAK_QUALIFYING_DWELL_MS + 100)
    })
    expect(readStreak(mockState.did)).toBeUndefined()
    expect(mockState.getProfileCalls).toBe(0)
  })

  test('flag off short-circuits and never reads storage', () => {
    mockState.featureOn = false
    function Tracker() {
      const {signalFeedRender} = useStreakTracker()
      return <FeedRenderSignaller onMount={signalFeedRender} />
    }
    render(<Tracker />)
    act(() => {
      jest.advanceTimersByTime(STREAK_QUALIFYING_DWELL_MS + 100)
    })
    expect(readStreak(mockState.did)).toBeUndefined()
    expect(mockState.getProfileCalls).toBe(0)
  })

  test('signed-out short-circuits', () => {
    mockState.hasSession = false
    function Tracker() {
      const {signalFeedRender} = useStreakTracker()
      return <FeedRenderSignaller onMount={signalFeedRender} />
    }
    render(<Tracker />)
    act(() => {
      jest.advanceTimersByTime(STREAK_QUALIFYING_DWELL_MS + 100)
    })
    expect(mockState.getProfileCalls).toBe(0)
  })

  test('AppState listener removed on unmount', () => {
    function Tracker() {
      const {signalFeedRender} = useStreakTracker()
      return <FeedRenderSignaller onMount={signalFeedRender} />
    }
    const {unmount} = render(<Tracker />)
    unmount()
    expect(mockState.appStateRemoveCount).toBeGreaterThan(0)
    expect(mockState.appStateListeners.length).toBe(0)
  })

  test('ActivityAndRecapProvider mounts the tracker and renders null', () => {
    const {toJSON} = render(<ActivityAndRecapProvider />)
    expect(toJSON()).toBeNull()
    act(() => {
      jest.advanceTimersByTime(STREAK_QUALIFYING_DWELL_MS + 100)
    })
    // Fallback path (R5): the provider doesn't wire a feed-render signal,
    // but the dwell alone qualifies per the documented fallback — so the
    // streak increments once on provider mount.
    const stored = readStreak(mockState.did)
    expect(stored?.currentStreak).toBe(1)
  })
})
