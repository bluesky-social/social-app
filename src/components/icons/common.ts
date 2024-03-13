import {StyleSheet, TextProps} from 'react-native'
import type {SvgProps, PathProps} from 'react-native-svg'

import {tokens} from '#/alf'

export type Props = {
  fill?: PathProps['fill']
  style?: TextProps['style']
  size?: keyof typeof sizes
} & Omit<SvgProps, 'style' | 'size'>

export const sizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
}

export function useCommonSVGProps(props: Props) {
  const {fill, size, ...rest} = props
  const style = StyleSheet.flatten(rest.style)
  const _fill = fill || style?.color || tokens.color.blue_500
  const _size = Number(size ? sizes[size] : rest.width || sizes.md)

  return {
    fill: _fill,
    size: _size,
    style,
    ...rest,
  }
}
