import {StyleSheet, type TextProps} from 'react-native'
import {type PathProps, type SvgProps} from 'react-native-svg'
import {Defs, LinearGradient, Stop} from 'react-native-svg'
import {nanoid} from 'nanoid/non-secure'

import {tokens, useTheme} from '#/alf'

export type Props = {
  fill?: PathProps['fill']
  style?: TextProps['style']
  size?: keyof typeof sizes
  gradient?: keyof typeof tokens.gradients
} & Omit<SvgProps, 'style' | 'size'>

export const sizes = {
  '2xs': 8,
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const

/**
 * Size tokens set the width; otherwise preserve explicit dimensions and infer
 * the missing dimension from the viewBox. Icons default to a width of 20.
 */
export function useCommonSVGProps(props: Props, defaultViewBox = '0 0 24 24') {
  const t = useTheme()
  const {
    fill,
    size,
    gradient,
    viewBox = defaultViewBox,
    width,
    height,
    ...rest
  } = props
  const style = StyleSheet.flatten(rest.style)
  const bounds = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  const ratio =
    bounds.length === 4 &&
    bounds.every(Number.isFinite) &&
    bounds[2] > 0 &&
    bounds[3] > 0
      ? bounds[2] / bounds[3]
      : 1
  const resolvedWidth = size
    ? sizes[size]
    : width !== undefined
      ? Number(width)
      : height !== undefined
        ? Number(height) * ratio
        : sizes.md
  const resolvedHeight =
    !size && height !== undefined ? Number(height) : resolvedWidth / ratio
  let _fill = fill || style?.color || t.palette.primary_500
  let gradientDef = null

  if (gradient && tokens.gradients[gradient]) {
    const id = gradient + '_' + nanoid()
    const config = tokens.gradients[gradient]
    _fill = `url(#${id})`
    gradientDef = (
      <Defs>
        <LinearGradient
          id={id}
          x1="0"
          y1="0"
          x2="100%"
          y2="0"
          gradientTransform="rotate(45)">
          {config.values.map(([stop, fill]) => (
            <Stop key={stop} offset={stop} stopColor={fill} />
          ))}
        </LinearGradient>
      </Defs>
    )
  }

  return {
    fill: _fill,
    width: resolvedWidth,
    height: resolvedHeight,
    viewBox,
    style,
    gradient: gradientDef,
    ...rest,
  }
}
