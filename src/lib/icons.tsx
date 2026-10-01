import {
  type StyleProp,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from 'react-native'

import {useTheme} from '#/alf'
import {NanoGlyph} from '#/components/icons/nano'

/**
 * Resolves the colour the old `stroke="currentColor"` SVGs inherited from
 * `style.color`.
 */
function useCurrentColor(style: StyleProp<ViewStyle | TextStyle>) {
  const t = useTheme()
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined
  return flattened?.color ?? t.atoms.text.color
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function MagnifyingGlassIcon({
  style,
  size,
  strokeWidth = 2,
  color,
}: {
  style?: StyleProp<ViewStyle>
  size?: number
  strokeWidth?: 2 | 3
  color?: string
}) {
  const currentColor = useCurrentColor(style)
  return (
    <NanoGlyph
      name={
        strokeWidth === 3
          ? 'LegacyMagnifyingGlass_Stroke3'
          : 'LegacyMagnifyingGlass_Stroke2'
      }
      size={size || 24}
      color={color ?? currentColor}
      style={style}
    />
  )
}

export function InfoCircleIcon({
  style,
  size = 24,
}: {
  style?: StyleProp<TextStyle>
  size?: number
  /** The glyph is drawn at the historical 1.5 stroke width. */
  strokeWidth?: 1.5
}) {
  const currentColor = useCurrentColor(style)
  return (
    <NanoGlyph
      name="LegacyInfoCircle"
      size={size}
      color={currentColor}
      style={style}
    />
  )
}
