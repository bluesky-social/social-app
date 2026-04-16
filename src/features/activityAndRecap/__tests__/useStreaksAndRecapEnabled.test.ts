import {describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'

const mockUseSession = jest.fn()
const mockFeaturesEnabled = jest.fn()

jest.mock('#/state/session', () => ({
  useSession: () => mockUseSession(),
}))

jest.mock('#/analytics', () => ({
  useAnalytics: () => ({
    features: {
      enabled: (f: string) => mockFeaturesEnabled(f),
      StreaksAndRecapEnable: 'streaks_and_recap:enable',
    },
  }),
}))

// Imported after mocks.
import {useStreaksAndRecapEnabled} from '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled'

beforeEach(() => {
  mockUseSession.mockReset()
  mockFeaturesEnabled.mockReset()
})

describe('useStreaksAndRecapEnabled', () => {
  test('returns false without session even when flag on (AC-X6, AC-A7)', () => {
    mockUseSession.mockReturnValue({hasSession: false})
    mockFeaturesEnabled.mockReturnValue(true)
    const {result} = renderHook(() => useStreaksAndRecapEnabled())
    expect(result.current).toBe(false)
  })

  test('returns false with session but flag off (AC-X6)', () => {
    mockUseSession.mockReturnValue({hasSession: true})
    mockFeaturesEnabled.mockReturnValue(false)
    const {result} = renderHook(() => useStreaksAndRecapEnabled())
    expect(result.current).toBe(false)
  })

  test('returns true only when session and flag are both on', () => {
    mockUseSession.mockReturnValue({hasSession: true})
    mockFeaturesEnabled.mockReturnValue(true)
    const {result} = renderHook(() => useStreaksAndRecapEnabled())
    expect(result.current).toBe(true)
    expect(mockFeaturesEnabled).toHaveBeenCalledWith('streaks_and_recap:enable')
  })
})
