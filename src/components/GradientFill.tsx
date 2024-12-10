import {useMemo} from 'react'
import {LinearGradient} from 'expo-linear-gradient'

import {atoms as a, tokens, ViewStyleProp} from '#/alf'

export function GradientFill({
  gradient,
  rotate = '0deg',
  style,
}: ViewStyleProp & {
  gradient:
    | typeof tokens.gradients.primary
    | typeof tokens.gradients.sky
    | typeof tokens.gradients.midnight
    | typeof tokens.gradients.sunrise
    | typeof tokens.gradients.sunset
    | typeof tokens.gradients.bonfire
    | typeof tokens.gradients.summer
    | typeof tokens.gradients.nordic
  rotate?:
    | '0deg'
    | '45deg'
    | '90deg'
    | '135deg'
    | '180deg'
    | '225deg'
    | '270deg'
    | '315deg'
}) {
  if (gradient.values.length < 2) {
    throw new Error('Gradient must have at least 2 colors')
  }

  const {start, end} = useMemo(() => {
    return {
      '0deg': {
        start: {x: 0, y: 1},
        end: {x: 1, y: 1},
      },
      '45deg': {
        start: {x: 0, y: 0},
        end: {x: 1, y: 1},
      },
      '90deg': {
        start: {x: 1, y: 0},
        end: {x: 1, y: 1},
      },
      '135deg': {
        start: {x: 1, y: 0},
        end: {x: 0, y: 1},
      },
      '180deg': {
        start: {x: 1, y: 0},
        end: {x: 0, y: 0},
      },
      '225deg': {
        start: {x: 1, y: 1},
        end: {x: 0, y: 0},
      },
      '270deg': {
        start: {x: 0, y: 1},
        end: {x: 0, y: 0},
      },
      '315deg': {
        start: {x: 0, y: 1},
        end: {x: 1, y: 0},
      },
    }[rotate]
  }, [rotate])

  return (
    <LinearGradient
      colors={gradient.values.map(c => c[1]) as [string, string, ...string[]]}
      locations={
        gradient.values.map(c => c[0]) as [number, number, ...number[]]
      }
      start={start}
      end={end}
      style={[a.absolute, a.inset_0, style]}
    />
  )
}
