import {createContext} from 'react'

export type Breakpoint = 'gtPhone' | 'gtMobile' | 'gtTablet'

export const BREAKPOINTS = {
  phone: 500,
  mobile: 800,
  tablet: 1300,
  rightNav: 1100,
} as const

/** The available width inside a native sheet or other contained surface. */
export const BreakpointWidthContext = createContext<number | undefined>(
  undefined,
)

export function getBreakpoints(width: number): Record<Breakpoint, boolean> & {
  activeBreakpoint: Breakpoint | undefined
} {
  const gtPhone = width >= BREAKPOINTS.phone
  const gtMobile = width >= BREAKPOINTS.mobile
  const gtTablet = width >= BREAKPOINTS.tablet

  return {
    gtPhone,
    gtMobile,
    gtTablet,
    activeBreakpoint: gtTablet
      ? 'gtTablet'
      : gtMobile
        ? 'gtMobile'
        : gtPhone
          ? 'gtPhone'
          : undefined,
  }
}

export function getLayoutBreakpoints(width: number) {
  return {
    rightNavVisible: width >= BREAKPOINTS.rightNav,
    centerColumnOffset:
      width >= BREAKPOINTS.rightNav && width <= BREAKPOINTS.tablet,
    leftNavMinimal: width <= BREAKPOINTS.tablet,
  }
}

export function shouldCenterNativeTabletContent({
  gtMobile,
  isWithinDialog,
  isWithinSplitView,
  isWithinOffsetView,
  disabled = false,
}: {
  gtMobile: boolean
  isWithinDialog: boolean
  isWithinSplitView: boolean
  isWithinOffsetView: boolean
  disabled?: boolean
}) {
  return (
    gtMobile &&
    !isWithinDialog &&
    !isWithinSplitView &&
    !isWithinOffsetView &&
    !disabled
  )
}
