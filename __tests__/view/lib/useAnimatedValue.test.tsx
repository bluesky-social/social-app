import {renderHook} from '../../../jest/test-utils'
import {useAnimatedValue} from '../../../src/view/lib/hooks/useAnimatedValue'

describe('useAnimatedValue', () => {
  it('creates an Animated.Value with the initial value passed to the hook', () => {
    const {result} = renderHook(() => useAnimatedValue(10))
    // @ts-expect-error
    expect(result.current.__getValue()).toEqual(10)
  })

  it('returns the same Animated.Value instance on subsequent renders', () => {
    const {result, rerender} = renderHook(() => useAnimatedValue(10))
    const firstValue = result.current
    rerender({})
    expect(result.current).toBe(firstValue)
  })
})
