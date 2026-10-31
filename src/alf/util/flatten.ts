import {type DimensionValue, type StyleProp} from 'react-native'
import {utils} from '@bsky.app/alf'

/**
 * Merges a style array into one object, for reading values. On web, this skips
 * precompiled styles such as `hover()`'s (see ALF's `utils.flatten`).
 *
 * Render the original style where you can: a flattened copy is a new object,
 * so on web its atoms lose their CSS classes and render inline.
 */
export function flatten<T>(
  style?: StyleProp<T>,
): T extends (infer U)[] ? U : T {
  return (utils.flatten(
    style as unknown as Parameters<typeof utils.flatten>[0],
  ) ?? {}) as T extends (infer U)[] ? U : T
}

/** Flatten React Native styles passed directly to a web-only DOM component. */
export function flattenToCSS(style: unknown): React.CSSProperties {
  return (utils.flatten(style as Parameters<typeof utils.flatten>[0]) ??
    {}) as React.CSSProperties
}

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
  const s = flatten(style)
  const base = num(s.padding)
  return {
    paddingTop: num(s.paddingTop) || num(s.paddingVertical) || base,
    paddingBottom: num(s.paddingBottom) || num(s.paddingVertical) || base,
    paddingLeft: num(s.paddingLeft) || num(s.paddingHorizontal) || base,
    paddingRight: num(s.paddingRight) || num(s.paddingHorizontal) || base,
  }
}
