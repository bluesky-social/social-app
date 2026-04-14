import {describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'

jest.mock('#/analytics', () => ({
  useAnalytics: jest.fn(),
}))
jest.mock('#/state/session', () => ({
  useSession: jest.fn(),
}))

import {useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'
import {useQuickReactsEnabled} from '#/features/quickReact/hooks/useQuickReactsEnabled'

const mockSession = useSession as jest.MockedFunction<typeof useSession>
const mockAnalytics = useAnalytics as jest.MockedFunction<typeof useAnalytics>

function setup({flag, signedIn}: {flag: boolean; signedIn: boolean}) {
  mockSession.mockReturnValue({hasSession: signedIn} as any)
  const enabled = jest.fn<(f: any) => boolean>().mockReturnValue(flag)
  mockAnalytics.mockReturnValue({
    features: {
      QuickReactionsV0: 'quick_reactions_v0',
      enabled,
    },
  } as any)
  return {enabled}
}

describe('useQuickReactsEnabled', () => {
  test('returns false when flag OFF regardless of session', () => {
    setup({flag: false, signedIn: true})
    const {result} = renderHook(() => useQuickReactsEnabled())
    expect(result.current).toBe(false)
  })

  test('returns false when signed-out regardless of flag', () => {
    const {enabled} = setup({flag: true, signedIn: false})
    const {result} = renderHook(() => useQuickReactsEnabled())
    expect(result.current).toBe(false)
    // short-circuit: never even queried the flag
    expect(enabled).not.toHaveBeenCalled()
  })

  test('returns true only when both flag ON and session present', () => {
    setup({flag: true, signedIn: true})
    const {result} = renderHook(() => useQuickReactsEnabled())
    expect(result.current).toBe(true)
  })

  test('re-renders when flag flips at runtime', () => {
    const {enabled} = setup({flag: false, signedIn: true})
    const {result, rerender} = renderHook(() => useQuickReactsEnabled())
    expect(result.current).toBe(false)
    enabled.mockReturnValue(true)
    // Force the analytics mock object identity to change so re-render actually
    // re-invokes the hook body.
    mockAnalytics.mockReturnValue({
      features: {QuickReactionsV0: 'quick_reactions_v0', enabled},
    } as any)
    rerender({})
    expect(result.current).toBe(true)
  })
})
