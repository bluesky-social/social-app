import React from 'react'

import {Breakpoint, tokens, useBreakpoints} from '#/alf'

type Gutter = 'compact' | 'base' | 'wide' | 0

const gutters: Record<
  Exclude<Gutter, 0>,
  Record<Breakpoint | 'default', number>
> = {
  compact: {
    default: tokens.space.sm,
    gtPhone: tokens.space.sm,
    gtMobile: tokens.space.md,
    gtTablet: tokens.space.md,
  },
  base: {
    default: tokens.space.lg,
    gtPhone: tokens.space.lg,
    gtMobile: tokens.space.xl,
    gtTablet: tokens.space.xl,
  },
  wide: {
    default: tokens.space.xl,
    gtPhone: tokens.space.xl,
    gtMobile: tokens.space._3xl,
    gtTablet: tokens.space._3xl,
  },
}

type Gutters = {
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
}

export function useGutters([all]: [Gutter]): Gutters
export function useGutters([vertical, horizontal]: [Gutter, Gutter]): Gutters
export function useGutters([top, right, bottom, left]: [
  Gutter,
  Gutter,
  Gutter,
  Gutter,
]): Gutters
export function useGutters([top, right, bottom, left]: Gutter[]) {
  const {activeBreakpoint} = useBreakpoints()
  return React.useMemo(() => {
    if (!right) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      right = bottom = left = top
    } else if (!bottom || !left) {
      bottom = top
      left = right
    }

    return {
      paddingTop:
        top === 0 ? undefined : gutters[top][activeBreakpoint || 'default'],
      paddingRight:
        right === 0 ? undefined : gutters[right][activeBreakpoint || 'default'],
      paddingBottom:
        bottom === 0
          ? undefined
          : gutters[bottom][activeBreakpoint || 'default'],
      paddingLeft:
        left === 0 ? undefined : gutters[left][activeBreakpoint || 'default'],
    }
  }, [activeBreakpoint, top, bottom, left, right])
}
