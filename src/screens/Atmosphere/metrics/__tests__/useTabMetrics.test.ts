import {act, renderHook} from '@testing-library/react-native'

import {type AtmosphereTab} from '../types'
import {useTabMetrics} from '../useTabMetrics'

const mockMetric = jest.fn()
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))

let mockFocusEffect: (() => void | (() => void)) | undefined
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    mockFocusEffect = effect
  },
}))

let mockAppStateListener: ((state: string) => void) | undefined
jest.mock('#/lib/appState', () => ({
  onAppStateChange: (listener: (state: string) => void) => {
    mockAppStateListener = listener
    return {remove: () => {}}
  },
}))

const TABS: AtmosphereTab[] = ['discover', 'following', 'explore', 'apps']

let blur: (() => void) | void
function focus() {
  blur = mockFocusEffect?.()
}

function setup() {
  const {result} = renderHook(() => useTabMetrics(TABS))
  act(focus)
  return result
}

beforeEach(() => {
  jest.useFakeTimers({now: 0})
  mockMetric.mockClear()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useTabMetrics', () => {
  it('logs the tab in view on each focus', () => {
    setup()
    expect(mockMetric).toHaveBeenCalledWith('atmosphere:tab:displayed', {
      tab: 'discover',
      reason: 'focus',
    })

    jest.setSystemTime(1000)
    act(() => blur?.())
    expect(mockMetric).toHaveBeenLastCalledWith('atmosphere:tab:duration', {
      tab: 'discover',
      durationMs: 1000,
      endReason: 'blurred',
    })

    act(focus)
    expect(mockMetric).toHaveBeenLastCalledWith('atmosphere:tab:displayed', {
      tab: 'discover',
      reason: 'focus',
    })
  })

  it('tells taps, swipes, and "See more" apart, once the pager settles', () => {
    const result = setup()
    mockMetric.mockClear()

    jest.setSystemTime(500)
    act(() => {
      result.current.onTabPressed(1)
      result.current.onPageSelected(1)
    })
    expect(mockMetric.mock.calls).toEqual([
      [
        'atmosphere:tab:duration',
        {tab: 'discover', durationMs: 500, endReason: 'switched'},
      ],
      [
        'atmosphere:tab:displayed',
        {tab: 'following', previousTab: 'discover', reason: 'tap'},
      ],
    ])

    act(() => result.current.onPageSelected(2))
    expect(mockMetric).toHaveBeenLastCalledWith('atmosphere:tab:displayed', {
      tab: 'explore',
      previousTab: 'following',
      reason: 'swipe',
    })

    // Web reports "See more" as a tab press, too
    act(() => {
      result.current.onSeeMoreApps(3)
      result.current.onTabPressed(3)
      result.current.onPageSelected(3)
    })
    expect(mockMetric).toHaveBeenLastCalledWith('atmosphere:tab:displayed', {
      tab: 'apps',
      previousTab: 'explore',
      reason: 'seeMoreApps',
    })

    // Reporting the same page again is not a switch
    mockMetric.mockClear()
    act(() => result.current.onPageSelected(3))
    expect(mockMetric).not.toHaveBeenCalled()
  })

  it('stops timing in the background, without logging a new display on return', () => {
    setup()
    mockMetric.mockClear()

    jest.setSystemTime(2000)
    act(() => mockAppStateListener?.('background'))
    expect(mockMetric.mock.calls).toEqual([
      [
        'atmosphere:tab:duration',
        {tab: 'discover', durationMs: 2000, endReason: 'backgrounded'},
      ],
    ])

    jest.setSystemTime(10000)
    act(() => mockAppStateListener?.('active'))
    jest.setSystemTime(10300)
    act(() => blur?.())
    expect(mockMetric.mock.calls.slice(1)).toEqual([
      [
        'atmosphere:tab:duration',
        {tab: 'discover', durationMs: 300, endReason: 'blurred'},
      ],
    ])
  })
})
