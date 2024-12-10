import React from 'react'

import {atoms as a} from '#/alf/atoms'
import {Breakpoint, useBreakpoints} from '#/alf/breakpoints'
import * as tokens from '#/alf/tokens'

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
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
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
      paddingTop: top === 0 ? 0 : gutters[top][activeBreakpoint || 'default'],
      paddingRight:
        right === 0 ? 0 : gutters[right][activeBreakpoint || 'default'],
      paddingBottom:
        bottom === 0 ? 0 : gutters[bottom][activeBreakpoint || 'default'],
      paddingLeft:
        left === 0 ? 0 : gutters[left][activeBreakpoint || 'default'],
    }
  }, [activeBreakpoint, top, bottom, left, right])
}

export function useGutterStyles({
  top,
  bottom,
}: {
  top?: boolean
  bottom?: boolean
} = {}) {
  const {gtMobile} = useBreakpoints()
  return React.useMemo<any>(() => {
    return [
      a.px_lg,
      top && a.pt_md,
      bottom && a.pb_md,
      gtMobile && [a.px_xl, top && a.pt_lg, bottom && a.pb_lg],
    ]
  }, [gtMobile, top, bottom])
}
