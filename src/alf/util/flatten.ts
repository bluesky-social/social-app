import {type DimensionValue, StyleSheet} from 'react-native'

export const flatten = StyleSheet.flatten

/**
 * Coerce a style value to a number. Padding values are typed as
 * `DimensionValue` (numbers, percentages, "auto", etc.) but our ALF atoms
 * are always plain numbers. Non-numeric values are treated as 0.
 */
function num(v: unknown): number {
  return typeof v === 'number' ? v : 0
}

interface PaddingStyle {
  padding?: DimensionValue
  paddingHorizontal?: DimensionValue
  paddingVertical?: DimensionValue
  paddingTop?: DimensionValue
  paddingBottom?: DimensionValue
  paddingLeft?: DimensionValue
  paddingRight?: DimensionValue
}

/**
 * Extract resolved padding values from a style object. Returns numbers for
 * each side, resolving shorthand properties (padding → paddingVertical →
 * paddingTop/paddingBottom, etc.). Values are expected to be numbers — any
 * non-numeric `DimensionValue` (e.g. percentages) is treated as 0.
 */
export function extractPadding(style: PaddingStyle | PaddingStyle[]) {
  const s = flatten(style as any) ?? {}
  const base = num(s.padding)
  return {
    paddingTop: num(s.paddingTop) || num(s.paddingVertical) || base,
    paddingBottom: num(s.paddingBottom) || num(s.paddingVertical) || base,
    paddingLeft: num(s.paddingLeft) || num(s.paddingHorizontal) || base,
    paddingRight: num(s.paddingRight) || num(s.paddingHorizontal) || base,
  }
}
