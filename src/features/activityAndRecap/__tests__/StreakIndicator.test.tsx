/**
 * StreakIndicator tests (S9).
 *
 * Renders the native variant via the testing-library/react-native renderer
 * with mocked collaborators. Asserts visibility rules (AC-A4/A6/A7/G4)
 * and zero-footprint behavior when the flag is off (AC-X6).
 */

import React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {render} from '@testing-library/react-native'

// Stop the Dialog → bottom-sheet → BottomSheetNativeComponent chain at a
// stub so the test doesn't try to read Platform.Version from a real
// native module.
jest.mock('#/../modules/bottom-sheet', () => ({
  __esModule: true,
  BottomSheet: () => null,
}))

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

const mockState = {
  featureOn: true,
  hasSession: true,
  did: 'did:plc:me' as string | undefined,
  showStreak: true,
  storeReadCount: 0,
  storeValue: undefined as
    | undefined
    | {currentStreak: number; longestStreak: number},
  dialogOpenCount: 0,
}

jest.mock(
  '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled',
  () => ({
    useStreaksAndRecapEnabled: () => mockState.featureOn,
  }),
)
jest.mock('#/features/activityAndRecap/hooks/useShowStreakPreference', () => ({
  useShowStreakPreference: () => [mockState.showStreak, () => {}],
}))
jest.mock('#/features/activityAndRecap/hooks/useStreakStore', () => ({
  useStreakStore: () => {
    mockState.storeReadCount += 1
    return mockState.storeValue
  },
}))
jest.mock('#/state/session', () => ({
  useSession: () => ({
    hasSession: mockState.hasSession,
    currentAccount: mockState.hasSession ? {did: mockState.did} : undefined,
  }),
}))
jest.mock(
  '#/features/activityAndRecap/components/StreakExplainerDialog',
  () => ({
    StreakExplainerDialog: () => null,
    useStreakExplainerControl: () => ({
      open: () => {
        mockState.dialogOpenCount += 1
      },
      close: () => {},
    }),
  }),
)

// Lingui needs an i18n context provider; stub the hook so we don't need to
// mount one. Macros compile to a `{id, message, values}` descriptor.
jest.mock('@lingui/react', () => {
  function mockRenderDescriptor(d: any): string {
    if (typeof d === 'string') return d
    if (!d) return ''
    let out: string = d.message ?? d.id ?? ''
    const values = d.values ?? {}
    out = out.replace(
      /\{(\w+),\s*plural,\s*one\s*\{#\s*([^}]+)\}\s*other\s*\{#\s*([^}]+)\}\}/g,
      (_m: string, key: string, _one: string, other: string) => {
        const n = values[key]
        return `${n} ${other}`
      },
    )
    out = out.replace(/\{(\w+)\}/g, (_m: string, key: string) =>
      values[key] !== undefined ? String(values[key]) : `{${key}}`,
    )
    return out
  }
  return {
    useLingui: () => ({_: (d: any) => mockRenderDescriptor(d)}),
  }
})

import {StreakIndicator} from '#/features/activityAndRecap/components/StreakIndicator'

beforeEach(() => {
  mockState.featureOn = true
  mockState.hasSession = true
  mockState.did = 'did:plc:me'
  mockState.showStreak = true
  mockState.storeReadCount = 0
  mockState.storeValue = {currentStreak: 5, longestStreak: 10}
  mockState.dialogOpenCount = 0
})

describe('StreakIndicator (S9)', () => {
  test('renders when streak >= 2 and all gates pass', () => {
    const {queryByTestId} = render(<StreakIndicator />)
    expect(queryByTestId('streakIndicator')).not.toBeNull()
  })

  test('hidden when currentStreak < 2 (G4)', () => {
    mockState.storeValue = {currentStreak: 1, longestStreak: 1}
    const {queryByTestId} = render(<StreakIndicator />)
    expect(queryByTestId('streakIndicator')).toBeNull()
  })

  test('hidden when streak store is undefined (no visits yet)', () => {
    mockState.storeValue = undefined
    const {queryByTestId} = render(<StreakIndicator />)
    expect(queryByTestId('streakIndicator')).toBeNull()
  })

  test('hidden when hasSession is false (A7)', () => {
    // useStreaksAndRecapEnabled() encapsulates the hasSession gate; when
    // there is no session, it returns false regardless of the flag.
    mockState.hasSession = false
    mockState.featureOn = false
    const {queryByTestId} = render(<StreakIndicator />)
    expect(queryByTestId('streakIndicator')).toBeNull()
  })

  test('hidden when showStreak preference is off (X1)', () => {
    mockState.showStreak = false
    const {queryByTestId} = render(<StreakIndicator />)
    expect(queryByTestId('streakIndicator')).toBeNull()
  })

  test('feature flag off → returns null before any storage read (X6)', () => {
    mockState.featureOn = false
    const {queryByTestId} = render(<StreakIndicator />)
    expect(queryByTestId('streakIndicator')).toBeNull()
    expect(mockState.storeReadCount).toBe(0)
  })

  test('contains accessibilityLabel mentioning the streak count', () => {
    mockState.storeValue = {currentStreak: 3, longestStreak: 7}
    const {getByTestId} = render(<StreakIndicator />)
    const node = getByTestId('streakIndicator')
    const label = (node.props.accessibilityLabel as string | undefined) ?? ''
    expect(label).toMatch(/3/)
    expect(label.toLowerCase()).toContain('streak')
  })
})
