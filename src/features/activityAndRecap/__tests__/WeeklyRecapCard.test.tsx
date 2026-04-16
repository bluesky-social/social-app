/**
 * WeeklyRecapCard tests (S13).
 *
 * Renders the card with mocked visibility, query, and analytics. Asserts:
 *   - hidden when useRecapCardVisibility returns null (B11, B5, B6, G7, X6)
 *   - zero-posts copy is the EXACT RECAP_ZERO_POSTS_COPY (B4)
 *   - tap fires recap:cardTapped + navigates with weekId (B3)
 *   - dismiss fires recap:cardDismissed + invokes useDismissRecapCard (B5)
 *   - recap:cardShown emits booleans-only payload (B12)
 *   - markRecapCardFirstShown stamped on first paint (B6)
 */

import React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render} from '@testing-library/react-native'

// Stop the bottom-sheet chain so RN module access doesn't crash the tests.
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

// Reanimated only contributes useReducedMotion to the WeeklyRecapCard tree.
// We don't need the full mock — a one-liner stub is enough.
jest.mock('react-native-reanimated', () => ({
  useReducedMotion: () => false,
}))

const mockState = {
  weekIso: '2026-W14' as string | null,
  did: 'did:plc:me' as string | undefined,
  data: undefined as
    | undefined
    | {
        postsCount: number
        followerDelta: number
        topPost: {uri: string; cid: string} | null
      },
  isLoading: false,
  isError: false,
  navigateCalls: [] as Array<{route: string; params: any}>,
  metricCalls: [] as Array<[string, any]>,
  dismissCalls: [] as string[],
  firstShownStamps: [] as Array<{did: string; weekIso: string}>,
}

jest.mock('#/features/activityAndRecap/hooks/useRecapCardVisibility', () => ({
  useRecapCardVisibility: () => mockState.weekIso,
}))
jest.mock('#/features/activityAndRecap/queries/weeklyRecap', () => ({
  useWeeklyRecapQuery: () => ({
    data: mockState.data,
    isLoading: mockState.isLoading,
    isError: mockState.isError,
  }),
}))
jest.mock('#/features/activityAndRecap/hooks/useDismissRecapCard', () => ({
  useDismissRecapCard: () => (weekIso: string) => {
    mockState.dismissCalls.push(weekIso)
  },
}))
jest.mock('#/features/activityAndRecap/storage', () => ({
  markRecapCardFirstShown: (did: string, weekIso: string, _utcMs: number) => {
    mockState.firstShownStamps.push({did, weekIso})
  },
}))
jest.mock('#/state/session', () => ({
  useSession: () => ({
    currentAccount: mockState.did ? {did: mockState.did} : undefined,
  }),
}))
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({
    metric: (...args: any[]) => {
      mockState.metricCalls.push(args as [string, any])
    },
  }),
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: (route: string, params: any) => {
      mockState.navigateCalls.push({route, params})
    },
  }),
}))

// Lingui descriptor → string. Mirrors StreakIndicator.test.tsx pattern.
// Babel-plugin-lingui-macro transforms `from '@lingui/react/macro'` →
// `from '@lingui/react'`, so we mock the runtime entry only.
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
  // Trans children may be a string OR a React element (e.g. when the
  // <Trans> body interpolates other components). Render the children as-is.
  function MockTrans({children}: {children: any}) {
    return children
  }
  return {
    useLingui: () => ({_: (d: any) => mockRenderDescriptor(d)}),
    Trans: MockTrans,
  }
})

import {WeeklyRecapCard} from '#/features/activityAndRecap/components/WeeklyRecapCard'
import {RECAP_ZERO_POSTS_COPY} from '#/features/activityAndRecap/constants'

beforeEach(() => {
  mockState.weekIso = '2026-W14'
  mockState.did = 'did:plc:me'
  mockState.data = {
    postsCount: 5,
    followerDelta: 2,
    topPost: {uri: 'at://x', cid: 'cid1'},
  }
  mockState.isLoading = false
  mockState.isError = false
  mockState.navigateCalls = []
  mockState.metricCalls = []
  mockState.dismissCalls = []
  mockState.firstShownStamps = []
})

describe('WeeklyRecapCard (S13)', () => {
  test('hidden when visibility predicate returns null (B11/B5/B6/G7)', () => {
    mockState.weekIso = null
    const {queryByTestId} = render(<WeeklyRecapCard />)
    expect(queryByTestId('weeklyRecapCard')).toBeNull()
  })

  test('renders metric tiles when data is present', () => {
    const {queryByTestId} = render(<WeeklyRecapCard />)
    expect(queryByTestId('weeklyRecapCard')).not.toBeNull()
    expect(queryByTestId('weeklyRecapCard-posts')).not.toBeNull()
    expect(queryByTestId('weeklyRecapCard-followers')).not.toBeNull()
    expect(queryByTestId('weeklyRecapCard-topPost')).not.toBeNull()
  })

  test('zero-posts: shows the exact RECAP_ZERO_POSTS_COPY string (B4)', () => {
    mockState.data = {postsCount: 0, followerDelta: 0, topPost: null}
    const {getByText, queryByTestId} = render(<WeeklyRecapCard />)
    expect(getByText(RECAP_ZERO_POSTS_COPY)).toBeTruthy()
    // Tiles are not rendered in the zero state.
    expect(queryByTestId('weeklyRecapCard-posts')).toBeNull()
  })

  test('tap fires recap:cardTapped and navigates to Recap with weekId (B3)', () => {
    const {getByTestId} = render(<WeeklyRecapCard />)
    fireEvent.press(getByTestId('weeklyRecapCard'))
    const tapped = mockState.metricCalls.find(c => c[0] === 'recap:cardTapped')
    expect(tapped).toBeDefined()
    expect(mockState.navigateCalls).toEqual([
      {route: 'Recap', params: {weekId: '2026-W14'}},
    ])
  })

  test('dismiss fires recap:cardDismissed and writes via useDismissRecapCard (B5)', () => {
    const {getByLabelText} = render(<WeeklyRecapCard />)
    fireEvent.press(getByLabelText('Dismiss recap'))
    const dismissed = mockState.metricCalls.find(
      c => c[0] === 'recap:cardDismissed',
    )
    expect(dismissed).toBeDefined()
    expect(mockState.dismissCalls).toEqual(['2026-W14'])
  })

  test('recap:cardShown payload contains booleans only (B12)', () => {
    render(<WeeklyRecapCard />)
    const shown = mockState.metricCalls.find(c => c[0] === 'recap:cardShown')
    expect(shown).toBeDefined()
    const payload = shown?.[1]
    expect(payload).toEqual({
      has_posts: true,
      has_top_post: true,
      has_follower_delta: true,
    })
    // Crucially: no numeric counts in the payload.
    expect(JSON.stringify(payload)).not.toMatch(/\d/)
  })

  test('markRecapCardFirstShown is stamped on first paint (B6)', () => {
    render(<WeeklyRecapCard />)
    expect(mockState.firstShownStamps).toEqual([
      {did: 'did:plc:me', weekIso: '2026-W14'},
    ])
  })
})
