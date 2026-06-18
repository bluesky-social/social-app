import {type StyleProp, type ViewStyle} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'

import {gradients} from '#/alf/tokens'

export function LinearGradientBackground({
  style,
  gradient = 'sky',
  colors: colorsOverride,
  children,
  start,
  end,
}: {
  style?: StyleProp<ViewStyle>
  gradient?: keyof typeof gradients
  /**
   * Explicit gradient stops, overriding the named `gradient` token. Useful for
   * gradients that must follow runtime state - e.g. the active accent colour -
   * since the named tokens are fixed at build time.
   */
  colors?: [string, string, ...string[]]
  children?: React.ReactNode
  start?: [number, number]
  end?: [number, number]
}) {
  const colors =
    colorsOverride ??
    (gradients[gradient].values.map(([_, color]) => {
      return color
    }) as [string, string, ...string[]])

  if (colors.length < 2) {
    throw new Error('Gradient must have at least 2 colors')
  }

  return (
    <LinearGradient colors={colors} style={style} start={start} end={end}>
      {children}
    </LinearGradient>
  )
}
