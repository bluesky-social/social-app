import {Dimensions} from 'react-native'
import {act, renderHook} from '@testing-library/react-native'

import {
  BreakpointWidthContext,
  useBreakpoints,
  useLayoutBreakpoints,
} from '#/alf/breakpoints.native'
import {
  getLayoutBreakpoints,
  shouldCenterNativeTabletContent,
} from '#/alf/breakpoints.shared'
import * as env from '#/env'

jest.mock('#/env', () => ({__esModule: true, IS_IPAD: true}))

const initialWindow = Dimensions.get('window')

function setWindowWidth(width: number) {
  act(() => {
    Dimensions.set({
      window: {width, height: 1133, scale: 2, fontScale: 1},
    })
  })
}

afterEach(() => {
  act(() => Dimensions.set({window: initialWindow}))
  jest.restoreAllMocks()
})

describe('iPad responsive layout', () => {
  it('keeps mini portrait compact and updates when its window rotates', () => {
    setWindowWidth(744)
    const {result, rerender} = renderHook(useBreakpoints)

    expect(result.current.gtMobile).toBe(false)
    expect(result.current.activeBreakpoint).toBe('gtPhone')

    setWindowWidth(1133)
    rerender({})
    expect(result.current.gtMobile).toBe(true)
    expect(result.current.gtTablet).toBe(false)

    setWindowWidth(375)
    rerender({})
    expect(result.current.activeBreakpoint).toBeUndefined()
  })

  it.each([
    [499, undefined],
    [500, 'gtPhone'],
    [799, 'gtPhone'],
    [800, 'gtMobile'],
    [1299, 'gtMobile'],
    [1300, 'gtTablet'],
  ] as const)('uses the web breakpoint at width %s', (width, expected) => {
    setWindowWidth(width)
    const {result} = renderHook(useBreakpoints)
    expect(result.current.activeBreakpoint).toBe(expected)
  })

  it('uses the presented sheet width for its descendants', () => {
    setWindowWidth(1366)
    const {result} = renderHook(useBreakpoints, {
      wrapper: ({children}) => (
        <BreakpointWidthContext value={320}>{children}</BreakpointWidthContext>
      ),
    })
    expect(result.current.gtPhone).toBe(false)
    expect(result.current.gtMobile).toBe(false)
  })

  it('preserves compact layouts on other native devices', () => {
    jest.replaceProperty(env, 'IS_IPAD', false)
    const subscribe = jest.spyOn(Dimensions, 'addEventListener')
    setWindowWidth(1366)
    const {result} = renderHook(useBreakpoints)
    expect(result.current).toEqual({
      gtPhone: false,
      gtMobile: false,
      gtTablet: false,
      activeBreakpoint: undefined,
    })
    expect(subscribe).not.toHaveBeenCalled()
  })

  it('does not change breakpoints for a height-only resize', () => {
    setWindowWidth(1024)
    const {result} = renderHook(useBreakpoints)
    const before = result.current

    act(() => {
      Dimensions.set({
        window: {width: 1024, height: 600, scale: 2, fontScale: 1},
      })
    })
    expect(result.current).toBe(before)
  })

  it('updates the sidebar layout without hiding native feed modules', () => {
    setWindowWidth(1099)
    const {result, rerender} = renderHook(useLayoutBreakpoints)
    expect(result.current.rightNavVisible).toBe(false)

    setWindowWidth(1100)
    rerender({})
    expect(result.current).toEqual({
      rightNavVisible: false,
      centerColumnOffset: true,
      leftNavMinimal: true,
    })

    setWindowWidth(1366)
    rerender({})
    expect(result.current).toEqual({
      rightNavVisible: false,
      centerColumnOffset: false,
      leftNavMinimal: false,
    })
  })

  it('preserves the web right rail threshold in the shared layout rules', () => {
    expect(getLayoutBreakpoints(1099).rightNavVisible).toBe(false)
    expect(getLayoutBreakpoints(1100).rightNavVisible).toBe(true)
    expect(getLayoutBreakpoints(1366).rightNavVisible).toBe(true)
  })

  it('does not apply a second native tablet offset to nested centered content', () => {
    expect(
      shouldCenterNativeTabletContent({
        isIPad: true,
        gtMobile: true,
        isWithinDialog: false,
        isWithinSplitView: false,
        isWithinOffsetView: true,
      }),
    ).toBe(false)
  })

  it('keeps full-bleed tablet content out of the centered column', () => {
    expect(
      shouldCenterNativeTabletContent({
        isIPad: true,
        gtMobile: true,
        isWithinDialog: false,
        isWithinSplitView: false,
        isWithinOffsetView: false,
        disabled: true,
      }),
    ).toBe(false)
  })
})
